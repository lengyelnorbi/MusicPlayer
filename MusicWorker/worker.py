import asyncio
import json
import logging

import aio_pika
from aio_pika import DeliveryMode, Message

from config import (
    CONTROL_QUEUE,
    COMPLETED_QUEUE,
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
from music_service import ProxyForbiddenError, download_audio

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("music-worker")
resume_event = asyncio.Event()
single_resume_event = asyncio.Event()
# Do not consume queued work automatically after a worker restart. The API
# sends Resume only after the user explicitly starts or retries a job.


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


async def publish_completion(channel, payload: dict) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    await channel.default_exchange.publish(
        Message(
            body=body,
            content_type="application/json",
            delivery_mode=DeliveryMode.PERSISTENT,
        ),
        routing_key=COMPLETED_QUEUE,
        mandatory=True,
    )


def get_message_value(payload: dict, *keys: str):
    for key in keys:
        if payload.get(key) is not None:
            return payload[key]
    raise KeyError(f"Missing required field: {keys[0]}")


async def on_message(message: aio_pika.IncomingMessage, channel, queue_name: str) -> None:
    event = single_resume_event if queue_name == SINGLE_WORK_QUEUE else resume_event
    await event.wait()
    try:
        payload = json.loads(message.body.decode("utf-8"))
        job_id = str(get_message_value(payload, "JobId", "jobId"))
        work_item_id = str(get_message_value(payload, "WorkItemId", "workItemId"))
        # Preserve the ID type: ASP.NET Identity IDs are often strings, not integers.
        user_id = get_message_value(payload, "UserId", "userId")
        url = str(get_message_value(payload, "Url", "SourceUrl", "FileUrl", "url"))
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        logger.error("Rejecting invalid work message: %s", exc)
        await message.reject(requeue=False)
        return

    logger.info("Processing work item %s for job %s", work_item_id, job_id)

    try:
        try:
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
            logger.error("Pausing worker after proxy rejection for work item %s", work_item_id)
            result = completion_payload(
                job_id,
                work_item_id,
                user_id,
                success=False,
                forbidden=True,
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


async def on_control_message(message: aio_pika.IncomingMessage) -> None:
    try:
        payload = json.loads(message.body.decode("utf-8"))
        if payload.get("Action") == "Resume":
            resume_event.set()
        elif payload.get("Action") == "ResumeSingle":
            single_resume_event.set()
        await message.ack()
    except Exception:
        logger.exception("Invalid worker control message")
        await message.reject(requeue=False)


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
        queue = await channel.get_queue(WORK_QUEUE)
        single_queue = await channel.get_queue(SINGLE_WORK_QUEUE)

        logger.info(
            "Listening on queue '%s'; completion queue '%s'; temp path '%s'",
            WORK_QUEUE,
            COMPLETED_QUEUE,
            MUSIC_TEMP_PATH,
        )
        await queue.consume(
            lambda message: on_message(message, channel, WORK_QUEUE), no_ack=False
        )
        await single_queue.consume(
            lambda message: on_message(message, channel, SINGLE_WORK_QUEUE), no_ack=False
        )
        await control_queue.consume(on_control_message, no_ack=False)
        await asyncio.Future()  # Keep the worker alive until the container stops.


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker stopped")
