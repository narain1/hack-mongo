import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlightCard } from "@/components/flights/FlightCard";
import type { Flight } from "@/types/travel";

interface FlightModalProps {
  open: boolean;
  onClose: () => void;
  flights: Flight[];
}

export function FlightModal({ open, onClose, flights }: FlightModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 py-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">All flight options</p>
            <p className="text-xs text-muted-foreground">
              Showing {flights.length} option{flights.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close flight modal"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="max-h-[70vh]">
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

