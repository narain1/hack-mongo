import { UtensilsCrossed, Clock, MapPin, DollarSign, Ticket } from "lucide-react";

import type { Restaurant } from "@/types/travel";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";

interface RestaurantCardProps {
  restaurant: Restaurant;
}

function formatTimeRange(start?: string, end?: string) {
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return `by ${end}`;
  return "Time TBD";
}

function formatReservation(restaurant: Restaurant) {
  const res = restaurant.reservation;
  if (!res) return null;
  const parts = [
    res.time,
    res.size ? `${res.size} people` : undefined,
    res.name,
    res.confirmation ? `Conf: ${res.confirmation}` : undefined,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(" • ");
}

function formatCost(restaurant: Restaurant) {
  const cost = restaurant.cost;
  if (cost?.amount && cost.currency) {
    return `${cost.currency} ${cost.amount}${cost.note ? ` • ${cost.note}` : ""}`;
  }
  if (cost?.note) return cost.note;
  return null;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  // Build query from name and location for photo search
  const photoQuery = restaurant.location
    ? `${restaurant.name}, ${restaurant.location}`
    : restaurant.name;
  
  const { photoUrl } = usePlacePhoto(photoQuery);

  return (
    <div className="w-full rounded-lg border border-border/80 bg-background/60 overflow-hidden flex flex-col">
      {photoUrl && (
        <div className="relative w-full h-40 bg-muted">
          <img
            src={photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3 text-sm flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {restaurant.name}
          </div>
          {restaurant.cost && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCost(restaurant)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeRange(restaurant.time?.start, restaurant.time?.end)}
          </span>
          {restaurant.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {restaurant.location}
            </span>
          )}
          {restaurant.cuisine && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
              {restaurant.cuisine}
            </span>
          )}
        </div>
        {formatReservation(restaurant) && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Ticket className="h-3 w-3" />
            {formatReservation(restaurant)}
          </div>
        )}
        {restaurant.notes && (
          <div className="text-xs text-muted-foreground mt-1">Notes: {restaurant.notes}</div>
        )}
      </div>
    </div>
  );
}


