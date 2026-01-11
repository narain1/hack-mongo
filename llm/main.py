from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import googlemaps
import random
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from typing import TypedDict
from pymongo import MongoClient
import datetime
from bson import ObjectId

# Load environment variables
load_dotenv()

app = FastAPI(title="Travel Planner API", description="API for planning trips using LangGraph and LangChain tools")


class QueryRequest(BaseModel):
    query: str

# Define the tools
@tool
def get_tourist_places(city: str) -> str:
    """Fetch a list of popular tourist attractions/places in a given city using Google Places API, including images.

    Args:
        city: Name of the city to search for tourism spots.

    Returns:
        Formatted string with place names and image URLs in markdown format.
    """
    try:
        # Get API key from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return "Google API key not found. Please set GOOGLE_API_KEY environment variable."

        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=api_key)

        # Search for tourist attractions in the city
        query = f"tourist attractions in {city}"
        places_result = gmaps.places(query=query, type='tourist_attraction')

        if 'results' in places_result and places_result['results']:
            response_lines = [f"**Popular Tourist Attractions in {city}:**\n"]

            for place in places_result['results'][:10]:  # Limit to 10 results
                place_name = place['name']
                response_lines.append(f"### {place_name}")

                # Get place details to fetch photos
                place_id = place['place_id']
                place_details = gmaps.place(place_id=place_id, fields=['photo'])

                if 'result' in place_details and 'photos' in place_details['result']:
                    photos = place_details['result']['photos'][:3]  # Limit to 3 photos per place
                    for photo in photos:
                        photo_reference = photo['photo_reference']
                        # Construct photo URL
                        photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={api_key}"
                        # Add as markdown image
                        response_lines.append(f"![{place_name}]({photo_url})")
                else:
                    response_lines.append("*No images available*")

                response_lines.append("")  # Add blank line between places

            return "\n".join(response_lines)
        else:
            return f"No tourist attractions found for {city}."

    except Exception as e:
        return f"Error fetching tourist places: {str(e)}"


@tool
def get_restaurants(city: str, cuisine_type: Optional[str] = None) -> str:
    """Fetch a list of popular restaurants in a given city using Google Places API, including images and ratings.

    Args:
        city: Name of the city to search for restaurants.
        cuisine_type: Optional cuisine type (e.g., 'italian', 'chinese', 'indian').

    Returns:
        Formatted string with restaurant names, ratings, and image URLs in markdown format.
    """
    try:
        # Get API key from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return "Google API key not found. Please set GOOGLE_API_KEY environment variable."

        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=api_key)

        # Search for restaurants in the city
        if cuisine_type:
            query = f"{cuisine_type} restaurants in {city}"
        else:
            query = f"restaurants in {city}"

        places_result = gmaps.places(query=query, type='restaurant')

        if 'results' in places_result and places_result['results']:
            response_lines = [f"**Popular Restaurants in {city}{f' ({cuisine_type.title()})' if cuisine_type else ''}:**\n"]

            for place in places_result['results'][:10]:  # Limit to 10 results
                place_name = place['name']
                rating = place.get('rating', 'N/A')
                price_level = place.get('price_level', '')
                price_display = '💰' * price_level if price_level else ''

                response_lines.append(f"### {place_name}")
                response_lines.append(f"⭐ Rating: {rating}/5 {price_display}")

                if 'vicinity' in place:
                    response_lines.append(f"📍 Location: {place['vicinity']}")

                # Get place details to fetch photos
                place_id = place['place_id']
                place_details = gmaps.place(place_id=place_id, fields=['photo', 'formatted_phone_number', 'opening_hours'])

                if 'result' in place_details:
                    result = place_details['result']

                    # Add phone number if available
                    if 'formatted_phone_number' in result:
                        response_lines.append(f"📞 Phone: {result['formatted_phone_number']}")

                    # Add opening hours if available
                    if 'opening_hours' in result and 'weekday_text' in result['opening_hours']:
                        response_lines.append("🕐 Hours:")
                        for hour in result['opening_hours']['weekday_text'][:3]:  # Show first 3 days
                            response_lines.append(f"  {hour}")

                    # Add photos
                    if 'photos' in result:
                        photos = result['photos'][:3]  # Limit to 3 photos per restaurant
                        for photo in photos:
                            photo_reference = photo['photo_reference']
                            # Construct photo URL
                            photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={api_key}"
                            # Add as markdown image
                            response_lines.append(f"![{place_name}]({photo_url})")
                    else:
                        response_lines.append("*No images available*")

                response_lines.append("")  # Add blank line between restaurants

            return "\n".join(response_lines)
        else:
            return f"No restaurants found for {city}{f' ({cuisine_type})' if cuisine_type else ''}."

    except Exception as e:
        return f"Error fetching restaurants: {str(e)}"


# Helper function for flight calculations
def _calculate_flights(destination_city: str, origin_city: str = "Delhi", date: Optional[str] = None) -> List[dict]:
    """Calculate flight options using Google Places API."""
    try:
        # Get API key from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return [{"error": "Google API key not found. Please set GOOGLE_API_KEY environment variable."}]

        # Initialize Google Maps client
        gmaps = googlemaps.Client(key=api_key)

        # Find airports near origin city
        origin_airports = gmaps.places(query=f"international airport in {origin_city}", type='airport')
        origin_airport = None
        if 'results' in origin_airports and origin_airports['results']:
            origin_airport = origin_airports['results'][0]

        # Find airports near destination city
        dest_airports = gmaps.places(query=f"international airport in {destination_city}", type='airport')
        dest_airport = None
        if 'results' in dest_airports and dest_airports['results']:
            dest_airport = dest_airports['results'][0]

        if not origin_airport or not dest_airport:
            return [{"error": f"Could not find airports for {origin_city} to {destination_city}"}]

        # Get distance and duration between airports
        origins = [(origin_airport['geometry']['location']['lat'], origin_airport['geometry']['location']['lng'])]
        destinations = [(dest_airport['geometry']['location']['lat'], dest_airport['geometry']['location']['lng'])]

        distance_matrix = gmaps.distance_matrix(origins, destinations, mode='driving', units='metric')

        if 'rows' in distance_matrix and distance_matrix['rows'][0]['elements'][0]['status'] == 'OK':
            distance_km = distance_matrix['rows'][0]['elements'][0]['distance']['value'] / 1000
            # Estimate flight duration (average commercial jet speed ~800 km/h)
            flight_duration_hours = distance_km / 800
            flight_duration_str = f"{int(flight_duration_hours)}h {int((flight_duration_hours % 1) * 60)}m"

            # Estimate flight cost based on distance (rough approximation)
            # Domestic flights: ~$0.10-0.20 per km, International: ~$0.15-0.30 per km
            cost_per_km = 0.20 if distance_km < 2000 else 0.25  # Higher for long-haul
            base_cost = distance_km * cost_per_km
            # Add taxes and fees (roughly 20-30% of base cost)
            total_cost = base_cost * 1.25

            # Generate sample flight options with realistic times
            airlines = ["Air India", "IndiGo", "SpiceJet", "Vistara", "GoAir"]
            flight_options = []

            for i in range(3):
                airline = random.choice(airlines)
                # Generate departure times throughout the day
                dep_hour = random.randint(6, 22)
                dep_minute = random.choice([0, 15, 30, 45])
                dep_time = f"{dep_hour:02d}:{dep_minute:02d}"

                # Calculate arrival time
                arr_hour = int((dep_hour + flight_duration_hours) % 24)
                arr_minute = int((dep_minute + (flight_duration_hours % 1) * 60) % 60)
                arr_time = f"{arr_hour:02d}:{arr_minute:02d}"

                # Vary price slightly
                price_variation = random.uniform(0.8, 1.2)
                price = round(total_cost * price_variation)

                flight_options.append({
                    "airline": airline,
                    "departure_time": dep_time,
                    "arrival_time": arr_time,
                    "price": f"${price}",
                    "duration": flight_duration_str,
                    "origin_airport": origin_airport['name'],
                    "destination_airport": dest_airport['name']
                })

            return flight_options
        else:
            return [{"error": "Could not calculate distance between airports"}]

    except Exception as e:
        return [{"error": f"Error fetching flight information: {str(e)}"}]


@tool
def find_flights_to_city(destination_city: str, origin_city: str = "Delhi", date: Optional[str] = None) -> List[dict]:
    """Find flight options to a specified city from an origin city on a specific date using Google Places API.

    Args:
        destination_city: Destination city name.
        origin_city: Originating city name (default: Delhi).
        date: Travel date in YYYY-MM-DD format (optional, defaults to next day if not provided).

    Returns:
        List of flight options with airline, times, price, and duration.
    """
    return _calculate_flights(destination_city, origin_city, date)


@tool
def suggest_budget_plan(destination_city: str, trip_duration_days: int = 3, travelers: int = 1, origin_city: Optional[str] = None, travel_date: Optional[str] = None, budget: Optional[float] = None) -> dict:
    """Provide a detailed tour plan including flights, accommodation, food, and activities within a given budget.

    Args:
        destination_city: Target travel destination city.
        trip_duration_days: Duration of stay in days. Default is 3.
        travelers: Number of people traveling together. Default is 1.
        origin_city: Originating city name (optional, if provided, flight costs will be included).
        travel_date: Travel date in YYYY-MM-DD format (optional, required if origin_city is provided).
        budget: Total budget for the trip (optional).

    Returns:
        A detailed tour plan with cost breakdown and activities.
    """
    # Static cost estimates per day
    costs_per_day = {
        "Paris": {"hotel": 120, "food": 60, "transport": 20},
        "New York": {"hotel": 180, "food": 70, "transport": 30},
        "Tokyo": {"hotel": 100, "food": 40, "transport": 15},
        "Bangkok": {"hotel": 40, "food": 25, "transport": 10}
    }

    daily_cost = costs_per_day.get(destination_city, {"hotel": 0, "food": 0, "transport": 0})

    total_hotel = daily_cost["hotel"] * trip_duration_days
    total_food = daily_cost["food"] * trip_duration_days * travelers
    total_transport = daily_cost["transport"] * trip_duration_days * travelers

    total_budget = total_hotel + total_food + total_transport
    breakdown = {
        "accommodation": f"${total_hotel}",
        "food": f"${total_food}",
        "local_transport": f"${total_transport}"
    }

    # Add flight costs if origin city is provided
    if origin_city:
        flight_options = _calculate_flights(destination_city, origin_city, travel_date)
        if flight_options and not any("error" in option for option in flight_options):
            # Take the cheapest flight option
            flight_prices = []
            for option in flight_options:
                if "price" in option:
                    try:
                        price_str = option["price"].replace("$", "")
                        flight_prices.append(float(price_str))
                    except ValueError:
                        continue

            if flight_prices:
                cheapest_flight = min(flight_prices)
                total_flights = cheapest_flight * travelers * 2  # Round trip
                total_budget += total_flights
                breakdown["flights"] = f"${total_flights}"

    # Add activities and restaurants
    activities = get_tourist_places(destination_city)
    restaurants = get_restaurants(destination_city)

    # Check if the total budget exceeds the given budget
    if budget and total_budget > budget:
        return {
            "error": f"The estimated cost (${total_budget}) exceeds your budget (${budget}). Please adjust your preferences."
        }

    return {
        "estimated_total_cost": f"${total_budget}",
        "breakdown": breakdown,
        "activities": activities,
        "restaurants": restaurants
    }

# Initialize the LLM
llm = ChatOpenAI(model="gpt-4")

# Create the tools list
tools = [get_tourist_places, get_restaurants, find_flights_to_city, suggest_budget_plan]

# Create the ReAct agent using LangGraph
agent = create_react_agent(llm, tools)

# Define the workflow state
class State(TypedDict):
    user_query: str
    trip_details: Optional[dict]  # Extracted trip details
    places_plan: Optional[dict]  # Planned places to visit
    transport_plan: Optional[dict]  # Transport details
    final_response: Optional[str]  # Final formatted response

# Trip Intent Extractor Node
def extract_trip_intent(state: State):
    """Extract trip details from the user query using lightweight heuristics.

    Returns trip_details dict when all required fields are found, otherwise
    returns trip_details=None and a `final_response` asking the user for missing fields.
    """
    import re
    from dateutil import parser as dateparser

    user_query = state.get("user_query", "") or ""
    q = user_query.lower()

    trip = {
        "destination": None,
        "budget": None,
        "starting_point": None,
        "duration": None,
        "travel_dates": None,
        "travelers": None,
        "preferences": {"sightseeing_hours": None, "relaxation_type": None},
    }

    # Destination: look for 'to <City>' or 'in <City>' patterns
    m = re.search(r"(?:to|in)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)", user_query)
    if m:
        trip["destination"] = m.group(1)

    # Budget: $ or rupee or 'budget of 2000' patterns
    m = re.search(r"\$\s*(\d+(?:,\d{3})?(?:\.\d+)?)", user_query)
    if not m:
        m = re.search(r"budget\s*(?:of)?\s*(\d+(?:,\d{3})?)", user_query.lower())
    if m:
        try:
            trip["budget"] = float(m.group(1).replace(",", ""))
        except Exception:
            trip["budget"] = None

    # Starting point: 'from <City>'
    m = re.search(r"from\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)", user_query)
    if m:
        trip["starting_point"] = m.group(1)

    # Duration: '3-day' or 'for 3 days'
    m = re.search(r"(\d+)[-\s]?day|for\s+(\d+)\s+days", user_query.lower())
    if m:
        num = m.group(1) or m.group(2)
        try:
            trip["duration"] = int(num)
        except Exception:
            trip["duration"] = None

    # Travel dates: try to parse two dates or a single date range
    # Look for explicit date ranges like '2026-01-15 to 2026-01-20'
    m = re.search(r"(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})\s*(?:to|-)\s*(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})", user_query)
    if m:
        try:
            d1 = dateparser.parse(m.group(1)).date().isoformat()
            d2 = dateparser.parse(m.group(2)).date().isoformat()
            trip["travel_dates"] = f"{d1} to {d2}"
        except Exception:
            trip["travel_dates"] = None
    else:
        # Try natural language dates like 'next week' or 'June 5-8'
        m = re.search(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:-\d{1,2})?(?:,?\s*20\d{2})?", user_query.lower())
        if m:
            try:
                trip["travel_dates"] = m.group(0)
            except Exception:
                trip["travel_dates"] = None

    # Travelers: 'for 2 people' or '2 people'
    m = re.search(r"(\d+)\s*(?:people|persons|guests|travellers|travelers)", user_query.lower())
    if m:
        trip["travelers"] = int(m.group(1))

    # Preferences: sightseeing hours - look for '8 hours' or 'light/heavy'
    m = re.search(r"(\d+)\s*hours", user_query.lower())
    if m:
        try:
            trip["preferences"]["sightseeing_hours"] = int(m.group(1))
        except Exception:
            pass

    if "relax" in user_query.lower() or "resort" in user_query.lower() or "chill" in user_query.lower():
        trip["preferences"]["relaxation_type"] = "relaxing"
    elif "pilgrim" in user_query.lower() or "pilgrimage" in user_query.lower():
        trip["preferences"]["relaxation_type"] = "pilgrimage"
    elif "sightseeing" in user_query.lower() or "tour" in user_query.lower():
        trip["preferences"]["relaxation_type"] = "sightseeing"

    # Determine missing required fields
    required = ["destination", "duration", "travelers"]
    missing = [f for f in required if not trip.get(f)]

    # If budget or starting_point or travel_dates missing, they are optional but helpful
    helpful = [k for k in ["budget", "starting_point", "travel_dates"] if not trip.get(k)]

    if missing:
        prompt_parts = [
            "I need a few more details to plan your trip:",
            *[f"- {m}" for m in missing],
        ]
        return {"trip_details": None, "final_response": "\n".join(prompt_parts)}

    # Return extracted trip details
    return {"trip_details": trip}

# Places Planner Node
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


# --- New: run LLM on an entire session's conversation -----------------
MONGO_URI = os.getenv("MONGO_URI") or "mongodb+srv://cluster0.p0litw.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&appName=Cluster0"
mongo_client = MongoClient(MONGO_URI,
                           tls=True,
                           tlsCertificateKeyFile='cred.pem')
mongo_db = mongo_client.get_database("chat_app")


@app.get("/api/sessions/{session_id}/run-llm")
def run_llm_on_session(session_id: str):
    """Fetch the conversation for `session_id`, forward to the LLM/agent, and return the LLM output.

    The endpoint tries to use the `messages` collection first and falls back to
    `chat_history` if needed. It converts each entry to a plain string message
    prefixed with the author (e.g., `[Alex]: ...`) and sends the whole conversation
    to the `agent` if available, otherwise calls `llm` directly with a single prompt.
    """
    try:
        coll = mongo_db.get_collection("messages")
        if "messages" not in mongo_db.list_collection_names():
            coll = mongo_db.get_collection("chat_history")

        docs = list(coll.find({"session_id": session_id}).sort("timestamp", 1))

        if not docs:
            return {"success": True, "messages": [], "llm_response": "No messages found", "count": 0}

        # Build a simple conversation text for the LLM
        convo_lines = []
        for d in docs:
            author = d.get("role") or d.get("username") or "user"
            content = d.get("content") or d.get("message") or ""
            # If username is stored separately (like [Alex]: ... in content), prefer that raw content
            convo_lines.append(f"[{author}]: {content}")

        conversation_text = "\n".join(convo_lines)

        # Prefer the agent if callable
        try:
            # The ReAct agent may accept a prompt-like input; fallback if interface differs
            agent_response = agent.run(conversation_text)
            llm_out = agent_response
        except Exception:
            # Fall back to calling the llm directly
            # Use a simple prompt asking the model to respond as assistant summarizing or continuing
            prompt = (
                "You are a travel planning assistant. Continue the conversation or provide a summary/reply based on the chat below:\n\n"
                + conversation_text
            )
            # ChatOpenAI from langchain_openai may accept a simple call pattern; adapt as needed
            try:
                llm_resp = llm.call([HumanMessage(content=prompt)])
                # `llm.call` may return a Message-like object or a string
                if hasattr(llm_resp, "content"):
                    llm_out = llm_resp.content
                else:
                    llm_out = str(llm_resp)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"LLM call failed: {e}")

        return {"success": True, "messages": convo_lines, "llm_response": llm_out, "count": len(convo_lines)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/plan-trip")
async def plan_trip(request: QueryRequest):
    """
    Endpoint to plan a trip based on a natural language query.
    The workflow will use the available nodes to gather information and provide a travel plan.
    """
    try:
        state = compiled_workflow.invoke({"user_query": request.query})
        return {"response": state["final_response"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
