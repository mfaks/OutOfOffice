from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, StateGraph

from app.internal.agents.feedback import feedback_node
from app.internal.agents.itinerary import itinerary_node
from app.internal.agents.planner import planner_node
from app.internal.agents.ranker import ranker_node
from app.internal.agents.travel import travel_node
from app.schemas.trip import TripState


def _should_rank(state: TripState) -> str:
    return "ranker" if state.get("enriched_windows") else END


def _should_build_itinerary(state: TripState) -> str:
    return "itinerary" if state.get("recommendations") else END


def _should_refine(state: TripState) -> str:
    return "feedback" if state.get("user_feedback") else END


def build_graph(checkpointer: BaseCheckpointSaver):
    g = StateGraph(TripState)

    g.add_node("planner", planner_node)
    g.add_node("travel", travel_node)
    g.add_node("ranker", ranker_node)
    g.add_node("itinerary", itinerary_node)
    g.add_node("feedback", feedback_node)

    g.set_entry_point("planner")
    g.add_edge("planner", "travel")
    g.add_conditional_edges("travel", _should_rank, {"ranker": "ranker", END: END})
    g.add_conditional_edges(
        "ranker", _should_build_itinerary, {"itinerary": "itinerary", END: END}
    )
    g.add_conditional_edges(
        "itinerary", _should_refine, {"feedback": "feedback", END: END}
    )
    g.add_edge("feedback", "planner")

    return g.compile(checkpointer=checkpointer)
