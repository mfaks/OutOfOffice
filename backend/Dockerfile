# Slim base keeps the image small without requiring Alpine toolchain
FROM python:3.12-slim

# Non-root user for least-privilege runtime
RUN useradd --create-home appuser

WORKDIR /app

# Copy requirements before source so this layer is cache-stable across code-only rebuilds
COPY --chmod=644 requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chmod=755 . .

USER appuser

EXPOSE 8000

# start-period gives FastAPI time to initialize the Redis checkpoint saver before probes begin
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["fastapi", "run", "--host", "0.0.0.0"]
