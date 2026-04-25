import httpx
import pytest
import respx

from app.internal.agents.tools.holidays import get_public_holidays

MOCK_HOLIDAYS_RESPONSE = [
    {"name": "New Year's Day", "date": "2026-01-01", "global": True},
    {"name": "Regional Holiday", "date": "2026-03-15", "global": False},
    {"name": "Independence Day", "date": "2026-07-04", "global": True},
]

# Check if the get public holidays function filters the global holidays only
@pytest.mark.asyncio
@respx.mock
async def test_get_public_holidays_filters_global_only():
    respx.get("https://date.nager.at/api/v3/PublicHolidays/2026/US").mock(
        return_value=httpx.Response(200, json=MOCK_HOLIDAYS_RESPONSE)
    )

    result = await get_public_holidays("US", 2026)

    assert len(result) == 2
    names = [h["name"] for h in result]
    assert "Regional Holiday" not in names

# Check if the get public holidays function returns the holidays with the correct shape
@pytest.mark.asyncio
@respx.mock
async def test_get_public_holidays_result_shape():
    respx.get("https://date.nager.at/api/v3/PublicHolidays/2026/US").mock(
        return_value=httpx.Response(200, json=MOCK_HOLIDAYS_RESPONSE)
    )

    result = await get_public_holidays("US", 2026)

    for holiday in result:
        assert "name" in holiday
        assert "date" in holiday

# Check if the get public holidays function returns an empty list if no holidays are found
@pytest.mark.asyncio
@respx.mock
async def test_get_public_holidays_empty_response():
    respx.get("https://date.nager.at/api/v3/PublicHolidays/2026/US").mock(
        return_value=httpx.Response(200, json=[])
    )

    result = await get_public_holidays("US", 2026)
    assert result == []

# Check if the get public holidays function raises an error if the HTTP error is 404
@pytest.mark.asyncio
@respx.mock
async def test_get_public_holidays_http_error_raises():
    respx.get("https://date.nager.at/api/v3/PublicHolidays/2026/US").mock(
        return_value=httpx.Response(404)
    )

    with pytest.raises(httpx.HTTPStatusError):
        await get_public_holidays("US", 2026)
