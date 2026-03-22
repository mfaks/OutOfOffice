import json

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.internal.models import TripPlannerRequest, TripRecommendation

RANKER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a travel planning assistant. You will be given a list of
        candidate trip windows, each enriched with real flight data.

        Rank the top 3 by weighing these factors:
        - yield_score: higher is better (more days off per PTO day spent)
        - estimated_flight_cost: lower is better
        - layovers: fewer is better

        Return ONLY a valid JSON array of exactly 3 objects.
        Each object must have these exact fields:
        - rank: integer (1, 2, or 3)
        - start_date: string (YYYY-MM-DD)
        - end_date: string (YYYY-MM-DD)
        - total_days_off: integer
        - pto_days_used: integer
        - yield_score: float
        - best_flight: object with airline, estimated_flight_cost,
          layovers, departs_at, returns_at
        - reasoning: string (2 sentences explaining why this window was chosen)

        Return no other text — just the JSON array.""",
        ),
        (
            "human",
            "User request: {request}\n\nCandidate windows: {windows}",
        ),
    ]
)


async def ranker_node(
    request: TripPlannerRequest,
    enriched_windows: list[dict],
) -> list[TripRecommendation]:
    """
    Node 3 (LLM)

    Takes the enriched windows from travel_node, asks the LLM
    to rank them into top 3, and parses the result into
    TripRecommendation objects to return to pipeline.py.
    """
    if not enriched_windows:
        return []

    llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key)

    chain = RANKER_PROMPT | llm | JsonOutputParser()

    result = await chain.ainvoke(
        {
            "request": json.dumps(request.model_dump()),
            "windows": json.dumps(enriched_windows),
        }
    )

    return [TripRecommendation(**r) for r in result]
