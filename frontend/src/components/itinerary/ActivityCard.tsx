import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Camera, 
  Mountain, 
  Utensils, 
  Building2, 
  ShoppingBag, 
  Waves, 
  Star 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Activity } from "@/types/travel";
import { usePlacePhoto } from "@/hooks/usePlacePhoto";

interface ActivityCardProps {
  activity: Activity;
}

function formatTimeRange(
  start?: string,
  end?: string,
): string {
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  if (end) return `by ${end}`;
  return "Time TBD";
}

function formatCost(activity: Activity) {
  const cost = activity.cost;
  if (cost?.amount && cost.currency) {
    return `${cost.currency} ${cost.amount}${cost.note ? ` • ${cost.note}` : ""}`;
  }
  if (cost?.note) return cost.note;
  return null;
}

function getActivityIcon(category?: Activity["category"]): LucideIcon {
  switch (category) {
    case "sightseeing":
      return Camera;
    case "adventure":
      return Mountain;
    case "food":
      return Utensils;
    case "culture":
      return Building2;
    case "shopping":
      return ShoppingBag;
    case "relaxation":
      return Waves;
    default:
      return Star;
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  // Build query from title and location for photo search
  const photoQuery = activity.location
    ? `${activity.title}, ${activity.location}`
    : activity.title;
  
  const { photoUrl } = usePlacePhoto(photoQuery);
  const ActivityIcon = getActivityIcon(activity.category);

  return (
    <div className="w-full rounded-lg border border-border/80 bg-background/60 overflow-hidden flex flex-col">
      {photoUrl && (
        <div className="relative w-full h-40 bg-muted">
          <img
            src={photoUrl}
            alt={activity.title}
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
            <ActivityIcon className="h-4 w-4 text-primary" />
            {activity.title}
          </div>
          {activity.cost && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              {formatCost(activity)}
            </span>
          )}
        </div>
        {activity.description && (
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeRange(activity.time?.start, activity.time?.end)}
          </span>
          {activity.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {activity.location}
            </span>
          )}
          {activity.category && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
              {activity.category}
            </span>
          )}
        </div>
        {activity.notes && (
          <div className="text-xs text-muted-foreground mt-1">Notes: {activity.notes}</div>
        )}
      </div>
    </div>
  );
}


