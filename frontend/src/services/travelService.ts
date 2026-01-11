import client from "./api/client";
import type { TravelPlan } from "@/types/travel";

export async function fetchSampleTravelPlan(): Promise<TravelPlan> {
  try {
    const { data } = await client.get("/travel/plan").catch(() => ({
      data: null,
    }));
    // Validate that the data has the required structure
    if (data && data.destination && data.destination.name) {
      return data;
    }
  } catch {
    // ignore for placeholder
  }

  // Return fallback sample plan
  return {
    id: "sample-plan",
    destination: {
      id: "hawaii",
      name: "Oahu, Hawaii",
      country: "USA",
      description: "Beaches, hikes, and island adventures.",
    },
    durationDays: 5,
    estimatedCost: "$2,400",
    items: [
      {
        id: "1",
        day: 1,
        title: "Arrive & Waikiki Sunset",
        description: "Check-in, walk Waikiki, sunset at Ala Moana Beach.",
      },
      {
        id: "2",
        day: 2,
        title: "North Shore Day Trip",
        description: "Haleiwa town, food trucks, and Waimea Bay beach time.",
      },
    ],
  };
}

