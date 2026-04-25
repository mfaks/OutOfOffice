import json

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas.trip import TripRecommendation, TripState

# Model to use for the ranker agent to rank the candidate windows
_MODEL = "gpt-4o"

# Instructions for the ranker agent to rank the candidate windows
PRIORITY_INSTRUCTIONS = {
    "best_yield": (
        "PRIMARY goal: maximize yield_score (most total days off per PTO day used). "
        "Secondary: prefer lower flight cost and fewer layovers."
    ),
    "lowest_cost": (
        "PRIMARY goal: minimize estimated_flight_cost. "
        "Secondary: prefer higher yield_score and fewer layovers."
    ),
    "most_pto": (
        "PRIMARY goal: maximize pto_days_used (longest trips). "
        "Secondary: prefer higher yield_score and lower flight cost."
    ),
    "least_pto": (
        "PRIMARY goal: minimize pto_days_used (shortest PTO commitment). "
        "Secondary: prefer higher yield_score and lower flight cost."
    ),
}

# Prompt for the ranker agent to rank the candidate windows
RANKER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
        "system",
        """You are a travel planning assistant. You will be given a list of
        candidate trip windows, each enriched with real flight data, and a
        user priority that dictates how to rank them.

        Ranking instructions based on priority:
        {priority_instructions}

        Return ONLY a valid JSON array of exactly 5 objects (or fewer if fewer
        candidates exist).
        Each object must have these exact fields:
        - rank: integer (1, 2, 3, 4, or 5)
        - start_date: string (YYYY-MM-DD)
        - end_date: string (YYYY-MM-DD)
        - total_days_off: integer
        - pto_days_used: integer
        - yield_score: float
        - best_flight: object with airline, estimated_flight_cost,
          layovers, outbound_departs_at, outbound_arrives_at,
          return_departs_at, return_arrives_at
        - reasoning: string (2 sentences explaining why this window was chosen
          given the user's priority)

        Return only the JSON array, no other text.""",
        ),
        (
            "human",
            "User request: {request}\n\nCandidate windows: {windows}",
        ),
    ]
)

# Ranker agent to rank the candidate windows
async def ranker_node(state: TripState) -> dict:
    request = state["request"]
    enriched_windows = state["enriched_windows"]
    llm = ChatOpenAI(model=_MODEL, api_key=settings.openai_api_key)

    chain = RANKER_PROMPT | llm | JsonOutputParser()

    priority_key = request.priority.value
    request_dict = request.model_dump()
    request_dict.pop("priority", None)
    result = await chain.ainvoke(
        {
            "request": json.dumps(request_dict),
            "windows": json.dumps(enriched_windows),
            "priority_instructions": PRIORITY_INSTRUCTIONS[priority_key],
        }
    )

    return {"recommendations": [TripRecommendation(**r) for r in result]}
