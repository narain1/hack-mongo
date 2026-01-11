import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

interface HomeSearchInputProps {
  className?: string;
}

export function HomeSearchInput({ className }: HomeSearchInputProps) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const { sendUserMessage } = useChat();

  const hasText = value.trim().length > 0;

  const handleSubmit = () => {
    const query = value.trim();
    if (query) {
      // Navigate to chat page and send the message
      navigate("/chat", { 
        state: { 
          initialMessage: query
        } 
      });
      // Send message after navigation
      setTimeout(() => {
        sendUserMessage(query);
      }, 100);
    } else {
      navigate("/chat");
    }
  };


  return (
    <div className="flex flex-col gap-2 w-[828px]">
      <div
        id="home-search-input"
        className={cn(
          "relative flex w-[850px] items-center gap-2 rounded-lg border border-border bg-card p-3 h-[55px] transition-all duration-500",
          className,
        )}
      >
        {/* Input Field */}
        <Input
          className="h-9 flex-1 border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
          placeholder="Or start typing to start a chat"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        {hasText && (
          <Button
            size="icon"
            className="h-8 w-8 rounded-full shrink-0"
            onClick={handleSubmit}
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

