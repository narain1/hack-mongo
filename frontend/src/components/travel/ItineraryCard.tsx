import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TravelPlan } from "@/types/travel";

interface ItineraryCardProps {
  plan: TravelPlan;
}

export function ItineraryCard({ plan }: ItineraryCardProps) {
  if (!plan || !plan.destination) {
    return null;
  }

  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>
          {plan.destination?.name || "Unknown Destination"} • {plan.durationDays ?? "—"} days
        </CardTitle>
        {plan.destination?.description && (
          <p className="text-sm text-muted-foreground">
            {plan.destination.description}
          </p>
        )}
      </CardHeader>
      {plan.items && plan.items.length > 0 && (
        <CardContent className="flex flex-col gap-3">
          {plan.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/80 bg-background/60 p-3"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Day {item.day}
              </p>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

