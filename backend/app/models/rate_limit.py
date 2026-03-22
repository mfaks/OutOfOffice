from datetime import date

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class RateLimit(SQLModel, table=True):
    __tablename__ = "ratelimit"
    __table_args__ = (UniqueConstraint("key", "date"),)

    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(index=True)  # "ip:<address>" or "user:<id>"
    date: date
    request_count: int = Field(default=0)
    refinement_count: int = Field(default=0)
