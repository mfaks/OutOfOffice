import httpx

# Base URL for the Nager.Date API
NAGER_API_BASE = "https://date.nager.at/api/v3"


# Main function to get public holidays from the Nager.Date API
async def get_public_holidays(country_code: str, year: int) -> list[dict]:
    url = f"{NAGER_API_BASE}/PublicHolidays/{year}/{country_code}"

    # Make the API call to the Nager.Date API
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        holidays = response.json()

    # Parse the response and extract the public holidays; used for extended holidays
    holidays = []
    for holiday in holidays:
        holidays.append(
            {
                "name": holiday["name"],
                "date": holiday["date"],
            }
        )
    return holidays
