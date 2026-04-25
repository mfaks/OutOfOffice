import asyncio

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas.trip import DayItinerary, TripRecommendation, TripState

# Model to use for the itinerary agent to generate the itinerary for the trip
_MODEL = "gpt-4o"

# Prompt for the itinerary agent to generate the itinerary for the trip
ITINERARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a travel planning assistant. Given a trip recommendation,
        generate a day-by-day activity itinerary for the destination.

        You will receive:
        - destination: the airport code (use the city/region it represents)
        - start_date: when the trip begins (YYYY-MM-DD)
        - end_date: when the trip ends (YYYY-MM-DD)
        - outbound_departs_at: when the traveler leaves home
        - outbound_arrives_at: when the traveler arrives at the destination
        - return_departs_at: when the traveler leaves the destination
        - return_arrives_at: when the traveler arrives back home

        Rules:
        - The first day is an arrival day. The traveler arrives based on
          outbound_arrives_at. Suggest activities after arrival only
          (check-in, nearby dinner, evening walk, etc.).
        - The last day is a departure day. The traveler must leave for the airport.
          Suggest only morning/early activities that fit before return_departs_at.
        - Full days in between should have 3–5 activities spanning morning to evening.
        - Activities should be specific, time-annotated, and realistic for
          the destination.
        - Keep activity strings concise (e.g. "9:00 AM – Visit the Eiffel Tower").

        Return ONLY a valid JSON array. Each element must have:
        - date: string (YYYY-MM-DD)
        - note: string (e.g. "Arrival day", "Full day",
          "Departure day (departs 2:00 PM)")
        - activities: array of strings

        Return only the JSON array, no other text.""",
        ),
        (
            "human",
            "Destination: {destination}\n"
            "Start date: {start_date}\n"
            "End date: {end_date}\n"
            "Outbound flight: departs {outbound_departs_at},"
            " arrives {outbound_arrives_at}\n"
            "Return flight: departs {return_departs_at},"
            " arrives {return_arrives_at}",
        ),
    ]
)


# Helper function to build the itinerary for the trip
async def _build_itinerary(
    chain, request, rec: TripRecommendation
) -> TripRecommendation:

    days = await chain.ainvoke(
        {
            "destination": request.destination,
            "start_date": rec.start_date,
            "end_date": rec.end_date,
            "outbound_departs_at": rec.best_flight.outbound_departs_at,
            "outbound_arrives_at": rec.best_flight.outbound_arrives_at,
            "return_departs_at": rec.best_flight.return_departs_at,
            "return_arrives_at": rec.best_flight.return_arrives_at,
        }
    )
    itinerary = []
    # Validate the days and add them to the itinerary
    for d in days:
        itinerary.append(DayItinerary.model_validate(d))

    # Return the updated recommendation with the itinerary
    return rec.model_copy(update={"itinerary": itinerary})


async def itinerary_node(state: TripState) -> dict:
    recommendations = state["recommendations"]
    request = state["request"]
    llm = ChatOpenAI(model=_MODEL, api_key=settings.openai_api_key)
    chain = ITINERARY_PROMPT | llm | JsonOutputParser()

    # Build the itinerary for each recommendation using coroutines to run in parallel
    tasks = map(lambda rec: _build_itinerary(chain, request, rec), recommendations)

    # Run the tasks in parallel and gather the results
    enriched = await asyncio.gather(*tasks)

    # Return the updated recommendations with the itinerary
    return {"recommendations": list(enriched)}
