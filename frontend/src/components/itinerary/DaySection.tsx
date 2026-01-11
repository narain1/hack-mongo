import { useState } from "react";
import { ChevronDown, MapPin, NotebookPen, Bus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItineraryDay } from "@/types/travel";
import { ActivityCard } from "./ActivityCard";
import { AccommodationCard } from "./AccommodationCard";
import { RestaurantCard } from "./RestaurantCard";

interface DaySectionProps {
  day: ItineraryDay;
  defaultOpen?: boolean;
}

export function DaySection({ day, defaultOpen = false }: DaySectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="w-full border border-border/70 bg-card/70">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {day.day}
            </div>
            <div className="flex flex-col">
              <span className="text-foreground">Day {day.day}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                {day.date || "Date TBD"}
                {day.location && (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <MapPin className="h-3 w-3" />
                    {day.location}
                  </>
                )}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="flex flex-col gap-3">
          {day.summary && (
            <div className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground flex items-start gap-2">
              <NotebookPen className="h-4 w-4 mt-0.5 text-primary" />
              <span>{day.summary}</span>
            </div>
          )}

          {day.activities && day.activities.length > 0 && (
            <div className="flex flex-col gap-2">
              {day.activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}

          {day.accommodations && day.accommodations.length > 0 && (
            <div className="flex flex-col gap-2">
              {day.accommodations.map((acc) => (
                <AccommodationCard key={acc.id} accommodation={acc} />
              ))}
            </div>
          )}

          {day.restaurants && day.restaurants.length > 0 && (
            <div className="flex flex-col gap-2">
              {day.restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}

          {day.transportation && day.transportation.length > 0 && (
            <div className="flex flex-col gap-2">
              {day.transportation.map((transport) => (
                <div
                  key={transport.id}
                  className="w-full rounded-lg border border-border/80 bg-background/60 p-3 text-sm"
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="capitalize">{transport.mode}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {transport.from || "Start"} → {transport.to || "End"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Depart: {transport.departure || "—"} • Arrive: {transport.arrival || "—"}
                  </div>
                  {transport.cost?.amount && transport.cost?.currency && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Cost: {transport.cost.currency} {transport.cost.amount}
                    </div>
                  )}
                  {transport.notes && (
                    <div className="text-xs text-muted-foreground mt-1">Notes: {transport.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!day.activities?.length &&
            !day.accommodations?.length &&
            !day.restaurants?.length &&
            !day.transportation?.length && (
              <div className="w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                No details for this day yet.
              </div>
            )}
        </CardContent>
      )}
    </Card>
  );
}


