FROM python:3.13-alpine

WORKDIR /app

RUN pip install --no-cache-dir \
    flask==3.1.3 \
    requests==2.34.2 \
    gunicorn==23.0.0

COPY app.py /app/app.py
COPY provider_router.py /app/provider_router.py

CMD ["gunicorn", "-b", "0.0.0.0:8080", "--workers", "2", "--threads", "2", "--access-logfile", "-", "provider_router:app"]
