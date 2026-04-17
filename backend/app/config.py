from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    serpapi_api_key: str
    openai_api_key: str
    redis_url: str
    cors_origins: str = "http://localhost:5173"


settings = Settings()
