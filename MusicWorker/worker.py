import json
import pika

from config import (
    RABBITMQ_HOST,
    RABBITMQ_PORT,
    RABBITMQ_USER,
    RABBITMQ_PASSWORD,
    RABBITMQ_QUEUE
)

from consumers.music_upload_consumer import (
    handle_music_upload
)


def process_message(
    channel,
    method,
    properties,
    body
):

    try:

        message = json.loads(
            body.decode("utf-8")
        )

        print(
            f"Received message: {message}"
        )

        handle_music_upload(
            message
        )

        # Processing succeeded
        channel.basic_ack(
            delivery_tag=method.delivery_tag
        )

    except Exception as e:

        print(
            f"Message processing failed: {e}"
        )

        # Processing failed
        channel.basic_nack(
            delivery_tag=method.delivery_tag,
            requeue=True
        )


def main():

    credentials = pika.PlainCredentials(
        RABBITMQ_USER,
        RABBITMQ_PASSWORD
    )

    parameters = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials
    )

    connection = pika.BlockingConnection(
        parameters
    )

    channel = connection.channel()

    channel.queue_declare(
        queue=RABBITMQ_QUEUE,
        durable=True
    )

    channel.basic_qos(
        prefetch_count=1
    )

    channel.basic_consume(
        queue=RABBITMQ_QUEUE,
        on_message_callback=process_message
    )

    print(
        f"Worker listening on "
        f"{RABBITMQ_QUEUE}"
    )

    channel.start_consuming()


if __name__ == "__main__":
    main()