from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.internal.agents.feedback import feedback_node
from app.internal.agents.planner import planner_node
from app.internal.agents.ranker import ranker_node
from app.internal.agents.travel import travel_node
from app.schemas.trip import TripState


def build_graph():
    g = StateGraph(TripState)

    g.add_node("interpreter", feedback_node)
    g.add_node("planner", planner_node)
    g.add_node("travel", travel_node)
    g.add_node("ranker", ranker_node)

    g.set_entry_point("interpreter")
    g.add_edge("interpreter", "planner")
    g.add_edge("planner", "travel")
    g.add_edge("travel", "ranker")
    g.add_edge("ranker", END)

    return g.compile(checkpointer=MemorySaver())


graph = build_graph()
