import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { FlightCardsGrid } from "@/components/flights/FlightCardsGrid";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const isAgent = message.sender === "agent";
  const senderName = isUser
    ? "You"
    : isAgent
      ? message.agentName ?? "Agent"
      : "TravelAgent";

  const flights = message.flights ?? [];
  const hasFlights = !isUser && flights.length > 0;

  return (
    <div
      className={cn("flex w-full gap-3", {
        "flex-row-reverse": isUser,
        "flex-row": !isUser,
      })}
    >
      <Avatar className="h-8 w-8 shrink-0 border border-border/50">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold text-white",
            isUser ? "bg-primary" : getAvatarColor(senderName)
          )}
        >
          {isUser ? "Y" : senderName[0]}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn("flex flex-col gap-1", {
          "items-end": isUser,
          "items-start": !isUser,
        })}
      >
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-medium text-foreground">{senderName}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            {
              "bg-background text-foreground": isUser,
              "bg-background text-foreground border-2 border-primary": !isUser,
            }
          )}
        >
          <div className="max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="rounded-lg max-w-full h-auto my-2 cursor-pointer"
                    onClick={() => src && window.open(src, "_blank")}
                  />
                ),
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          {hasFlights && (
            <div className="mt-3">
              <FlightCardsGrid flights={flights} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

