import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { sendMessage } from "@/services/chatService";
import { saveChatSession, getChatSession } from "@/services/chatSessionService";
import { extractItineraryQuick, extractItineraryFull, generateRandomItinerary } from "@/services/itineraryService";
import { fetchPlacePhotos } from "@/services/placesService";
import type { Message } from "@/types/chat";
import type { TravelPlan } from "@/types/travel";

interface ChatContextValue {
  messages: Message[];
  isSending: boolean;
  sessionId: string;
  itinerary: TravelPlan | null;
  isExtractingItinerary: boolean;
  sendUserMessage: (content: string) => Promise<void>;
  extractFullItinerary: () => Promise<void>;
  generateRandomItinerary: (location: string, dates: { start?: string; end?: string }) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  resetSession: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const initialMessage: Message = {
  id: "welcome",
  sender: "assistant",
  content: "Hi! I'm your travel agent. Where would you like to go?",
  timestamp: new Date().toISOString(),
  status: "sent",
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isSending, setIsSending] = useState(false);
  const [itinerary, setItinerary] = useState<TravelPlan | null>(null);
  const [isExtractingItinerary, setIsExtractingItinerary] = useState(false);
  const hasUserMessage = useRef(false);
  const latestMessagesRef = useRef<Message[]>([initialMessage]);

  // Save session whenever messages change (debounced)
  useEffect(() => {
    latestMessagesRef.current = messages;

    if (hasUserMessage.current && messages.length > 1) {
      // Only save if there are user messages
      const timeoutId = setTimeout(() => {
        saveChatSession(sessionId, messages, itinerary || undefined);
      }, 500); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [messages, itinerary, sessionId]);

  const loadSession = useCallback(async (id: string) => {
    // Try loading from localStorage first
    let session = getChatSession(id);
    
    // If not found locally, try loading from MongoDB
    if (!session) {
      try {
        const { loadSessionFromMongoDB } = await import("@/services/mongoSessionService");
        const mongoSession = await loadSessionFromMongoDB(id);
        session = mongoSession || undefined; // Convert null to undefined
      } catch (error) {
        console.error("Error loading session from MongoDB:", error);
      }
    }
    
    if (session) {
      setSessionId(id);
      setMessages(session.messages);
      hasUserMessage.current = session.messages.some((m) => m.sender === "user");
      setItinerary(session.travelPlan ?? null);
    }
  }, []);

  const resetSession = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setMessages([initialMessage]);
    setItinerary(null);
    hasUserMessage.current = false;
  }, []);

  const runQuickItineraryExtraction = useCallback(async (history: Message[]) => {
    try {
      setIsExtractingItinerary(true);
      const plan = await extractItineraryQuick(history);
      if (plan) {
        setItinerary(plan);
        saveChatSession(sessionId, history, plan);
      }
    } catch (error) {
      console.error("Quick itinerary extraction failed", error);
    } finally {
      setIsExtractingItinerary(false);
    }
  }, [sessionId]);

  const extractFullItinerary = useCallback(async () => {
    try {
      setIsExtractingItinerary(true);
      const plan = await extractItineraryFull(latestMessagesRef.current);
      if (plan) {
        setItinerary(plan);
        saveChatSession(sessionId, latestMessagesRef.current, plan);
      }
    } catch (error) {
      console.error("Full itinerary extraction failed", error);
    } finally {
      setIsExtractingItinerary(false);
    }
  }, [sessionId]);

  const handleGenerateRandomItinerary = useCallback(async (
    location: string,
    dates: { start?: string; end?: string }
  ) => {
    if (!location.trim()) {
      console.warn("Location is required to generate random itinerary");
      return;
    }

    try {
      setIsExtractingItinerary(true);
      const plan = await generateRandomItinerary(location, dates);
      if (plan) {
        setItinerary(plan);
        saveChatSession(sessionId, latestMessagesRef.current, plan);
      }
    } catch (error) {
      console.error("Random itinerary generation failed", error);
    } finally {
      setIsExtractingItinerary(false);
    }
  }, [sessionId]);

  const sendUserMessage = useCallback(async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    // Check if message contains "@AI" trigger FIRST (case-insensitive)
    // Must check the original content before any processing
    const containsAITrigger = /@AI/i.test(trimmedContent);
    
    // If "@AI" is not present, save message but don't call LLM
    if (!containsAITrigger) {
      hasUserMessage.current = true;
      
      // Save the message as-is (no @AI to remove)
      const messageContent = trimmedContent;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        content: messageContent,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      setMessages((prev) => {
        const updated = [...prev, userMessage];
      saveChatSession(sessionId, updated, itinerary || undefined);
        return updated;
      });
      
      return; // Exit early without calling LLM
    }

    // "@AI" is present - proceed with LLM call
    hasUserMessage.current = true;
    
    // Remove "@AI" from the message content before saving/sending (case-insensitive)
    const cleanedContent = trimmedContent.replace(/@AI/gi, "").trim();
    const messageContent = cleanedContent || trimmedContent;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      // Save immediately after user message
      saveChatSession(sessionId, updated, itinerary || undefined);
      return updated;
    });

    setIsSending(true);

    try {
      // Get current messages including the new user message
      const currentMessages = [...messages, userMessage];
      
      // Send message with conversation history (using cleaned content)
      const reply = await sendMessage({ 
        message: messageContent,
        messages: currentMessages,
        sessionId 
      });
      
      let enrichedReply = reply;
      try {
        const photos = await fetchPlacePhotos(reply.content, 6);
        if (photos.length) {
          enrichedReply = { ...reply, photos };
        }
      } catch (photoError) {
        console.error("Failed to fetch place photos", photoError);
      }

      setMessages((prev) => {
        const updated = [...prev, enrichedReply];
        // Save after assistant reply
        saveChatSession(sessionId, updated, itinerary || undefined);
        return updated;
      });

      // Trigger quick itinerary extraction in the background
      runQuickItineraryExtraction([...currentMessages, enrichedReply]);
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "assistant" as const,
            content: "I ran into an issue. Please try again.",
            timestamp: new Date().toISOString(),
            status: "error" as const,
          },
        ];
        saveChatSession(sessionId, updated, itinerary || undefined);
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [sessionId, messages, itinerary]);

  const value = useMemo(
    () => ({
      messages,
      isSending,
      sessionId,
      itinerary,
      isExtractingItinerary,
      sendUserMessage,
      extractFullItinerary,
      generateRandomItinerary: handleGenerateRandomItinerary,
      loadSession,
      resetSession,
    }),
    [
      isSending,
      messages,
      sessionId,
      itinerary,
      isExtractingItinerary,
      sendUserMessage,
      extractFullItinerary,
      handleGenerateRandomItinerary,
      loadSession,
      resetSession,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}

