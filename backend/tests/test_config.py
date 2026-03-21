import pytest
from pydantic import ValidationError

from app.config import Settings


def test_settings_loads_api_key(monkeypatch):
    monkeypatch.setenv("SERPAPI_API_KEY", "test-key-123")
    settings = Settings()
    assert settings.serpapi_api_key == "test-key-123"


def test_settings_missing_api_key(monkeypatch):
    monkeypatch.delenv("SERPAPI_API_KEY", raising=False)
    # Also prevent it from reading the .env file
    with pytest.raises(ValidationError):
        Settings(_env_file=None)
