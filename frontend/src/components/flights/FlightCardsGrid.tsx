import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FlightCard } from "@/components/flights/FlightCard";
import { FlightModal } from "@/components/flights/FlightModal";
import type { Flight } from "@/types/travel";

interface FlightCardsGridProps {
  flights: Flight[];
}

export function FlightCardsGrid({ flights }: FlightCardsGridProps) {
  const [open, setOpen] = useState(false);

  if (!flights?.length) return null;

  const topThree = flights.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topThree.map((flight) => (
          <FlightCard key={flight.id} flight={flight} dense />
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setOpen(true)}
        >
          Explore all ({flights.length})
        </Button>
      </div>

      <FlightModal open={open} onClose={() => setOpen(false)} flights={flights} />
    </div>
  );
}

