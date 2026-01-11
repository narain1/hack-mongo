import type { Message } from "@/types/chat";
import { extractFlightsPayload, FLIGHT_MARKER } from "@/lib/flightParser";

export interface SendMessagePayload {
  message: string;
  messages?: Message[]; // Conversation history
  sessionId?: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Get API key and determine which provider to use
 */
export function getApiKey(): { apiKey: string; isOpenAI: boolean } {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:15',message:'getApiKey entry - checking env var',data:{openRouterKeyExists:!!import.meta.env.VITE_OPENROUTER_API_KEY,openRouterKeyLength:import.meta.env.VITE_OPENROUTER_API_KEY?.length||0,openAIKeyExists:!!import.meta.env.VITE_OPENAI_API_KEY,allEnvKeys:Object.keys(import.meta.env).filter(k=>k.includes('API')||k.includes('KEY'))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // Determine which key to use and if it's an OpenAI key
  // If VITE_OPENROUTER_API_KEY is set, check if it looks like an OpenAI key (starts with sk-)
  // If it's an OpenAI key format, treat it as OpenAI
  let apiKey: string | undefined;
  let isOpenAI = false;
  
  if (openRouterKey) {
    // Check if the OpenRouter key is actually an OpenAI key (starts with sk-)
    if (openRouterKey.startsWith('sk-proj-') || openRouterKey.startsWith('sk-')) {
      apiKey = openRouterKey;
      isOpenAI = true;
    } else {
      apiKey = openRouterKey;
      isOpenAI = false;
    }
  } else if (openAIKey) {
    apiKey = openAIKey;
    isOpenAI = true;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:17',message:'getApiKey - apiKey value check',data:{apiKeyExists:!!apiKey,apiKeyPrefix:apiKey?.substring(0,8)||'undefined',apiKeyLength:apiKey?.length||0,isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!apiKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:19',message:'getApiKey - API key not found error',data:{error:'API key is undefined or empty'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(
      "API key not found. Please set VITE_OPENROUTER_API_KEY (or VITE_OPENAI_API_KEY) in your .env file"
    );
  }
  
  return { apiKey, isOpenAI };
}

/**
 * Convert our Message format to OpenAI format
 */
function messagesToOpenAIFormat(messages: Message[]) {
  return messages
    .filter((msg) => msg.sender !== "agent") // Filter out agent messages for now
    .map((msg) => {
      if (msg.sender === "user") {
        return {
          role: "user" as const,
          content: msg.content,
        };
      } else {
        return {
          role: "assistant" as const,
          content: msg.content,
        };
      }
    });
}

export async function sendMessage(
  payload: SendMessagePayload,
): Promise<Message> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:48',message:'sendMessage entry',data:{hasPayload:!!payload,messageLength:payload.message?.length||0,messagesCount:payload.messages?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Validate API key before making request
  let apiKeyInfo: { apiKey: string; isOpenAI: boolean };
  try {
    apiKeyInfo = getApiKey();
  } catch (error) {
    // Return error message if API key is not configured
    return {
      id: crypto.randomUUID(),
      sender: "assistant",
      content: error instanceof Error 
        ? error.message 
        : "API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file.",
      timestamp: new Date().toISOString(),
      status: "error",
    };
  }
  
  const { apiKey, isOpenAI } = apiKeyInfo;
  const apiUrl = isOpenAI ? OPENAI_API_URL : OPENROUTER_API_URL;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:50',message:'sendMessage - API key retrieved',data:{apiKeyPrefix:apiKey.substring(0,8),apiKeyLength:apiKey.length,apiUrl:apiUrl,isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  const conversationHistory = payload.messages || [];
  
  // Convert messages to OpenAI format
  const openAIMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> =
    messagesToOpenAIFormat(conversationHistory);
  
  // Always include system message to ensure flight tracking instructions are present
  const hasSystemMessage = openAIMessages.some(msg => msg.role === "system");
  if (!hasSystemMessage) {
    openAIMessages.unshift({
      role: "system",
      content:
        `You are a helpful travel agent assistant. Help users plan their trips by providing travel recommendations, itinerary suggestions, and answering travel-related questions. Be friendly, informative, and concise.

IMPORTANT - Flight Tracking: When the user asks about flights, flight options, flight bookings, or provides flight information (even booking confirmations), you MUST include the hidden marker ${FLIGHT_MARKER} followed by a JSON code block with flight data.

Format: ${FLIGHT_MARKER}
\`\`\`json
{
  "flights": [
    {
      "id": "unique-id",
      "from": "origin city/airport",
      "to": "destination city/airport",
      "departure": "ISO datetime (e.g., 2024-01-15T10:30:00)",
      "arrival": "ISO datetime (e.g., 2024-01-15T14:45:00)",
      "airline": "Airline name (optional)",
      "number": "Flight number like AA123 (optional)",
      "confirmation": "Booking confirmation code (optional)",
      "cost": {"amount": 500, "currency": "USD"} (optional),
      "notes": "Additional details (optional)"
    }
  ]
}
\`\`\`

Always provide a normal human-readable reply along with the marker and JSON. Include the marker even for single flights or booking confirmations.`,
    });
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:66',message:'sendMessage - before API request',data:{url:apiUrl,model:isOpenAI?'gpt-3.5-turbo':'openai/gpt-3.5-turbo',messagesCount:openAIMessages.length,isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
    
    // Add OpenRouter-specific headers only if using OpenRouter (not OpenAI)
    if (!isOpenAI) {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Travel Chat";
    }
    
    // Use different model format for OpenAI vs OpenRouter
    const model = isOpenAI ? "gpt-3.5-turbo" : "openai/gpt-3.5-turbo";
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000, // Increased to ensure flight data JSON isn't cut off
      }),
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:80',message:'sendMessage - API response received',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries()),isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      let errorMessage = `API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        // Handle different error response formats from OpenRouter
        if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Provide more helpful error messages for common issues
        if (errorMessage.includes('cookie auth credentials') || errorMessage.includes('authentication') || response.status === 401) {
          errorMessage = 'API key is missing or invalid. Please check your VITE_OPENROUTER_API_KEY environment variable.';
        }
      } catch (e) {
        // If JSON parsing fails, use the status text
        if (response.status === 401) {
          errorMessage = 'API key is missing or invalid. Please check your VITE_OPENROUTER_API_KEY environment variable.';
        }
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:84',message:'sendMessage - API error response',data:{status:response.status,statusText:response.statusText,errorMessage:errorMessage,isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from API");
    }

    const { cleanContent, flights } = extractFlightsPayload(assistantMessage);

    return {
      id: crypto.randomUUID(),
      sender: "assistant",
      content: cleanContent,
      timestamp: new Date().toISOString(),
      status: "sent",
      flights: flights.length ? flights : undefined,
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a5743db6-fadc-4a94-af51-e934cee37118',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'chatService.ts:102',message:'sendMessage - catch block',data:{errorType:error?.constructor?.name,errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,isOpenAI:isOpenAI},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.error("Failed to send message", error);
    
    // Return error message
    return {
      id: crypto.randomUUID(),
      sender: "assistant",
      content:
        error instanceof Error
          ? `I encountered an error: ${error.message}. Please check your API key and try again.`
          : "I ran into an issue. Please try again.",
      timestamp: new Date().toISOString(),
      status: "error",
    };
  }
}

/**
 * Call the chat model and force JSON output for structured data.
 */
export async function callStructuredChat(params: {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { messages, systemPrompt, temperature = 0.3, maxTokens = 800 } = params;
  const { apiKey, isOpenAI } = getApiKey();
  const apiUrl = isOpenAI ? OPENAI_API_URL : OPENROUTER_API_URL;

  const openAIMessages = [
    { role: "system", content: systemPrompt },
    ...messagesToOpenAIFormat(messages),
  ];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (!isOpenAI) {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "Travel Chat Structured";
  }

  const model = isOpenAI ? "gpt-3.5-turbo" : "openai/gpt-3.5-turbo";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: openAIMessages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Structured chat call failed: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No structured content returned by model");
  }

  return content;
}

export async function generateSuggestions(messages: Message[]): Promise<string[]> {
  const recent = messages.slice(-3);
  const systemPrompt =
    "Given the last few chat messages, return a JSON object with a `suggestions` array of up to 3 short, helpful replies (max 12 words each). You must consider who sent the last message (user vs assistant) and respond appropriately. If context is too thin or unclear, return an empty array. If \"you\" is the last message sender, return a follow-up suggestion for the user. if its not you, return a suggestion to respond to the last message. No prose, just JSON.";
  try {
    const raw = await callStructuredChat({
      messages: recent,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 120,
    });
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.suggestions)) {
      return parsed.suggestions.filter((s: unknown) => typeof s === "string" && s.trim()).slice(0, 4);
    }
  } catch (error) {
    console.error("generateSuggestions failed", error);
  }
  return [];
}

