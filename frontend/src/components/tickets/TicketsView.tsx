import { Ticket, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Flight } from "@/types/travel";

interface TicketsViewProps {
  tickets: Flight[];
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

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatPrice(cost?: { amount?: number; currency?: string }): string | undefined {
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

export function TicketsView({ tickets }: TicketsViewProps) {
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a.departure).getTime();
      const dateB = new Date(b.departure).getTime();
      return dateA - dateB;
    });
  }, [tickets]);

  if (tickets.length === 0) {
    return (
      <ScrollArea className="flex-1" hideScrollbar>
        <div className="flex flex-col gap-4 px-6 pt-6 pb-6">
          <Card className="border border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">No tickets yet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                When an agent completes a ticket purchase, it will appear here. Booked flights with confirmation numbers will be displayed.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1" hideScrollbar>
      <div className="flex flex-col gap-4 px-6 pb-6">
        {sortedTickets.map((ticket) => {
          const price = formatPrice(ticket.cost);
          const duration = formatDuration(ticket.departure, ticket.arrival);
          const departureDate = formatDate(ticket.departure);
          const departureTime = formatDateTime(ticket.departure);
          const arrivalTime = formatDateTime(ticket.arrival);

          return (
            <Card
              key={ticket.id}
              className="border border-border/60 bg-card shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Ticket className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {ticket.from} → {ticket.to}
                      </CardTitle>
                      {ticket.airline && (
                        <CardDescription className="text-xs">
                          {ticket.airline}
                          {ticket.number && ` • ${ticket.number}`}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {price && (
                    <Badge
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: '#862041' }}
                    >
                      {price}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Departure
                    </div>
                    <p className="text-sm font-semibold text-foreground">{departureTime}</p>
                    <p className="text-xs text-muted-foreground">{departureDate}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Arrival
                    </div>
                    <p className="text-sm font-semibold text-foreground">{arrivalTime}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  {duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{duration}</span>
                    </div>
                  )}
                  {ticket.confirmation && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="font-semibold text-foreground">
                        Confirmation: <span className="font-mono">{ticket.confirmation}</span>
                      </span>
                    </div>
                  )}
                </div>

                {ticket.notes && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">{ticket.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

