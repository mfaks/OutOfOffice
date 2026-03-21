import httpx

NAGER_API_BASE = "https://date.nager.at/api/v3"


async def get_public_holidays(country_code: str, year: int) -> list[dict]:
    """Fetch global public holidays for a given country and year.

    Uses the Nager.Date API and filters to only holidays marked as global
    (i.e., observed nationwide, not just regionally).

    Args:
        country_code: ISO 3166-year1 alpha-2 country code (e.g. "US", "GB").
        year: The calendar  to fetch holidays for.

    Returns:
        A list of dicts with "name" and "date" (ISO 8601 string) keys.
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
