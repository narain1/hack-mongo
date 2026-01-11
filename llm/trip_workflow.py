from typing import TypedDict, Optional, List
from langgraph.graph import StateGraph, START, END
from langchain.messages import HumanMessage
from langchain.tools import tool

# Define the workflow state
class State(TypedDict):
    user_query: str
    trip_details: Optional[dict]  # Extracted trip details
    places_plan: Optional[dict]  # Planned places to visit
    transport_plan: Optional[dict]  # Transport details
    final_response: Optional[str]  # Final formatted response

# Trip Intent Extractor Node
@tool
def extract_trip_intent(state: State):
    """Extract trip details from the user query."""
    user_query = state["user_query"]
    # Simulate extraction logic
    extracted_details = {
        "destination": "Paris",
        "budget": 2000,
        "starting_point": "New York",
        "duration": 5,
        "travel_dates": "2026-01-15 to 2026-01-20",
        "travelers": 2,
        "preferences": {
            "sightseeing_hours": 8,
            "relaxation_type": "chilling"
        }
    }
    missing_details = []  # Simulate missing details check

    if missing_details:
        return {
            "trip_details": None,
            "final_response": f"Please provide the following details: {', '.join(missing_details)}"
        }
    return {"trip_details": extracted_details}

# Places Planner Node
@tool
def plan_places(state: State):
    """Plan places to visit based on the extracted trip details."""
    trip_details = state["trip_details"]
    # Simulate planning logic
    places_plan = {
        "day_1": ["Eiffel Tower", "Louvre Museum"],
        "day_2": ["Notre Dame Cathedral", "Seine River Cruise"],
        "day_3": ["Versailles Palace"]
    }
    return {"places_plan": places_plan}

# Transport Planner Node
@tool
def plan_transport(state: State):
    """Plan transport details including flights and costs."""
    trip_details = state["trip_details"]
    # Simulate transport planning logic
    transport_plan = {
        "flights": {
            "departure": {
                "from": "New York",
                "to": "Paris",
                "duration": "7h 30m",
                "cost": 500
            },
            "return": {
                "from": "Paris",
                "to": "New York",
                "duration": "7h 45m",
                "cost": 500
            }
        }
    }
    return {"transport_plan": transport_plan}

# Response Formatter Node
@tool
def format_response(state: State):
    """Format the final response based on the planned trip."""
    trip_details = state["trip_details"]
    places_plan = state["places_plan"]
    transport_plan = state["transport_plan"]

    # Simulate response formatting
    final_response = (
        f"Your trip to {trip_details['destination']} is planned as follows:\n"
        f"Budget: ${trip_details['budget']}\n"
        f"Travel Dates: {trip_details['travel_dates']}\n"
        f"Travelers: {trip_details['travelers']}\n"
        f"\nPlaces to Visit:\n"
    )
    for day, places in places_plan.items():
        final_response += f"{day.capitalize()}: {', '.join(places)}\n"

    final_response += (
        f"\nTransport Details:\n"
        f"Departure Flight: {transport_plan['flights']['departure']['from']} to {transport_plan['flights']['departure']['to']}\n"
        f"Duration: {transport_plan['flights']['departure']['duration']}, Cost: ${transport_plan['flights']['departure']['cost']}\n"
        f"Return Flight: {transport_plan['flights']['return']['from']} to {transport_plan['flights']['return']['to']}\n"
        f"Duration: {transport_plan['flights']['return']['duration']}, Cost: ${transport_plan['flights']['return']['cost']}\n"
    )

    return {"final_response": final_response}

# Build the workflow
workflow = StateGraph(State)

# Add nodes
workflow.add_node("extract_trip_intent", extract_trip_intent)
workflow.add_node("plan_places", plan_places)
workflow.add_node("plan_transport", plan_transport)
workflow.add_node("format_response", format_response)

# Add edges
workflow.add_edge(START, "extract_trip_intent")
workflow.add_conditional_edges(
    "extract_trip_intent",
    lambda state: "format_response" if state["trip_details"] is None else "plan_places",
    {"format_response": "format_response", "plan_places": "plan_places"}
)
workflow.add_edge("plan_places", "plan_transport")
workflow.add_edge("plan_transport", "format_response")
workflow.add_edge("format_response", END)

# Compile the workflow
compiled_workflow = workflow.compile()

# Example invocation
if __name__ == "__main__":
    state = compiled_workflow.invoke({"user_query": "Plan a 5-day trip to Paris for 2 people with a budget of $2000."})
    print(state["final_response"])
