from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.redis.aio import AsyncRedisSaver
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.limiter import limiter
from app.internal.agents.pipeline import build_graph
from app.routers import auth, trip


# Lifespan to initialize the Redis checkpoint saver and the graph
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncRedisSaver.from_conn_string(settings.redis_url) as checkpointer:
        await checkpointer.asetup()
        app.state.graph = build_graph(checkpointer)
        yield


# Create the FastAPI app
app = FastAPI(lifespan=lifespan)

# Add the rate limiter to the app state
app.state.limiter = limiter

# Add the exception handler for rate limit exceeded to the app
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include the routers
app.include_router(auth.router, prefix="/api")
app.include_router(trip.router, prefix="/api")

# Expose the metrics endpoint for Prometheus to scrape
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Add the CORS middleware to only allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)
