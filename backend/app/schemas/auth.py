from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""


class UserRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
