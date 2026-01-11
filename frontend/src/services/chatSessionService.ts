import type { ChatSession, Message } from "@/types/chat";
import type { TravelPlan } from "@/types/travel";

const STORAGE_KEY = "travel_chat_sessions";

export interface SavedChatSession extends ChatSession {
  createdAt: string;
  updatedAt: string;
  location?: string;
  travelPlan?: TravelPlan;
}

/**
 * Extract location from messages (looks for destination mentions in user messages)
 */
function extractLocation(messages: Message[]): string | undefined {
  const userMessages = messages.filter((m) => m.sender === "user");
  // Look for common travel-related patterns
  for (const msg of userMessages) {
    const content = msg.content.toLowerCase();
    // Try to find location mentions (this is a simple heuristic)
    // In a real app, this would be extracted from AI responses or structured data
    const locationPatterns = [
      /(?:to|visit|going to|travel to|trip to)\s+([A-Z][a-zA-Z\s,]+)/,
      /([A-Z][a-zA-Z\s]+),?\s+(?:Hawaii|Paris|Tokyo|Bali|Thailand|Italy|Spain|Greece)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  return undefined;
}

/**
 * Generate a title from the first user message
 */
function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.sender === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    // Truncate to 50 chars
    return content.length > 50 ? content.substring(0, 50) + "..." : content;
  }
  return "New Chat";
}

/**
 * Get all saved chat sessions
 */
export function getSavedSessions(): SavedChatSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save a chat session
 */
export function saveChatSession(
  sessionId: string,
  messages: Message[],
  travelPlan?: TravelPlan
): void {
  const sessions = getSavedSessions();
  const location = extractLocation(messages) || travelPlan?.destination?.name;
  const title = generateTitle(messages);
  
  const existingIndex = sessions.findIndex((s) => s.id === sessionId);
  const now = new Date().toISOString();
  
  const session: SavedChatSession = {
    id: sessionId,
    title,
    messages,
    createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : now,
    updatedAt: now,
    location,
    travelPlan,
  };
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.unshift(session); // Add to beginning
  }
  
  // Keep only last 50 sessions
  const limitedSessions = sessions.slice(0, 50);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions));
  } catch (error) {
    console.error("Failed to save chat session", error);
  }
}

/**
 * Delete a chat session
 */
export function deleteChatSession(sessionId: string): void {
  const sessions = getSavedSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete chat session", error);
  }
}

/**
 * Get a single chat session by ID
 */
export function getChatSession(sessionId: string): SavedChatSession | undefined {
  const sessions = getSavedSessions();
  return sessions.find((s) => s.id === sessionId);
}

