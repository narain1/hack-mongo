import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Destination } from "@/types/travel";

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>{destination.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{destination.country}</p>
      </CardHeader>
      {destination.description ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {destination.description}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

