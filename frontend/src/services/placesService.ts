const FIND_PLACE_URL = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const PHOTO_URL = "https://maps.googleapis.com/maps/api/place/photo";

function getGoogleApiKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  return key;
}

function buildPhotoUrl(photoReference: string, apiKey: string, maxWidth = 800) {
  const url = new URL(PHOTO_URL);
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("photoreference", photoReference);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

export async function fetchPlacePhotos(query: string, maxPhotos = 5): Promise<string[]> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];

  const params = new URLSearchParams({
    input: trimmed,
    inputtype: "textquery",
    fields: "photos,name,place_id",
    key: apiKey,
  });

  const response = await fetch(`${FIND_PLACE_URL}?${params.toString()}`);
  if (!response.ok) {
    console.error("Places findPlace error", response.status, response.statusText);
    return [];
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const photos = candidate?.photos;
  if (!photos || !Array.isArray(photos)) return [];

  return photos
    .slice(0, maxPhotos)
    .map((p: { photo_reference?: string }) => p?.photo_reference)
    .filter((ref: string | undefined): ref is string => Boolean(ref))
    .map((ref: string) => buildPhotoUrl(ref, apiKey));
}


