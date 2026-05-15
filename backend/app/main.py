from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.redis.aio import AsyncRedisSaver
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.limiter import limiter
from app.internal.agents.pipeline import build_graph
from app.routers import health, trip


# Connect the Redis checkpoint saver and compile the agent graph
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncRedisSaver.from_conn_string(settings.redis_url) as checkpointer:
        await checkpointer.asetup()
        app.state.graph = build_graph(checkpointer)
        yield


app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(health.router)
app.include_router(trip.router, prefix="/api")


# comma separated so multiple origins work across environments without code changes
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)
