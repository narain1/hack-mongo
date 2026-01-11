export interface Destination {
  id: string;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
}

export interface MoneyAmount {
  amount?: number;
  currency?: string;
  note?: string;
}

export interface TimeRange {
  start?: string; // ISO time or datetime
  end?: string;   // ISO time or datetime
}

export interface Accommodation {
  id: string;
  name: string;
  location?: string;
  checkIn?: string;  // ISO date or datetime
  checkOut?: string; // ISO date or datetime
  cost?: MoneyAmount;
  notes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  location?: string;
  time?: TimeRange;
  reservation?: {
    name?: string;
    time?: string; // ISO datetime
    size?: number;
    confirmation?: string;
  };
  cost?: MoneyAmount;
  cuisine?: string;
  notes?: string;
}

export interface Flight {
  id: string;
  from: string;
  to: string;
  departure: string; // ISO datetime
  arrival: string;   // ISO datetime
  airline?: string;
  number?: string;
  confirmation?: string;
  cost?: MoneyAmount;
  notes?: string;
}

export interface Transportation {
  id: string;
  mode: "train" | "car" | "bus" | "ferry" | "rideshare" | "other";
  from?: string;
  to?: string;
  departure?: string; // ISO datetime
  arrival?: string;   // ISO datetime
  provider?: string;
  confirmation?: string;
  cost?: MoneyAmount;
  notes?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  location?: string;
  time?: TimeRange;
  cost?: MoneyAmount;
  category?:
    | "sightseeing"
    | "adventure"
    | "food"
    | "culture"
    | "shopping"
    | "relaxation"
    | "other";
  notes?: string;
}

export interface ItineraryItem {
  id: string;
  title: string;
  day: number;
  description: string;
  location?: string;
  time?: TimeRange;
  cost?: MoneyAmount;
  type?: "activity" | "accommodation" | "restaurant" | "transportation" | "other";
  notes?: string;
}

export interface ItineraryDay {
  day: number;
  date?: string; // ISO date
  location?: string;
  summary?: string;
  activities?: Activity[];
  accommodations?: Accommodation[];
  restaurants?: Restaurant[];
  transportation?: Transportation[];
  flights?: Flight[];
  notes?: string[];
}

export interface TravelPlan {
  id: string;
  destination?: Destination;
  items?: ItineraryItem[]; // legacy field for simple lists
  days?: ItineraryDay[];
  flights?: Flight[];
  estimatedCost?: string;
  durationDays?: number;
  budget?: MoneyAmount;
  participants?: string[];
}

