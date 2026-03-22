import httpx

NAGER_API_BASE = "https://date.nager.at/api/v3"


async def get_public_holidays(country_code: str, year: int) -> list[dict]:
    """
    Fetch public holidays for a given country and year via the Nager.Date API.
    Filters to only holidays marked as global (observed nationwide, not regionally).
    Returns a list of dicts with "name" and "date" (ISO 8601 string) keys.
    """
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
