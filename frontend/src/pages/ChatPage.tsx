import { useEffect, useRef } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { ChatView } from "@/components/chat/ChatView";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadSession, resetSession } = useChat();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    const state = location.state as { sessionId?: string; initialMessage?: string } | null;
    const sessionIdFromState = state?.sessionId;
    const sessionIdFromUrl = searchParams.get("session");
    // Default session ID from MongoDB
    const DEFAULT_SESSION_ID = "6962f0870275a617b0ad2cc0";
    const sessionId = sessionIdFromState || sessionIdFromUrl || DEFAULT_SESSION_ID;
    
    if (sessionId && !hasInitialized.current) {
      loadSession(sessionId).then(() => {
        hasInitialized.current = true;
      });
    } else if (!hasInitialized.current) {
      // Reset to new session if no sessionId provided
      resetSession();
      hasInitialized.current = true;
    }
  }, [location.state, searchParams, loadSession, resetSession]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 z-30"
        onClick={() => navigate("/")}
        aria-label="Home"
      >
        <Home className="h-5 w-5" />
      </Button>
      <div className="mx-auto flex h-full w-full max-w-[1100px] flex-col px-4 py-6">
        <ChatView />
      </div>
    </div>
  );
}
