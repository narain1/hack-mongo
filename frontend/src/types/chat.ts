export type Sender = "user" | "assistant" | "agent";

export interface Message {
  id: string;
  sender: Sender;
  content: string;
  timestamp: string;
  agentName?: string;
  status?: "pending" | "sent" | "error";
  photos?: string[];
  flights?: import("@/types/travel").Flight[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  participants?: string[];
  travelPlan?: import("@/types/travel").TravelPlan;
  location?: string;
}

