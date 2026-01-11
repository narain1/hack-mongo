import { Plane, ArrowRight, Clock, Ticket } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { Flight, MoneyAmount } from "@/types/travel";

interface FlightCardProps {
  flight: Flight;
  dense?: boolean;
}

function formatDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(cost?: MoneyAmount): string | undefined {
  if (!cost?.amount) return undefined;
  const currency = cost.currency || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cost.amount);
  } catch {
    return `${currency} ${cost.amount}`;
  }
}

function formatDuration(departure?: string, arrival?: string): string | undefined {
  if (!departure || !arrival) return undefined;
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return undefined;
  const minutes = Math.round((end - start) / (1000 * 60));
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  if (mins) return `${mins}m`;
  return undefined;
}

export function FlightCard({ flight, dense }: FlightCardProps) {
  const price = formatPrice(flight.cost);
  const duration = formatDuration(flight.departure, flight.arrival);

  return (
    <Card
      className="group border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-border transition-all duration-200 w-fit"
      aria-label={`${flight.from} to ${flight.to} flight option`}
    >
      <div className={dense ? "p-4 w-full" : "p-5 w-full"}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground flex-1 min-w-0">
            <Plane className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate w-fit">{flight.from}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate w-fit">{flight.to}</span>
          </div>
          {price && (
            <div 
              className="rounded-full px-3 py-1 text-xs font-semibold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: '#862041' }}
            >
              {price}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors w-fit">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Departure</p>
            <p className="text-sm font-semibold text-foreground">{formatDateTime(flight.departure)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors w-fit">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Arrival</p>
            <p className="text-sm font-semibold text-foreground">{formatDateTime(flight.arrival)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/30">
          {(flight.airline || flight.number) && (
            <div className="flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">
                {[flight.airline, flight.number].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{duration}</span>
            </div>
          )}
          {flight.confirmation && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground">Conf:</span>
              <span className="font-mono">{flight.confirmation}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

