import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingPreviewProps {
  summary: string;
  ctaLabel?: string;
}

export function BookingPreview({
  summary,
  ctaLabel = "Proceed to booking",
}: BookingPreviewProps) {
  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle>Booking Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <p className="text-xs text-muted-foreground">
          {ctaLabel} (stub — connect backend when ready)
        </p>
      </CardContent>
    </Card>
  );
}

