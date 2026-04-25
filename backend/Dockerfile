FROM python:3.12-slim

RUN useradd --create-home appuser

WORKDIR /app

COPY --chmod=644 requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chmod=755 . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["fastapi", "run", "--host", "0.0.0.0"]
