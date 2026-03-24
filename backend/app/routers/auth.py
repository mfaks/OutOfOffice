from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/auth", tags=["auth"])

# Auth is not yet implemented for local dev.
# These endpoints will be fully wired in the AWS deployment.


@router.post("/register")
def register():
    raise HTTPException(status_code=501, detail="Auth not yet implemented.")


@router.post("/login")
def login():
    raise HTTPException(status_code=501, detail="Auth not yet implemented.")
