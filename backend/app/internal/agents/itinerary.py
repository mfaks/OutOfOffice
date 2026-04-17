import logging

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas.trip import DayItinerary, TripRecommendation, TripState

logger = logging.getLogger(__name__)

_MODEL = "gpt-4o"

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
        - The first day is an arrival day — the traveler arrives at the destination
          based on outbound_arrives_at. Suggest activities after arrival only
          (check-in, nearby dinner, evening walk, etc.).
        - The last day is a departure day — the traveler must leave for the airport.
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

        Return no other text — just the JSON array.""",
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


async def itinerary_node(state: TripState) -> dict:
    recommendations = state["recommendations"]
    request = state["request"]
    llm = ChatOpenAI(model=_MODEL, api_key=settings.openai_api_key)
    chain = ITINERARY_PROMPT | llm | JsonOutputParser()

    enriched: list[TripRecommendation] = []
    for rec in recommendations:
        try:
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
            itinerary = [DayItinerary(**d) for d in days]
        except Exception:
            logger.warning(
                "itinerary generation failed for rank %s", rec.rank, exc_info=True
            )
            itinerary = []

        enriched.append(rec.model_copy(update={"itinerary": itinerary}))

    return {"recommendations": enriched}
