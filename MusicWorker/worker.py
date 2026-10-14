import asyncio
import json
import logging

import aio_pika
from aio_pika import DeliveryMode, Message

from config import (
    CONTROL_QUEUE,
    COMPLETED_QUEUE,
    DOWNLOAD_CONCURRENCY,
    LOG_LEVEL,
    MUSIC_TEMP_PATH,
    RABBITMQ_HOST,
    RABBITMQ_PASSWORD,
    RABBITMQ_PORT,
    RABBITMQ_USERNAME,
    RABBITMQ_VHOST,
    SINGLE_WORK_QUEUE,
    WORK_QUEUE,
)
from music_service import (
    AgeRestrictedError,
    ContentUnavailableError,
    ProxyForbiddenError,
    download_audio,
)

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("music-worker")
# Limit the number of concurrent downloads to avoid triggering YouTube's anti-bot measures.
download_semaphore = asyncio.Semaphore(DOWNLOAD_CONCURRENCY)
resume_event = asyncio.Event()
single_resume_event = asyncio.Event()
# Do not consume queued work automatically after a worker restart. The API
# sends Resume only after the user explicitly starts or retries a job.

# Completion payloads are sent to the API for each work item, and the API
# aggregates them into a single job completion event. The API then notifies the user via WebSocket. The API expects PascalCase keys to match the C# DTO.
def completion_payload(
    job_id: str,
    work_item_id: str,
    user_id,
    *,
    success: bool,
    file_path: str | None = None,
    file_name: str | None = None,
    title: str | None = None,
    error: str | None = None,
    forbidden: bool = False,
) -> dict:
    # Keep PascalCase to match the C# completion-message DTO.
    return {
        "JobId": job_id,
        "WorkItemId": work_item_id,
        "UserId": user_id,
        "Success": success,
        "FilePath": file_path,
        "FileName": file_name,
        "Title": title,
        "Error": error,
        "Forbidden": forbidden,
    }

# Publish a completion event to the COMPLETED_QUEUE for the API to process.
async def publish_completion(channel, payload: dict) -> None:
    # Keep PascalCase to match the C# completion-message DTO.
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    # Use mandatory=True to ensure the message is routed to a queue; if no queue is bound, the message will be returned and an exception will be raised.
    await channel.default_exchange.publish(
        Message(
            body=body,
            content_type="application/json",
            delivery_mode=DeliveryMode.PERSISTENT,
        ),
        routing_key=COMPLETED_QUEUE,
        mandatory=True,
    )

# Extract a value from the message payload, trying multiple possible keys for compatibility with different message formats.
def get_message_value(payload: dict, *keys: str):
    for key in keys:
        if payload.get(key) is not None:
            return payload[key]
    raise KeyError(f"Missing required field: {keys[0]}")

# Handle incoming work messages from the queue, download the audio, and publish a completion event.
async def on_message(message: aio_pika.IncomingMessage, channel, queue_name: str) -> None:
    # Wait for the resume event to be set before processing the message. This allows the worker to pause and resume based on control messages from the API.
    event = single_resume_event if queue_name == SINGLE_WORK_QUEUE else resume_event
    await event.wait()
    try:
        # Parse the message payload and extract required fields. The payload may have different key names depending on the source, so we try multiple keys for compatibility.
        payload = json.loads(message.body.decode("utf-8"))
        # Extract required fields from the payload, trying multiple possible keys for compatibility with different message formats.
        job_id = str(get_message_value(payload, "JobId", "jobId"))
        # Extract the work item ID, preserving its type as a string to match ASP.NET Identity IDs, which are often strings rather than integers.
        work_item_id = str(get_message_value(payload, "WorkItemId", "workItemId"))
        # Preserve the ID type: ASP.NET Identity IDs are often strings, not integers.
        user_id = get_message_value(payload, "UserId", "userId")
        # Extract the URL from the payload, trying multiple possible keys for compatibility with different message formats.
        url = str(get_message_value(payload, "Url", "SourceUrl", "FileUrl", "url"))
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.error("Rejecting invalid work message: %s", exc)
        await message.reject(requeue=False)
        return

    logger.info("Processing work item %s for job %s", work_item_id, job_id)

    try:
        try:
            # Both queues share this semaphore so a playlist and a manually
            # started item cannot download from YouTube at the same time.
            async with download_semaphore:
                logger.info(
                    "Downloading work item %s with concurrency limit %s",
                    work_item_id,
                    DOWNLOAD_CONCURRENCY,
                )
                output_path, title = await asyncio.to_thread(
                    download_audio, url, work_item_id
                )
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=True,
                file_path=output_path.relative_to(MUSIC_TEMP_PATH).as_posix(),
                file_name=output_path.name,
                title=title,
            )
        except ProxyForbiddenError as exc:
            logger.error("Pausing worker after source/IP rejection for work item %s", work_item_id)
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=False,
                forbidden=True,
                error=str(exc)[:1000],
            )
        except ContentUnavailableError as exc:
            logger.warning("Content is unavailable for work item %s: %s", work_item_id, exc)
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=False,
                error=str(exc)[:1000],
            )
        except AgeRestrictedError as exc:
            logger.warning("Age-restricted content for work item %s: %s", work_item_id, exc)
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=False,
                error=str(exc)[:1000],
            )
        except Exception as exc:
            logger.exception("Download failed for work item %s", work_item_id)
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=False,
                error=str(exc)[:1000] or type(exc).__name__,
            )

        # Acknowledge the input only after its completion event is published.
        await publish_completion(channel, result)
        await message.ack()
        if result.get("Forbidden"):
            # A proxy rejection pauses every route, including work already
            # queued for individual execution.
            resume_event.clear()
            single_resume_event.clear()
        logger.info("Published completion for work item %s", work_item_id)
    except Exception:
        logger.exception("Could not publish completion; requeueing work item %s", work_item_id)
        if not message.processed:
            await message.nack(requeue=True)

# Handle control messages from the API to pause or resume the worker. The API sends a "Resume" action to allow the worker to continue processing queued work after a pause.
async def on_control_message(message: aio_pika.IncomingMessage) -> None:
    try:
        # Parse the control message payload and check the action. If the action is "Resume", set the resume event to allow the worker to continue processing queued work. If the action is "ResumeSingle", set the single resume event to allow a single work item to be processed.
        payload = json.loads(message.body.decode("utf-8"))
        if payload.get("Action") == "Resume":
            resume_event.set()
        elif payload.get("Action") == "ResumeSingle":
            single_resume_event.set()
        # Acknowledge the control message after processing it to prevent re-delivery.
        await message.ack()
    except Exception:
        logger.exception("Invalid worker control message")
        await message.reject(requeue=False)

# Main entry point for the worker. Connects to RabbitMQ, declares the necessary queues, and starts consuming messages from the work and control queues. The worker will continue running until it is stopped or interrupted.
async def main() -> None:
    MUSIC_TEMP_PATH.mkdir(parents=True, exist_ok=True)

    connection = await aio_pika.connect_robust(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        login=RABBITMQ_USERNAME,
        password=RABBITMQ_PASSWORD,
        virtualhost=RABBITMQ_VHOST,
    )

    async with connection:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        await channel.declare_queue(WORK_QUEUE, durable=True)
        await channel.declare_queue(SINGLE_WORK_QUEUE, durable=True)
        await channel.declare_queue(COMPLETED_QUEUE, durable=True)
        control_queue = await channel.declare_queue(CONTROL_QUEUE, durable=True)
        single_queue = await channel.get_queue(SINGLE_WORK_QUEUE)

        logger.info(
            "Listening on serial queue '%s'; completion queue '%s'; temp path '%s'",
            SINGLE_WORK_QUEUE,
            COMPLETED_QUEUE,
            MUSIC_TEMP_PATH,
        )
        # Start consuming messages from the single work queue and control queue. The worker will process messages as they arrive, handling each work item and publishing completion events to the API.
        await single_queue.consume(
            lambda message: on_message(message, channel, SINGLE_WORK_QUEUE), no_ack=False
        )
        # Start consuming messages from the control queue to handle pause and resume actions. The worker will respond to control messages to manage its processing state.
        await control_queue.consume(on_control_message, no_ack=False)
        await asyncio.Future()  # Keep the worker alive until the container stops.


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped")
