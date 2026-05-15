import httpx

NAGER_API_BASE = "https://date.nager.at/api/v3"


# Fetch global public holidays for a country and year from the Nager.Date API
async def get_public_holidays(country_code: str, year: int) -> list[dict]:
    url = f"{NAGER_API_BASE}/PublicHolidays/{year}/{country_code}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        holidays = response.json()

    # only global holidays are included, not regional or state-specific ones
    result = []
    for holiday in holidays:
        if holiday.get("global", False):
            result.append(
                {
                    "name": holiday["name"],
                    "date": holiday["date"],
                }
            )
    return result
