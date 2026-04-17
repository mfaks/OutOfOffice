import httpx

NAGER_API_BASE = "https://date.nager.at/api/v3"


async def get_public_holidays(country_code: str, year: int) -> list[dict]:
    """get_public_holidays returns {name, date} dicts from the Nager.Date API."""
    url = f"{NAGER_API_BASE}/PublicHolidays/{year}/{country_code}"

    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        holidays = response.json()

    return [
        {
            "name": holiday["name"],
            "date": holiday["date"],
        }
        for holiday in holidays
        if holiday["global"] is True
    ]
