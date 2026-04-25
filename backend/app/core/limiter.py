from starlette.requests import Request
from slowapi import Limiter

from app.config import settings

# Help function for the rate limiter to get the real client IP; CloudFront forwards the original client IP in X-Forwarded-For; fall back to the direct connection IP
def _real_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host


# Rate limiter for the API using Redis for storage; uses the real client IP as the key (see _real_ip)
limiter = Limiter(key_func=_real_ip, storage_uri=settings.redis_url)
