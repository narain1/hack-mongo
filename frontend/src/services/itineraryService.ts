import type { Message } from "@/types/chat";
import type {
  TravelPlan,
  ItineraryDay,
  ItineraryItem,
  Activity,
  Accommodation,
  Restaurant,
  Transportation,
  Flight,
  MoneyAmount,
} from "@/types/travel";
import { callStructuredChat } from "@/services/chatService";

type ExtractionMode = "quick" | "full";

const SYSTEM_PROMPT = `You are a travel itinerary extractor. Given the full chat history, output a structured JSON itinerary. 
- Always respond with JSON only. 
- Preserve all concrete details (dates, times, locations, confirmation numbers, costs).
- If data is missing, leave fields empty rather than guessing.
- Use day numbers starting at 1.
JSON shape:
{
  "id": string,
  "destination": { "id": string, "name": string, "country": string, "description": string, "imageUrl": string },
  "durationDays": number,
  "budget": { "amount": number, "currency": string, "note": string },
  "participants": string[],
  "flights": Flight[],
  "days": ItineraryDay[]
}
Flight: { "id": string, "from": string, "to": string, "departure": string, "arrival": string, "airline": string, "number": string, "confirmation": string, "cost": MoneyAmount, "notes": string }
ItineraryDay: { "day": number, "date": string, "location": string, "summary": string, "activities": Activity[], "accommodations": Accommodation[], "restaurants": Restaurant[], "transportation": Transportation[], "flights": Flight[], "notes": string[] }
Activity: { "id": string, "title": string, "description": string, "location": string, "time": { "start": string, "end": string }, "cost": MoneyAmount, "category": string, "notes": string }
Accommodation: { "id": string, "name": string, "location": string, "checkIn": string, "checkOut": string, "cost": MoneyAmount, "notes": string }
Restaurant: { "id": string, "name": string, "location": string, "time": { "start": string, "end": string }, "reservation": { "name": string, "time": string, "size": number, "confirmation": string }, "cost": MoneyAmount, "cuisine": string, "notes": string }
Transportation: { "id": string, "mode": "train"|"car"|"bus"|"ferry"|"rideshare"|"other", "from": string, "to": string, "departure": string, "arrival": string, "provider": string, "confirmation": string, "cost": MoneyAmount, "notes": string }
MoneyAmount: { "amount": number, "currency": string, "note": string }
`;

async function callExtractor(messages: Message[], mode: ExtractionMode): Promise<TravelPlan | null> {
  const content = await callStructuredChat({
    messages,
    systemPrompt: SYSTEM_PROMPT,
    temperature: mode === "quick" ? 0.2 : 0.3,
    maxTokens: mode === "quick" ? 600 : 1200,
  });

  try {
    const parsed = JSON.parse(content) as TravelPlan;
    return normalizePlan(parsed);
  } catch (e) {
    console.error("Failed to parse itinerary JSON", e, content);
    return null;
  }
}

function normalizeMoney(m?: MoneyAmount): MoneyAmount | undefined {
  if (!m) return undefined;
  return {
    amount: typeof m.amount === "number" ? m.amount : undefined,
    currency: m.currency,
    note: m.note,
  };
}

function normalizeTimeRange(time?: { start?: string; end?: string }) {
  if (!time) return undefined;
  return {
    start: time.start,
    end: time.end,
  };
}

function normalizeActivities(items?: Activity[]): Activity[] | undefined {
  if (!items) return undefined;
  return items.map((a) => ({
    ...a,
    cost: normalizeMoney(a.cost),
    time: normalizeTimeRange(a.time),
  }));
}

function normalizeAccommodations(items?: Accommodation[]): Accommodation[] | undefined {
  if (!items) return undefined;
  return items.map((a) => ({
    ...a,
    cost: normalizeMoney(a.cost),
  }));
}

function normalizeRestaurants(items?: Restaurant[]): Restaurant[] | undefined {
  if (!items) return undefined;
  return items.map((r) => ({
    ...r,
    cost: normalizeMoney(r.cost),
    time: normalizeTimeRange(r.time),
  }));
}

function normalizeTransportation(items?: Transportation[]): Transportation[] | undefined {
  if (!items) return undefined;
  return items.map((t) => ({
    ...t,
    cost: normalizeMoney(t.cost),
  }));
}

function normalizeFlights(items?: Flight[]): Flight[] | undefined {
  if (!items) return undefined;
  return items.map((f) => ({
    ...f,
    cost: normalizeMoney(f.cost),
  }));
}

function normalizeDays(days?: ItineraryDay[]): ItineraryDay[] | undefined {
  if (!days) return undefined;
  return days.map((day) => ({
    ...day,
    activities: normalizeActivities(day.activities),
    accommodations: normalizeAccommodations(day.accommodations),
    restaurants: normalizeRestaurants(day.restaurants),
    transportation: normalizeTransportation(day.transportation),
    flights: normalizeFlights(day.flights),
  }));
}

function normalizeItems(items?: ItineraryItem[]): ItineraryItem[] | undefined {
  if (!items) return undefined;
  return items.map((item) => ({
    ...item,
    cost: normalizeMoney(item.cost),
    time: normalizeTimeRange(item.time),
  }));
}

function normalizePlan(plan: TravelPlan | null): TravelPlan | null {
  if (!plan) return null;

  return {
    ...plan,
    budget: normalizeMoney(plan.budget),
    items: normalizeItems(plan.items),
    days: normalizeDays(plan.days),
    flights: normalizeFlights(plan.flights),
  };
}

export async function extractItineraryQuick(messages: Message[]): Promise<TravelPlan | null> {
  // Focus on the last few messages for a faster pass
  const recent = messages.slice(-6);
  return callExtractor(recent, "quick");
}

export async function extractItineraryFull(messages: Message[]): Promise<TravelPlan | null> {
  return callExtractor(messages, "full");
}

const RANDOM_ITINERARY_PROMPT = `You are a creative travel itinerary generator. Generate a detailed, exciting, and well-structured travel itinerary based on the provided location and dates.
- Always respond with JSON only.
- Create a realistic and diverse itinerary with activities, restaurants, accommodations, and transportation.
- Include popular tourist attractions, local experiences, and cultural activities.
- Make the itinerary engaging and balanced (mix of sightseeing, relaxation, food, and culture).
- Use realistic times, locations, and costs.
- Use day numbers starting at 1.
- Calculate durationDays based on the date range provided.
- Include a reasonable budget estimate.
JSON shape:
{
  "id": string,
  "destination": { "id": string, "name": string, "country": string, "description": string, "imageUrl": string },
  "durationDays": number,
  "budget": { "amount": number, "currency": string, "note": string },
  "participants": string[],
  "flights": Flight[],
  "days": ItineraryDay[]
}
Flight: { "id": string, "from": string, "to": string, "departure": string, "arrival": string, "airline": string, "number": string, "confirmation": string, "cost": MoneyAmount, "notes": string }
ItineraryDay: { "day": number, "date": string, "location": string, "summary": string, "activities": Activity[], "accommodations": Accommodation[], "restaurants": Restaurant[], "transportation": Transportation[], "flights": Flight[], "notes": string[] }
Activity: { "id": string, "title": string, "description": string, "location": string, "time": { "start": string, "end": string }, "cost": MoneyAmount, "category": string, "notes": string }
Accommodation: { "id": string, "name": string, "location": string, "checkIn": string, "checkOut": string, "cost": MoneyAmount, "notes": string }
Restaurant: { "id": string, "name": string, "location": string, "time": { "start": string, "end": string }, "reservation": { "name": string, "time": string, "size": number, "confirmation": string }, "cost": MoneyAmount, "cuisine": string, "notes": string }
Transportation: { "id": string, "mode": "train"|"car"|"bus"|"ferry"|"rideshare"|"other", "from": string, "to": string, "departure": string, "arrival": string, "provider": string, "confirmation": string, "cost": MoneyAmount, "notes": string }
MoneyAmount: { "amount": number, "currency": string, "note": string }
`;

export async function generateRandomItinerary(
  location: string,
  dates: { start?: string; end?: string }
): Promise<TravelPlan | null> {
  // Calculate duration in days
  let durationDays = 3; // default
  if (dates.start && dates.end) {
    const startDate = new Date(dates.start);
    const endDate = new Date(dates.end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  } else if (dates.start) {
    durationDays = 3; // default to 3 days if only start date
  }

  // Create a user message that simulates a travel request
  const dateRange = dates.start && dates.end
    ? `from ${dates.start} to ${dates.end} (${durationDays} days)`
    : dates.start
    ? `starting ${dates.start} for ${durationDays} days`
    : `for ${durationDays} days`;

  const userPrompt = `Create a detailed travel itinerary for ${location} ${dateRange}. Include:
- Popular tourist attractions and landmarks
- Local restaurants and food experiences
- Accommodation recommendations
- Transportation options
- A mix of cultural, historical, and fun activities
- Realistic timing and costs`;

  // Create a mock message array with the prompt
  const mockMessages: Message[] = [
    {
      id: crypto.randomUUID(),
      sender: "user",
      content: userPrompt,
      timestamp: new Date().toISOString(),
      status: "sent",
    },
  ];

  try {
    const content = await callStructuredChat({
      messages: mockMessages,
      systemPrompt: RANDOM_ITINERARY_PROMPT,
      temperature: 0.8, // Higher temperature for more creative/random results
      maxTokens: 2000, // More tokens for detailed itinerary
    });

    const parsed = JSON.parse(content) as TravelPlan;
    return normalizePlan(parsed);
  } catch (e) {
    console.error("Failed to generate random itinerary", e);
    return null;
  }
}


