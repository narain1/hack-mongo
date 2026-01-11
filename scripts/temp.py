"""
Simulate a multiuser chat about a Paris trip with a formatted itinerary response.
"""

import requests
import time

BASE_URL = "https://nomadsync.ramharikrishnan.dev"

def create_user(username, email):
    url = f"{BASE_URL}/api/users"
    payload = {"username": username, "email": email}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    user_id = data["user_id"]
    print(f"✅ Created user: {username} (ID: {user_id})")
    return user_id

def create_session(user_id, title):
    url = f"{BASE_URL}/api/sessions"
    payload = {"user_id": user_id, "title": title}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    session_id = data["session_id"]
    print(f"✅ Created session: '{title}' (ID: {session_id})")
    return session_id

def add_message(session_id, role, content):
    url = f"{BASE_URL}/api/sessions/{session_id}/messages"
    payload = {"role": role, "content": content}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    print(f"💬 Added {role} message")

def main():
    print("🚀 Starting Paris trip multiuser chat simulation...\n")

    # Create a user
    user_id = create_user("TravelGroup", "group@travel.dev")

    # Create a session
    session_id = create_session(user_id, "Paris Dream Trip Planning")

    # Simulate multiuser conversation
    user_messages = [
        ("user", "[Sarah]: Hey everyone! I've been dreaming about going to Paris. Anyone interested in planning a trip together?"),
        ("user", "[Mike]: Yes! I've always wanted to see the Eiffel Tower. What's your budget?"),
        ("user", "[Sarah]: I'm thinking around $2000 for the trip. What about you @Mike?"),
        ("user", "[Emma]: That sounds reasonable! I'm in. When are you thinking of going?"),
        ("user", "[Mike]: How about next month? We could do a long weekend - maybe 3 days?"),
        ("user", "[Sarah]: Perfect! 3 days sounds great. Should we ask the travel agent for recommendations?"),
        ("user", "[Emma]: Yes! Let's get a full itinerary with flights, hotels, and attractions."),
    ]

    # The formatted Paris itinerary response
    paris_itinerary = """# Your Dream Trip to Paris

![Eiffel Tower](https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AcnlKN0BsGoGj2KfEkLztlJnKp_quj36qfX1kAA65vOdUjxj6aslm2okw1czu4zthOKYJaAnmXDNc36heC5nnUpnEd3daOkISQhBMa3OKN8l0rWc-4LnvrNPmRItaDzJKmkFVKYUZJ6vpXZIgYMP5V2YSXTy7AV6uo4VsHeCIsyjI-D8x1Yh9Bu2bLSEBJb7P-GPp3Ohqk-7cYCOO95R5QSv9vLn5UhrNSH51piJ8Mm7YfILUNfLgfVwCOX7hBH0GOJyqQGsyOjcSHpyPZRF8NCsNQcwE44dx-uvUrqkIPPH1hnhyw66q49hh1uM02SO__5LzsHBU5y6HivHwvzA-DuQH_sNz3qn_9Bgcd-gz5PVC5KNbSinRMi1cL1jzTtYniWBSQiwww9-0JjIbjzBpc7dV_lv1Q07l6LPRmKDwkqvtHtr4qZg&key=AIzaSyAqUZdW5LkVBGMEJderK3R15P8_cAk_kAg)

![Louvre Museum](https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=AcnlKN1CQzTSHjBPCK-d3M-VlrqwaIl4oVnzJg7sin6SaMs5uu1Qtj4eMSWqQZkaFxg60Ai_Z9GkDgu7Vh1bstSp6sDUHbJvHzuLAvKpm9ooIvsBP3F7wWxYah9ChiEPM5lqh1djQuWHKtwPA_EDRx8u34Grk5ChGq7nAPIrvOtBsZwd5GMq8lh9kJ43FLNOVTHjCeTyZTagoxBx3rCkivEtel5rojrmGnORRluDILDDRydcQECoHzDLqMyDmEl4pU972G49V0LxP2PClkntIWn95g7hdFluXkNMWI6nu_gbsqTGtjt9sLYbb48svWuSate069N67y0Ig_pjs9SDkJirUKZHig0uJ1Ug2DWPbD-mDUUX1WtFiiIWhFbddcg6AEwDocg6mfd0EAhdzrOdnZMPn9rTF6RObbfmDZDt6BzqoWmA9bR_&key=AIzaSyAqUZdW5LkVBGMEJderK3R15P8_cAk_kAg)

## Overview
**Destination:** Paris  
**Budget:** **$2000**  
**Starting Point:** New York  
**Duration:** 3 Days  
**Number of Travelers:** 2 

## Flight Details
**Departure Flight:** From New York to Paris  
**Duration:** 7h 30m  
**Cost:** **$500** per person

**Return Flight:** From Paris to New York  
**Duration:** 7h 45m  
**Cost:** **$500** per person

## Day-by-Day Itinerary

### Day 1: Eiffel Tower & Louvre Museum
Start your trip with a visit to the iconic [Eiffel Tower](https://www.toureiffel.paris/en). Next, explore the world-renowned [Louvre Museum](https://www.louvre.fr/en).

**Lunch Recommendation:** [Le Jules Verne](https://www.lejulesverne-paris.com/) (Eiffel Tower, 5 Avenue Gustave Eiffel, 75007 Paris, France)  

### Day 2: Notre Dame Cathedral & Seine River Cruise
Visit the historic [Notre Dame Cathedral](https://www.notredamedeparis.fr/en/). In the evening, enjoy a romantic [Seine River Cruise](https://www.bateauxparisiens.com/en.html).

**Dinner Recommendation:** [Les Deux Magots](https://www.lesdeuxmagots.fr/en/) (6 Place Saint-Germain des Prés, 75006 Paris, France)  

### Day 3: Versailles Palace
Spend your final day touring the grand [Versailles Palace](https://en.chateauversailles.fr/).

**Lunch Recommendation:** [Angelina](https://www.angelina-paris.fr/en/) (Versailles, First Floor of the Pavillon d'Orléans, 78000 Versailles, France)  

## Packing and Safety Notes
Pack light, comfortable clothing suitable for walking and sightseeing. Don't forget your camera, travel documents, and a universal power adapter. Stay aware of your surroundings and keep your belongings secure at all times.

## Next Steps
1. **Book Flights:** Confirm the flights from New York to Paris and back.
2. **Reserve Accommodations:** Book your preferred hotel in Paris.
3. **Buy Tickets:** Purchase tickets for the Eiffel Tower, Louvre Museum, Notre Dame Cathedral, Seine River Cruise, and Versailles Palace.
4. **Plan Meals:** Make reservations at the recommended restaurants. 

Enjoy your trip to the City of Love!"""

    print("\n🗣️ Adding multiuser conversation...\n")
    for role, content in user_messages:
        add_message(session_id, role, content)
        time.sleep(0.3)  # Be polite to the server

    print("\n🤖 Adding assistant response with formatted itinerary...\n")
    add_message(session_id, "assistant", paris_itinerary)
    time.sleep(0.3)

    # Add some follow-up messages
    follow_up_messages = [
        ("user", "[Sarah]: This looks amazing! I love the itinerary."),
        ("user", "[Mike]: The flight prices are perfect for our budget. Let's book it!"),
        ("user", "[Emma]: Yes! I'm so excited. The Eiffel Tower and Louvre on the same day - perfect!"),
    ]

    print("\n💬 Adding follow-up messages...\n")
    for role, content in follow_up_messages:
        add_message(session_id, role, content)
        time.sleep(0.3)

    print(f"\n🎉 Success! Multiuser Paris chat created in session: {session_id}")
    print(f"\n📋 You can view this chat in the application using session ID: {session_id}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"💥 Error: {e}")
        import traceback
        traceback.print_exc()
