import { UserPlus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";
import { useChat } from "@/hooks/useChat";
import { fetchParticipants } from "@/services/participantService";

export function ChatContainer() {
  const { messages, isSending, sendUserMessage } = useChat();
  const { activeAgents } = useAgentOrchestration();
  const [participants, setParticipants] = useState<string[]>(["AI"]);

  const agentsLabel = useMemo(() => {
    if (!activeAgents.length) return "Ready to plan your trip.";
    return `${activeAgents.length} agent${activeAgents.length > 1 ? "s" : ""} active`;
  }, [activeAgents]);

  const normalizeParticipants = (names: string[]): string[] => {
    const cleaned = names
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name));

    const seen = new Set<string>();
    const unique = cleaned.filter((name) => {
      const lower = name.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });

    const withoutAI = unique.filter((name) => name.toLowerCase() !== "ai");
    return ["AI", ...withoutAI];
  };

  useEffect(() => {
    let isMounted = true;

    const loadParticipants = async () => {
      const serverNames = await fetchParticipants();
      const normalized = normalizeParticipants(serverNames);
      if (isMounted) {
        setParticipants(normalized.length ? normalized : ["AI"]);
      }
    };

    loadParticipants();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <Card className="flex h-full flex-col overflow-hidden border border-border/80 bg-card/50 shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-card/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Travel Chat</h2>
              <p className="text-xs text-muted-foreground">{agentsLabel}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm text-muted-foreground hover:text-foreground"
            aria-label="Invite friends"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>

        {/* Messages Area */}
        <div className="relative flex-1 overflow-hidden">
          <MessageList messages={messages} />
          {isSending && <TypingIndicator />}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm">
          <ChatInput
            onSend={sendUserMessage}
            disabled={isSending}
            participants={participants}
          />
        </div>
      </Card>
    </div>
  );
}

