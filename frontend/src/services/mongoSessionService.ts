/**
 * Service to fetch session data from MongoDB API and convert to frontend format
 */

import type { Message } from "@/types/chat";
import type { SavedChatSession } from "@/services/chatSessionService";
import { saveChatSession } from "@/services/chatSessionService";

const API_BASE_URL = "https://nomadsync.ramharikrishnan.dev"; // or use env variable

interface MongoMessage {
  _id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface MongoSession {
  _id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert MongoDB message format to frontend Message format
 */
function convertMongoMessageToFrontend(mongoMsg: MongoMessage): Message {
  // Map role: "user" | "assistant" | "system" -> sender: "user" | "assistant" | "agent"
  const senderMap: Record<string, "user" | "assistant" | "agent"> = {
    user: "user",
    assistant: "assistant",
    system: "agent",
  };

  return {
    id: mongoMsg._id,
    sender: senderMap[mongoMsg.role] || "user",
    content: mongoMsg.content,
    timestamp: mongoMsg.timestamp,
    status: "sent" as const,
  };
}

/**
 * Fetch session from MongoDB API
 */
async function fetchSession(sessionId: string): Promise<MongoSession | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch session: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.success && result.session) {
      return result.session;
    }
    return null;
  } catch (error) {
    console.error("Error fetching session:", error);
    throw error;
  }
}

/**
 * Fetch messages from MongoDB API
 */
async function fetchMessages(sessionId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/messages`);
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.success && result.messages) {
      return result.messages.map(convertMongoMessageToFrontend);
    }
    return [];
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}

/**
 * Load session from MongoDB API and save to localStorage
 */
export async function loadSessionFromMongoDB(sessionId: string): Promise<SavedChatSession | null> {
  try {
    // Fetch session and messages in parallel
    const [session, messages] = await Promise.all([
      fetchSession(sessionId),
      fetchMessages(sessionId),
    ]);

    if (!session) {
      console.warn(`Session ${sessionId} not found in MongoDB`);
      return null;
    }

    // Convert to SavedChatSession format
    const chatSession: SavedChatSession = {
      id: sessionId,
      title: session.title || "Untitled Chat",
      messages: messages,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };

    // Save to localStorage so it can be loaded by loadSession
    saveChatSession(sessionId, messages);

    return chatSession;
  } catch (error) {
    console.error("Error loading session from MongoDB:", error);
    return null;
  }
}
