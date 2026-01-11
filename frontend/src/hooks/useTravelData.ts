import { useEffect, useState } from "react";

import { fetchSampleTravelPlan } from "@/services/travelService";
import type { TravelPlan } from "@/types/travel";

export function useTravelData() {
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSampleTravelPlan()
      .then(setPlan)
      .finally(() => setIsLoading(false));
  }, []);

  return { plan, isLoading };
}

