import { useMemo } from "react";
import type { Flight } from "@/types/travel";
import type { Message } from "@/types/chat";

export function useTickets(messages: Message[]): Flight[] {
  return useMemo(() => {
    const tickets: Flight[] = [];

    messages.forEach((message) => {
      if (message.flights && Array.isArray(message.flights)) {
        message.flights.forEach((flight) => {
          // Only include flights with confirmation numbers (purchased tickets)
          if (flight.confirmation && flight.confirmation.trim()) {
            tickets.push(flight);
          }
        });
      }
    });

    // Remove duplicates based on flight ID
    const uniqueTickets = new Map<string, Flight>();
    tickets.forEach((ticket) => {
      if (!uniqueTickets.has(ticket.id)) {
        uniqueTickets.set(ticket.id, ticket);
      }
    });

    return Array.from(uniqueTickets.values());
  }, [messages]);
}

