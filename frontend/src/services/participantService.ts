import client from "./api/client";

/**
 * Fetch group participants from backend.
 * Falls back to empty array on any failure; caller should prepend AI.
 */
export async function fetchParticipants(): Promise<string[]> {
  try {
    const { data } = await client.get("/participants");

    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item.name === "string") return item.name;
          return null;
        })
        .filter((name): name is string => Boolean(name));
    }

    if (data && Array.isArray(data.participants)) {
      return data.participants
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof (item as { name?: string }).name === "string") {
            return (item as { name: string }).name;
          }
          return null;
        })
        .filter((name: string | null): name is string => Boolean(name));
    }
  } catch (error) {
    console.warn("Failed to fetch participants, falling back to AI only", error);
  }

  return [];
}

