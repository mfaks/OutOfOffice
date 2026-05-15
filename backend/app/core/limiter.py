from slowapi import Limiter
from starlette.requests import Request

from app.config import settings


# Read the forwarded for header when present and fall back to the direct connection address
def _real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host


# redis backed so rate limits survive restarts and work across multiple workers
limiter = Limiter(key_func=_real_ip, storage_uri=settings.redis_url)
