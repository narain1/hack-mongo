import type { Agent } from "@/types/agent";

export async function fetchAgents(): Promise<Agent[]> {
  return [
    { id: "alex", name: "Alex", status: "running" },
    { id: "sarah", name: "Sarah", status: "idle" },
    { id: "mike", name: "Mike", status: "idle" },
    { id: "lisa", name: "Lisa", status: "idle" },
    { id: "travel-bot", name: "TravelAgent", status: "running" },
  ];
}

