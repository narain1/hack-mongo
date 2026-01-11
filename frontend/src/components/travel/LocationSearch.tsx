import { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  value?: string;
  onChange?: (location: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showIcon?: boolean;
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => {
            getPlacePredictions: (
              request: { input: string; types?: string[] },
              callback: (predictions: any[] | null, status: any) => void
            ) => void;
          };
          PlacesService: new (element: HTMLElement) => {
            getDetails: (
              request: { placeId: string; fields: string[] },
              callback: (place: any, status: any) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
          };
          AutocompletePrediction: {
            description: string;
            place_id: string;
          };
        };
      };
    };
    initGoogleMaps: () => void;
  }
}

export function LocationSearch({
  value = "",
  onChange,
  placeholder = "Search for a place",
  className,
  inputClassName,
  showIcon = true,
}: LocationSearchProps) {
  const [searchValue, setSearchValue] = useState(value);
  const [predictions, setPredictions] = useState<Array<{ 
    description: string; 
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text?: string;
    };
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<InstanceType<typeof window.google.maps.places.AutocompleteService> | null>(null);
  const placesServiceRef = useRef<InstanceType<typeof window.google.maps.places.PlacesService> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Google Maps script
  useEffect(() => {
    const initializeServices = () => {
      if (window.google?.maps?.places) {
        if (!autocompleteServiceRef.current) {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }
        // Create a dummy div for PlacesService (it requires a map or div)
        if (!placesServiceRef.current) {
          const dummyDiv = document.createElement("div");
          placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
        }
      }
    };

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initializeServices();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          initializeServices();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Check for both VITE_GOOGLE_MAPS_API_KEY and GOOGLE_API_KEY (fallback)
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "";
    
    if (!apiKey) {
      console.warn("Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY (or VITE_GOOGLE_API_KEY) in your .env file");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      initializeServices();
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };

    document.head.appendChild(script);
  }, []);

  // Update search value when prop changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchValue(inputValue);
    setShowSuggestions(true);

    if (!inputValue.trim()) {
      setPredictions([]);
      return;
    }

    if (!autocompleteServiceRef.current) {
      return;
    }

    setIsLoading(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: inputValue,
        types: ["(cities)"], // Focus on cities, but can be changed to include more types
      },
      (predictions: any[] | null, status: any) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  // Handle selection
  const handleSelectPlace = (prediction: { 
    description: string; 
    place_id: string;
    structured_formatting?: {
      main_text: string;
      secondary_text?: string;
    };
  }) => {
    setSearchValue(prediction.description);
    setShowSuggestions(false);
    setPredictions([]);
    onChange?.(prediction.description);
  };

  // Handle clear
  const handleClear = () => {
    setSearchValue("");
    setShowSuggestions(false);
    setPredictions([]);
    onChange?.("");
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const shouldShowIcon = showIcon && !searchValue.trim();

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        {shouldShowIcon && (
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0 pointer-events-none" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            inputClassName,
            shouldShowIcon && "!pl-9",
            searchValue && "!pr-9"
          )}
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors"
            aria-label="Clear"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPlace(prediction)}
              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </div>
                  {prediction.structured_formatting?.secondary_text && (
                    <div className="text-xs text-muted-foreground truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isLoading && showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="text-sm text-muted-foreground text-center">Searching places...</div>
        </div>
      )}
    </div>
  );
}

