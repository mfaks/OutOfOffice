from fastapi import APIRouter

router = APIRouter()


# Endpoint to check the health of the backend
@router.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
