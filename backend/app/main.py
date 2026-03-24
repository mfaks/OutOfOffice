from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, trip

app = FastAPI()
app.include_router(auth.router)
app.include_router(trip.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)


@app.get("/")
async def root():
    return {"message": "Hello World"}
