import { useState, useEffect } from "react";
import { fetchPlacePhotos } from "@/services/placesService";

export function usePlacePhoto(query: string | undefined) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || !query.trim()) {
      setPhotoUrl(null);
      return;
    }

    setIsLoading(true);
    fetchPlacePhotos(query, 1)
      .then((photos) => {
        setPhotoUrl(photos.length > 0 ? photos[0] : null);
      })
      .catch((error) => {
        console.error("Failed to fetch place photo:", error);
        setPhotoUrl(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [query]);

  return { photoUrl, isLoading };
}

