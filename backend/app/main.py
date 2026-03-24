from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.db.session import engine
from app.models.saved_trip import SavedTrip  # noqa: F401 — ensures table is created
from app.routers import auth, saved_trips, trip, user


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup: {e}")
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(auth.router)
app.include_router(trip.router)
app.include_router(user.router)
app.include_router(saved_trips.router)


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)


@app.get("/")
async def root():
    return {"message": "Hello World"}
