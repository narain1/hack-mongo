import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Destination } from "@/types/travel";

interface TravelSuggestionProps {
  destination: Destination;
  description?: string;
}

export function TravelSuggestion({
  destination,
  description,
}: TravelSuggestionProps) {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>{destination.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{destination.country}</p>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

