import { useMemo } from "react";
import { RefreshCw, Plane, Clock, Users, MapPin, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/useChat";
import type { TravelPlan, ItineraryDay } from "@/types/travel";
import { DaySection } from "./DaySection";

function formatDestination(plan: TravelPlan | null) {
  const name = plan?.destination?.name;
  const country = plan?.destination?.country;
  if (name && country) return `${name}, ${country}`;
  return name || country || "Destination";
}

function formatDuration(plan: TravelPlan | null) {
  if (plan?.durationDays) return `${plan.durationDays} days`;
  const days = plan?.days?.length;
  if (days) return `${days} days`;
  return "Timeline";
}

function formatBudget(plan: TravelPlan | null) {
  const budget = plan?.budget;
  if (!budget) return null;
  if (budget.amount && budget.currency) {
    return `${budget.currency} ${budget.amount}${budget.note ? ` • ${budget.note}` : ""}`;
  }
  if (budget.note) return budget.note;
  return null;
}

interface ItineraryViewProps {
  selectedLocation?: string;
  selectedDates?: { start?: string; end?: string };
}

export function ItineraryView({ selectedLocation, selectedDates }: ItineraryViewProps) {
  const { itinerary, isExtractingItinerary, extractFullItinerary, generateRandomItinerary } = useChat();

  const days: ItineraryDay[] = useMemo(() => {
    if (itinerary?.days && itinerary.days.length > 0) {
      return itinerary.days;
    }

    if (itinerary?.items && itinerary.items.length > 0) {
      // Fallback: group legacy items by day
      const grouped: Record<number, ItineraryDay> = {};
      itinerary.items.forEach((item) => {
        if (!grouped[item.day]) {
          grouped[item.day] = { day: item.day, activities: [] };
        }
        grouped[item.day].activities = [
          ...(grouped[item.day].activities || []),
          {
            id: item.id,
            title: item.title,
            description: item.description,
            location: item.location,
            time: item.time,
            cost: item.cost,
          },
        ];
      });
      return Object.values(grouped).sort((a, b) => a.day - b.day);
    }
    return [];
  }, [itinerary]);

  const emptyState = !itinerary || days.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {formatDestination(itinerary)}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDuration(itinerary)}
              {itinerary?.participants && itinerary.participants.length > 0 && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <Users className="h-4 w-4" />
                  <span>{itinerary.participants.length} travelers</span>
                </>
              )}
              {formatBudget(itinerary) && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  {formatBudget(itinerary)}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedLocation && (
            <Button
              variant="default"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (selectedLocation) {
                  generateRandomItinerary(selectedLocation, selectedDates || {});
                }
              }}
              disabled={isExtractingItinerary || !selectedLocation}
            >
              {isExtractingItinerary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Random
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => extractFullItinerary()}
            disabled={isExtractingItinerary}
          >
            {isExtractingItinerary ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1" hideScrollbar>
        <div className="flex flex-col gap-4 px-6 pb-6">
          {isExtractingItinerary && !itinerary && (
            <Card className="w-full border border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your itinerary...
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {emptyState && !isExtractingItinerary && (
            <Card className="w-full border border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="text-base">No itinerary yet</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {selectedLocation
                    ? `Select a location and dates, then generate a random itinerary for ${selectedLocation}.`
                    : "Select a location and dates in the header, then generate a random itinerary. You can also ask travel-related questions in chat."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (selectedLocation) {
                          generateRandomItinerary(selectedLocation, selectedDates || {});
                        }
                      }}
                      disabled={isExtractingItinerary || !selectedLocation}
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate Random Itinerary
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => extractFullItinerary()}
                    disabled={isExtractingItinerary}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh from chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!emptyState &&
            days.map((day, idx) => (
              <DaySection key={day.day} day={day} defaultOpen={idx === 0} />
            ))}

          {!emptyState && itinerary?.flights && itinerary.flights.length > 0 && (
            <Card className="w-full border border-border/70 bg-card/70">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Flights
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {itinerary.flights.map((flight) => (
                  <div
                    key={flight.id}
                    className="w-full rounded-lg border border-border/80 bg-background/60 p-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Plane className="h-4 w-4 text-primary" />
                        {flight.from} → {flight.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {flight.airline || "Airline"} {flight.number || ""}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Depart: {flight.departure || "—"} • Arrive: {flight.arrival || "—"}
                    </div>
                    {flight.cost?.amount && flight.cost?.currency && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Cost: {flight.cost.currency} {flight.cost.amount}
                      </div>
                    )}
                    {flight.notes && (
                      <div className="text-xs text-muted-foreground mt-1">Notes: {flight.notes}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}


