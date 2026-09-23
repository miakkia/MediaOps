FROM python:3.13.15-alpine

WORKDIR /app

RUN pip install --no-cache-dir \
    flask==3.1.3 \
    requests==2.34.2 \
    'urllib3>=2.7.0,<3' \
    gunicorn==26.2.0 \
    && mkdir -p /data \
    && chown 1000:1000 /data

COPY app.py /app/app.py
COPY provider_router.py /app/provider_router.py

# Run the provider-facing webhook router as an unprivileged user. The router
# only needs to read application code and write its small index under /data.
USER 1000:1000

# The router keeps a tiny file-backed thread index. A single Gunicorn worker
# prevents two provider events from racing across separate processes while
# still allowing concurrent requests through threads.
CMD ["gunicorn", "-b", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--access-logfile", "-", "--no-control-socket", "provider_router:app"]
