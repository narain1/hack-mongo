import requests
import time

BASE_URL = "https://nomadsync.ramharikrishnan.dev"

def create_user(username, email):
    url = f"{BASE_URL}/api/users"
    payload = {"username": username, "email": email}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    user_id = data["user_id"]  # ← This is the correct key!
    print(f"✅ Created user: {username} (ID: {user_id})")
    return user_id

def create_session(user_id, title):
    url = f"{BASE_URL}/api/sessions"
    payload = {"user_id": user_id, "title": title}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    session_id = data["session_id"]  # Likely key based on pattern
    print(f"✅ Created session: '{title}' (ID: {session_id})")
    return session_id

def add_message(session_id, role, content):
    url = f"{BASE_URL}/api/sessions/{session_id}/messages"
    payload = {"role": role, "content": content}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    print(f"💬 Added {role} message: {content[:60]}...")

def main():
    print("🚀 Starting dummy tour planning data creation...\n")

    # Create a single user (multi-user per session not supported)
    user_id = create_user("TourPlanner", "planner@nomad.dev")

    # Create a session
    session_id = create_session(user_id, "Europe Backpacking Trip")

    # Simulate group discussion using name prefixes
    messages = [
        ("user", "[Alex]: I propose a 7-day Europe trip: Paris → Amsterdam → Berlin!"),
        ("user", "[Sam]: Love it! Can we do it in June?"),
        ("user", "[Taylor]: June works for me. How many days per city?"),
        ("user", "[Alex]: 2 days Paris, 2 days Amsterdam, 3 days Berlin (includes travel)."),
        ("user", "[Sam]: Perfect. Let's prioritize museums in Paris and bikes in Amsterdam!"),
        ("user", "[Taylor]: And techno clubs in Berlin! 😄"),
        ("user", "[Alex]: Final plan: June 10–16 — Paris (Louvre, Eiffel), Amsterdam (canals, Van Gogh), Berlin (Brandenburg, Berghain)."),
        ("assistant", "✅ Confirmed Itinerary:\n- Duration: 7 days (June 10–16)\n- Cities: Paris → Amsterdam → Berlin\n- Highlights: Louvre Museum, Canal Cruise, Brandenburg Gate, nightlife")
    ]

    print("\n🗣️ Adding simulated group chat...\n")
    for role, content in messages:
        add_message(session_id, role, content)
        time.sleep(0.2)  # Be polite to the server

    print(f"\n🎉 Success! Tour plan added to session: {session_id}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"💥 Error: {e}")