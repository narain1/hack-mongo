import { Bed, CalendarClock, MapPin, DollarSign } from "lucide-react";

import type { Accommodation } from "@/types/travel";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";

interface AccommodationCardProps {
  accommodation: Accommodation;
}

function formatDateRange(checkIn?: string, checkOut?: string) {
  if (checkIn && checkOut) return `${checkIn} - ${checkOut}`;
  if (checkIn) return `From ${checkIn}`;
  if (checkOut) return `Until ${checkOut}`;
  return "Dates TBD";
}

function formatCost(accommodation: Accommodation) {
  const cost = accommodation.cost;
  if (cost?.amount && cost.currency) {
    return `${cost.currency} ${cost.amount}${cost.note ? ` • ${cost.note}` : ""}`;
  }
  if (cost?.note) return cost.note;
  return null;
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  // Build query from name and location for photo search
  const photoQuery = accommodation.location
    ? `${accommodation.name}, ${accommodation.location}`
    : accommodation.name;
  
  const { photoUrl } = usePlacePhoto(photoQuery);

  return (
    <div className="w-full rounded-lg border border-border/80 bg-background/60 overflow-hidden flex flex-col">
      {photoUrl && (
        <div className="relative w-full h-40 bg-muted">
          <img
            src={photoUrl}
            alt={accommodation.name}
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
            <Bed className="h-4 w-4 text-primary" />
            {accommodation.name}
          </div>
          {accommodation.cost && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCost(accommodation)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {formatDateRange(accommodation.checkIn, accommodation.checkOut)}
          </span>
          {accommodation.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {accommodation.location}
            </span>
          )}
        </div>
        {accommodation.notes && (
          <div className="text-xs text-muted-foreground mt-1">Notes: {accommodation.notes}</div>
        )}
      </div>
    </div>
  );
}


