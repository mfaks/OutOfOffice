from app.internal.agents.planner import planner_node
from app.internal.agents.ranker import ranker_node
from app.internal.agents.travel import travel_node
from app.internal.models import TripPlannerRequest, TripRecommendation


async def run_pipeline(request: TripPlannerRequest) -> list[TripRecommendation]:
    """
    Main entry point for the trip planning pipeline.
    Node Chain: Planner -> Travel -> Ranker
    Each node gets the output of the previous one.
    """
    # Step 1: score PTO windows using holidays
    candidate_windows = await planner_node(request)
    if not candidate_windows:
        return []

    # Step 2: enrich windows with real flight data
    enriched_windows = await travel_node(request, candidate_windows)
    if not enriched_windows:
        return []

    # Step 3: LLM ranks into top 3 with reasoning
    recommendations = await ranker_node(request, enriched_windows)

    return recommendations
