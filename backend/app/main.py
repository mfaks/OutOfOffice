from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.db.session import engine
from app.routers import auth, trip


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
