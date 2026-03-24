import json

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas.trip import TripPlannerRequest, TripState

INTERPRETER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a travel planning assistant. The user has reviewed trip
        recommendations and provided feedback. Your job is to translate that
        feedback into updated constraints on their trip request.

        You will be given the current request as JSON and the user's feedback
        as a string.

        Return ONLY a valid JSON object with any of these fields that should
        change:
        - max_flight_budget: number (lower if "too expensive", raise if
          "budget is fine")
        - pto_days_remaining: number (raise if user wants "longer trip")
        - min_pto_days: number (set when user wants a longer trip —
          e.g. "longer trip" → 3, "at least a week" → 5)
        - destination: string (change if user wants a different place)
        - departure: string (change if user wants to leave from elsewhere)
        - preferred_months: list[int] (1-12; set when user specifies months or
          seasons, e.g. "summer" → [6,7,8], "spring" → [3,4,5],
          "fall" → [9,10,11], "winter" → [12,1,2]; null to clear)

        Only include fields that should actually change. If nothing needs to
        change, return {{}}.
        Return no other text — just the JSON object.""",
        ),
        (
            "human",
            "Current request: {request}\n\nUser feedback: {feedback}",
        ),
    ]
)


async def feedback_node(state: TripState) -> dict:
    """Parse freetext feedback into updated request constraints and increment
    refinement_count."""

    feedback = state.get("user_feedback")
    if not feedback:
        return {}

    llm = ChatOpenAI(model="gpt-4o", api_key=settings.openai_api_key)
    chain = INTERPRETER_PROMPT | llm | JsonOutputParser()

    adjustments: dict = await chain.ainvoke(
        {
            "request": json.dumps(state["request"].model_dump()),
            "feedback": feedback,
        }
    )

    updated_request = TripPlannerRequest(
        **{**state["request"].model_dump(), **adjustments}
    )

    return {
        "request": updated_request,
        "user_feedback": None,
        "refinement_count": state.get("refinement_count", 0) + 1,
    }
