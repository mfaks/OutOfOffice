from fastapi import APIRouter

router = APIRouter()


# Return a liveness status for health check probes
@router.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
