import type { Flight, MoneyAmount } from "@/types/travel";

export const FLIGHT_MARKER = "[[FLIGHT_DATA]]";

type ParsedFlights = Flight[];

function tryParseJSON(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJSONBlocks(content: string): unknown[] {
  const blocks: unknown[] = [];

  const fenced = content.match(/```json([\s\S]*?)```/gi);
  if (fenced) {
    fenced.forEach((block) => {
      const cleaned = block.replace(/```json/i, "").replace(/```$/, "");
      const parsed = tryParseJSON(cleaned.trim());
      if (parsed) blocks.push(parsed);
    });
  }

  if (!fenced?.length) {
    const genericFence = content.match(/```([\s\S]*?)```/g);
    if (genericFence) {
      genericFence.forEach((block) => {
        const cleaned = block.replace(/```/g, "");
        const parsed = tryParseJSON(cleaned.trim());
        if (parsed) blocks.push(parsed);
      });
    }
  }

  // As a final attempt, try to parse the whole content if it looks like JSON
  if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
    const parsed = tryParseJSON(content.trim());
    if (parsed) blocks.push(parsed);
  }

  return blocks;
}

function coerceMoney(amountText?: string): MoneyAmount | undefined {
  if (!amountText) return undefined;
  const match = amountText.match(
    /(?:(USD|EUR|GBP|CAD|AUD|INR|JPY|SGD|CHF|CNY)\s*)?\$?\s*([\d,]+(?:\.\d+)?)/i,
  );
  if (!match) return undefined;

  const currency = match[1];
  const amount = Number(match[2].replace(/,/g, ""));
  if (Number.isNaN(amount)) return undefined;

  return { amount, currency: currency?.toUpperCase() || "USD" };
}

function normalizeFlight(raw: Partial<Flight>): Flight | null {
  if (!raw.from || !raw.to) return null;
  const now = new Date().toISOString();
  return {
    id: raw.id || crypto.randomUUID(),
    from: String(raw.from).trim(),
    to: String(raw.to).trim(),
    departure: raw.departure || now,
    arrival: raw.arrival || now,
    airline: raw.airline?.trim(),
    number: raw.number?.trim(),
    confirmation: raw.confirmation?.trim(),
    cost: raw.cost,
    notes: raw.notes,
  };
}

function parseFlightsFromJSONContent(content: string): ParsedFlights {
  const blocks = extractJSONBlocks(content);
  const flights: ParsedFlights = [];

  const pushFlightArray = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const flight = normalizeFlight(item as Partial<Flight>);
        if (flight) flights.push(flight);
      });
      return true;
    }
    if (value && typeof value === "object" && "flights" in (value as Record<string, unknown>)) {
      const maybeFlights = (value as { flights?: unknown }).flights;
      if (Array.isArray(maybeFlights)) {
        maybeFlights.forEach((item) => {
          const flight = normalizeFlight(item as Partial<Flight>);
          if (flight) flights.push(flight);
        });
        return true;
      }
    }
    return false;
  };

  for (const block of blocks) {
    if (pushFlightArray(block)) break;
  }

  return flights;
}

function parseDateLike(value: string): string | undefined {
  const cleaned = value.trim();

  // Try ISO formats
  const isoMatch = cleaned.match(/\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?/);
  if (isoMatch) {
    const date = new Date(isoMatch[0]);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Try time-only formats; anchor to today
  const timeMatch = cleaned.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i);
  if (timeMatch) {
    const now = new Date();
    const base = now.toISOString().split("T")[0];
    const candidate = new Date(`${base} ${timeMatch[1]}`);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate.toISOString();
    }
  }

  return undefined;
}

function parseFlightsFromText(content: string): ParsedFlights {
  const segments = content.split(/\n{2,}/);
  const flights: ParsedFlights = [];

  const routeRegex = /([A-Za-z]{3,})\s*(?:to|→|➡|->|—|–|-)\s*([A-Za-z]{3,})/i;

  for (const segment of segments) {
    const routeMatch = segment.match(routeRegex);
    if (!routeMatch) continue;

    const [_, from, to] = routeMatch;

    const departureLine =
      segment.match(/depart(?:ure)?[:\-\s]*([^\n]+)/i)?.[1] ||
      segment.match(/outbound[:\-\s]*([^\n]+)/i)?.[1] ||
      segment.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i)?.[1];

    const arrivalLine =
      segment.match(/arriv(?:al|es)[:\-\s]*([^\n]+)/i)?.[1] ||
      segment.match(/landing[:\-\s]*([^\n]+)/i)?.[1];

    const airline =
      segment.match(/airline[:\-\s]*([^\n]+)/i)?.[1]?.trim() ||
      segment.match(/with\s+([A-Za-z\s]+)\b/i)?.[1]?.trim();

    const number = segment.match(/\b([A-Z]{2}\d{2,4})\b/)?.[1];
    const price = coerceMoney(segment);

    const departure = departureLine ? parseDateLike(departureLine) : undefined;
    const arrival = arrivalLine ? parseDateLike(arrivalLine) : undefined;

    const flight = normalizeFlight({
      from,
      to,
      departure,
      arrival,
      airline,
      number,
      cost: price,
      notes: segment.trim(),
    });

    if (flight) {
      flights.push(flight);
    }
  }

  return flights;
}

export function detectAndParseFlights(content: string): ParsedFlights {
  if (!content?.trim()) return [];

  // 1) Try structured JSON first
  const jsonFlights = parseFlightsFromJSONContent(content);
  if (jsonFlights.length) return jsonFlights;

  // 2) Fallback to text parsing
  const textFlights = parseFlightsFromText(content);
  return textFlights;
}

function stripFlightArtifacts(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(new RegExp(`${FLIGHT_MARKER}`, "g"), "");
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, "");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Remove date patterns like [Dates: 2026-01-16 to 2026-01-20]
  cleaned = cleaned.replace(/\[Dates?:\s*[\d\-]+\s+to\s+[\d\-]+\]/gi, "");
  return cleaned.trim();
}

/**
 * Extract flights only when the LLM includes the FLIGHT_MARKER.
 * Returns the cleaned message content (marker and JSON removed) plus parsed flights.
 */
export function extractFlightsPayload(content: string): { cleanContent: string; flights: Flight[] } {
  if (!content.includes(FLIGHT_MARKER)) {
    // Still clean date patterns even if no FLIGHT_MARKER
    const cleanContent = stripFlightArtifacts(content);
    return { cleanContent, flights: [] };
  }

  const flights = detectAndParseFlights(content);
  const cleanContent = stripFlightArtifacts(content);
  return { cleanContent, flights };
}

