FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .
COPY config.py .
COPY services ./services
COPY consumers ./consumers

RUN mkdir -p /app/var/secrets/google-drive

COPY musicplayer-api-3abee89ba528.json /app/var/secrets/google-drive/

CMD ["python", "worker.py"]