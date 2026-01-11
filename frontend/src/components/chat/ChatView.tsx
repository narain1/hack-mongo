import { ArrowUp, Sparkles, UserPlus, MapPin, Calendar, Copy, Link2, Check, Route, DollarSign, MessageSquare, Plus, Ticket } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";
import type { Message } from "@/types/chat";
import { LocationSearch } from "@/components/travel/LocationSearch";
import * as Popover from "@radix-ui/react-popover";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import { SplitsView } from "@/components/splits/SplitsView";
import { AddExpenseDialog } from "@/components/splits/AddExpenseDialog";
import { useSplits } from "@/hooks/useSplits";
import { FlightCardsGrid } from "@/components/flights/FlightCardsGrid";
import { TicketsView } from "@/components/tickets/TicketsView";
import { useTickets } from "@/hooks/useTickets";
import { generateSuggestions } from "@/services/chatService";
import { fetchParticipants } from "@/services/participantService";
import "react-day-picker/dist/style.css";

function getAvatarColor(name: string): string {
  // Use gray shades for monochrome design
  const colors = [
    "bg-muted",
    "bg-secondary",
    "bg-muted-foreground/20",
    "bg-secondary/80",
    "bg-muted-foreground/30",
    "bg-muted-foreground/40",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// Helper function to parse date string in local timezone (avoids UTC conversion issues)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";
  const senderName = isUser ? "You" : message.agentName ?? "TravelAgent";
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
            "max-w-[840px] w-[294px] min-w-[394px] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
            {
              "bg-background text-foreground border border-border": isUser,
              "bg-background text-foreground border border-primary": !isUser,
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
          {!isUser && message.photos && message.photos.length > 0 && (
            <div className="mt-3 -mx-2">
              <div className="flex gap-2 overflow-x-auto pb-2 px-2">
                {message.photos.map((photoUrl, idx) => (
                  <div
                    key={photoUrl + idx}
                    className="h-28 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <img
                      src={photoUrl}
                      alt="Place photo"
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-6 pb-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <div className="h-3 w-3 rounded-full bg-primary/60" />
      </div>
      <div className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  );
}

export function ChatView() {
  const {
    messages,
    isSending,
    sendUserMessage,
    sessionId,
    itinerary,
    extractFullItinerary,
  } = useChat();
  const { activeAgents } = useAgentOrchestration();
  const [value, setValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<{ start?: string; end?: string }>({});
  const [isAnimating, setIsAnimating] = useState(true);
  const [showChatUI, setShowChatUI] = useState(false);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isInvitePopoverOpen, setIsInvitePopoverOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "itinerary" | "splits" | "tickets">("chat");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    selectedDates?.start || selectedDates?.end
      ? {
          from: selectedDates.start ? parseLocalDate(selectedDates.start) : undefined,
          to: selectedDates.end ? parseLocalDate(selectedDates.end) : undefined,
        }
      : undefined
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const initialMessageSent = useRef(false);
  const hasTriggeredFullItinerary = useRef(false);
  const { expenses, settlements, balances, addExpense, removeExpense } = useSplits();
  const tickets = useTickets(messages);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionTimeout = useRef<number | undefined>(undefined);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [serverParticipants, setServerParticipants] = useState<string[]>(["AI"]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadParticipants = async () => {
      const names = await fetchParticipants();
      if (isMounted) {
        setServerParticipants(names.length ? names : ["AI"]);
      }
    };
    loadParticipants();
    return () => {
      isMounted = false;
    };
  }, []);

  const participants = useMemo(() => {
    const rawList = itinerary?.participants ?? [];
    const excluded = new Set(["ai", "assistant", "travel agent", "travelagent", "agent", "bot"]);

    const cleaned = rawList
      .filter(Boolean)
      .map((p) => p.trim())
      .filter((p) => p && !excluded.has(p.toLowerCase()));

    if (cleaned.length) {
      // Remove duplicates while preserving order
      const seen = new Set<string>();
      const fromItinerary = cleaned.filter((name) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const fromServer = serverParticipants
        .map((name) => name?.trim())
        .filter((name): name is string => Boolean(name));

      const merged = [...fromServer, ...fromItinerary];
      const mergedSeen = new Set<string>();
      const uniqueMerged = merged.filter((name) => {
        const key = name.toLowerCase();
        if (mergedSeen.has(key)) return false;
        mergedSeen.add(key);
        return true;
      });

      const withoutAI = uniqueMerged.filter((name) => name.toLowerCase() !== "ai");
      return ["AI", ...withoutAI];
    }

    const fromServer = serverParticipants
      .map((name) => name?.trim())
      .filter((name): name is string => Boolean(name));

    const fallback = fromServer.length ? fromServer : ["AI"];
    const seen = new Set<string>();
    const unique = fallback.filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const withoutAI = unique.filter((name) => name.toLowerCase() !== "ai");
    return ["AI", ...withoutAI];
  }, [itinerary, serverParticipants]);

  const filteredParticipants = useMemo(() => {
    const query = mentionQuery.trim().toLowerCase();
    const alwaysFirst = "AI";
    const others = participants.filter((name) => name.toLowerCase() !== "ai");

    if (!query) return [alwaysFirst, ...others];

    const filtered = others.filter((name) => name.toLowerCase().includes(query));
    return [alwaysFirst, ...filtered];
  }, [mentionQuery, participants]);

  // Sync selectedRange with selectedDates prop
  useEffect(() => {
    if (selectedDates?.start || selectedDates?.end) {
      setSelectedRange({
        from: selectedDates.start ? parseLocalDate(selectedDates.start) : undefined,
        to: selectedDates.end ? parseLocalDate(selectedDates.end) : undefined,
      });
    } else {
      setSelectedRange(undefined);
    }
  }, [selectedDates]);

  const handleDateSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
    if (range?.from && range?.to) {
      // Both dates selected
      setSelectedDates({
        start: format(range.from, "yyyy-MM-dd"),
        end: format(range.to, "yyyy-MM-dd"),
      });
      setIsDatePopoverOpen(false);
    } else if (range?.from) {
      // Only start date selected
      setSelectedDates({
        start: format(range.from, "yyyy-MM-dd"),
        end: undefined,
      });
    } else {
      // No dates selected
      setSelectedDates({ start: undefined, end: undefined });
    }
  };

  const formatText = (text: string): string => {
    if (!text) return "";
    // Escape HTML first, then replace @mentions with styled spans
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/(@[^\s]+)/g, '<span class="text-primary font-medium">$1</span>');
  };

  const getCaretPosition = (element: HTMLElement): number | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const preRange = range.cloneRange();
    preRange.selectNodeContents(element);
    preRange.setEnd(range.endContainer, range.endOffset);
    return preRange.toString().length;
  };

  const setCaretPosition = (element: HTMLElement, position: number) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = document.createRange();
    let current = 0;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();

    while (node) {
      const textLength = node.textContent?.length ?? 0;
      if (current + textLength >= position) {
        const offset = position - current;
        range.setStart(node, offset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      current += textLength;
      node = walker.nextNode();
    }

    // Fallback: place cursor at end
    if (element.lastChild) {
      range.selectNodeContents(element.lastChild);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const applyFormattedContent = (text: string, caretPos?: number | null) => {
    if (!contentEditableRef.current) return;
    const targetCaret = caretPos ?? getCaretPosition(contentEditableRef.current) ?? text.length;
    contentEditableRef.current.innerHTML = formatText(text);
    setCaretPosition(contentEditableRef.current, Math.min(targetCaret, text.length));
  };

  const findActiveMention = (text: string, caretPos: number) => {
    const upToCaret = text.slice(0, caretPos);
    const match = upToCaret.match(/(?:^|\s)(@([^\s@]*))$/);
    if (!match) return null;
    const query = match[2] ?? "";
    const matchStart = (match.index ?? 0) + match[0].indexOf("@");
    return { query, start: matchStart };
  };

  const insertMention = (name: string) => {
    if (!contentEditableRef.current) return;
    const text = contentEditableRef.current.textContent || "";
    const caretPos = getCaretPosition(contentEditableRef.current) ?? text.length;
    const mention = findActiveMention(text, caretPos);

    if (!mention) return;

    const before = text.slice(0, mention.start);
    const after = text.slice(caretPos);
    const mentionText = `@${name} `;
    const nextValue = `${before}${mentionText}${after}`;

    setValue(nextValue);
    setIsMentionOpen(false);
    setMentionQuery("");
    setActiveIndex(0);
    applyFormattedContent(nextValue, before.length + mentionText.length);
  };

  const handleInputChange = () => {
    if (!contentEditableRef.current) return;
    const text = contentEditableRef.current.textContent || "";
    const caretPos = getCaretPosition(contentEditableRef.current) ?? text.length;
    setValue(text);
    applyFormattedContent(text, caretPos);

    const mention = findActiveMention(text, caretPos);
    if (mention) {
      setIsMentionOpen(true);
      setMentionQuery(mention.query);
      setActiveIndex(0);
    } else {
      setIsMentionOpen(false);
      setMentionQuery("");
      setActiveIndex(0);
    }
  };

  const agentsLabel = useMemo(() => {
    if (!activeAgents.length) return "Ready to plan your trip.";
    return `${activeAgents.length} agent${activeAgents.length > 1 ? "s" : ""} active`;
  }, [activeAgents]);

  useEffect(() => {
    // Send initial message if provided via navigation state
    const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;
    if (initialMessage && !initialMessageSent.current && messages.length === 1) {
      initialMessageSent.current = true;
      setTimeout(() => {
        sendUserMessage(initialMessage);
      }, 100);
    }
  }, [location.state, sendUserMessage, messages.length]);

  useEffect(() => {
    // Start morphing animation - input morphs first, then UI appears
    const morphTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Input morph duration

    const uiTimer = setTimeout(() => {
      setShowChatUI(true);
    }, 900); // UI appears after morph

    return () => {
      clearTimeout(morphTimer);
      clearTimeout(uiTimer);
    };
  }, []);

  useEffect(() => {
    if (showChatUI) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSending, showChatUI]);

  // Trigger a full itinerary extraction the first time the Itinerary tab is opened
  useEffect(() => {
    if (activeTab === "itinerary" && !hasTriggeredFullItinerary.current) {
      hasTriggeredFullItinerary.current = true;
      extractFullItinerary();
    }
  }, [activeTab, extractFullItinerary]);

  useEffect(() => {
    if (contentEditableRef.current && value === "") {
      contentEditableRef.current.textContent = "";
    }
  }, [value]);

  useEffect(() => {
    if (suggestionTimeout.current) {
      window.clearTimeout(suggestionTimeout.current);
    }
    if (isSending || value.trim() || messages.length < 2) {
      setSuggestions([]);
      return;
    }
    suggestionTimeout.current = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      const ideas = await generateSuggestions(messages.slice(-3));
      setSuggestions(ideas);
      setIsLoadingSuggestions(false);
    }, 300);
    return () => {
      if (suggestionTimeout.current) {
        window.clearTimeout(suggestionTimeout.current);
      }
    };
  }, [messages, isSending, value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    // Build message with location and dates context if selected
    let message = trimmed;
    const contextParts: string[] = [];
    
    if (selectedLocation && selectedLocation.trim()) {
      contextParts.push(`Location: ${selectedLocation}`);
    }
    
    if (selectedDates.start && selectedDates.end) {
      contextParts.push(`Dates: ${selectedDates.start} to ${selectedDates.end}`);
    } else if (selectedDates.start) {
      contextParts.push(`Start Date: ${selectedDates.start}`);
    }
    
    if (contextParts.length > 0) {
      message = `${trimmed}\n\n[${contextParts.join(", ")}]`;
    }
    
    sendUserMessage(message);
    setValue("");
    setIsMentionOpen(false);
    setMentionQuery("");
    setActiveIndex(0);
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isMentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % Math.max(filteredParticipants.length, 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev === 0 ? Math.max(filteredParticipants.length - 1, 0) : prev - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const choice = filteredParticipants[activeIndex] ?? filteredParticipants[0];
        if (choice) {
          insertMention(choice);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsMentionOpen(false);
        setMentionQuery("");
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = value.trim().length > 0;

  // Format date range for display
  const formatDateRangeDisplay = () => {
    if (!selectedRange?.from) return null;
    
    if (selectedRange.from && selectedRange.to) {
      return `${format(selectedRange.from, "MMM d")} - ${format(selectedRange.to, "MMM d")}`;
    }
    return format(selectedRange.from, "MMM d");
  };

  const dateRangeDisplay = formatDateRangeDisplay();

  // Generate share link and copy to clipboard
  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => {
        setLinkCopied(false);
        setIsInvitePopoverOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;

  return (
    <div className="flex h-full flex-col bg-background" style={{ background: 'unset' }}>
      <Card 
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden bg-card transition-opacity duration-500 border-0",
          isAnimating ? "opacity-0" : "opacity-100"
        )}
        style={{ background: 'unset' }}
      >
        {/* Header Section - No borders */}
        <div className="flex items-center justify-between px-6 py-4" style={{ background: 'unset', borderBottom: 'none' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Travel Chat</h2>
              <p className="text-xs text-muted-foreground">{agentsLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Location Icon */}
            <Popover.Root open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-2 text-sm text-muted-foreground hover:text-foreground",
                    selectedLocation && "text-primary"
                  )}
                  aria-label="Select location"
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  {selectedLocation && (
                    <span className="max-w-[120px] truncate hidden sm:inline">
                      {selectedLocation}
                    </span>
                  )}
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className={cn(
                    "z-50 w-[222px] rounded-lg border bg-popover p-4 text-popover-foreground",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                    "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "mt-2 border-border bg-card"
                  )}
                  align="end"
                  sideOffset={4}
                >
                  <LocationSearch
                    value={selectedLocation}
                    onChange={(location) => {
                      setSelectedLocation(location);
                      if (location) {
                        setIsLocationPopoverOpen(false);
                      }
                    }}
                    placeholder="Select location"
                    inputClassName="h-9 border-border bg-background text-sm"
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {/* Date Icon */}
            <Popover.Root open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 gap-2 text-sm text-muted-foreground hover:text-foreground",
                    (selectedDates.start || selectedDates.end) && "text-primary"
                  )}
                  aria-label="Select dates"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  {dateRangeDisplay && (
                    <span className="max-w-[120px] truncate hidden sm:inline">
                      {dateRangeDisplay}
                    </span>
                  )}
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className={cn(
                    "z-50 min-w-[var(--radix-popover-trigger-width)] max-w-[600px] rounded-lg border bg-popover p-4 text-popover-foreground",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                    "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "mt-2 border-border bg-card"
                  )}
                  align="end"
                  sideOffset={4}
                >
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={1}
                    disabled={{ before: new Date() }}
                    className="rdp"
                    classNames={{
                      months: "flex flex-col sm:flex-row gap-4",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        "inline-flex items-center justify-center rounded-md",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has([aria-selected].rdp-range_middle)]:rounded-none focus-within:relative focus-within:z-20",
                      day: cn(
                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground",
                        "rounded-md transition-colors",
                        "[&.rdp-range_middle]:rounded-none"
                      ),
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
                      day_hidden: "invisible",
                    }}
                  />
                  <div className="flex gap-2 pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedRange(undefined);
                        setSelectedDates({ start: undefined, end: undefined });
                        setIsDatePopoverOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setIsDatePopoverOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <Popover.Root open={isInvitePopoverOpen} onOpenChange={setIsInvitePopoverOpen}>
              <Popover.Trigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Invite friends"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Invite</span>
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className={cn(
                    "z-50 w-[320px] rounded-lg border bg-popover p-4 text-popover-foreground",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
                    "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    "mt-2 border-border bg-card"
                  )}
                  align="end"
                  sideOffset={4}
                >
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Invite friends</h3>
                      <p className="text-xs text-muted-foreground">
                        Share this link to invite others to join your travel planning session.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-transparent text-xs text-foreground outline-none truncate"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={handleCopyShareLink}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Link copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy link
                        </>
                      )}
                    </Button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <div className="flex items-center justify-center gap-1 px-6">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
                activeTab === "chat"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("chat")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
                activeTab === "itinerary"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("itinerary")}
            >
              <Route className="h-4 w-4 mr-2" />
              Itinerary
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
                activeTab === "splits"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("splits")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Splits
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
                activeTab === "tickets"
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("tickets")}
            >
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </Button>
          </div>
        </div>

        {/* Content Area - Conditionally rendered based on active tab */}
        {activeTab === "chat" && (
          <>
            {/* Messages Area - Initially hidden, fades in after morph */}
            <div 
              className={cn(
                "relative flex min-h-0 flex-1 overflow-hidden transition-opacity duration-500",
                showChatUI ? "opacity-100" : "opacity-0"
              )}
            >
              {showChatUI && (
                <ScrollArea className="h-full w-full flex-1" hideScrollbar>
                  <div className="flex flex-col gap-4 px-6 py-6">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isSending && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area - Morphs from home position to chat position */}
            {!hasText && !isSending && (isLoadingSuggestions || suggestions.length > 0) && (
              <div className="px-6 pb-2">
                <div
                  className="flex gap-2 overflow-x-auto pb-1 flex-nowrap items-center [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                  {isLoadingSuggestions && (
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  )}
                  {!isLoadingSuggestions &&
                    suggestions.map((suggestion, idx) => (
                      <Button
                        key={`${suggestion}-${idx}`}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 whitespace-nowrap"
                        onClick={() => sendUserMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                </div>
              </div>
            )}
            <div 
              id="chat-input-container"
              className={cn(
                "transition-all duration-500 ease-in-out",
                isAnimating && "absolute bottom-0 left-0 right-0"
              )}
            >
              <div 
                ref={inputRef}
                className={cn(
                  "relative flex items-center gap-3 px-4 pb-4 transition-all duration-500 ease-in-out",
                  isAnimating ? "w-[700px] mx-auto" : "w-full",
                  showChatUI ? "pt-2" : "pt-4"
                )}
              >
                <div className="relative flex w-full items-center">
                  <div
                    ref={contentEditableRef}
                    contentEditable={!isSending}
                    suppressContentEditableWarning
                    onInput={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    className={cn(
                      "h-12 flex-1 rounded-lg border border-border bg-background pr-12 text-base text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-500 outline-none px-4 py-3",
                      isSending && "opacity-50 cursor-not-allowed"
                    )}
                    style={{
                      minHeight: "48px",
                    }}
                  />
                  {!hasText && !isInputFocused && (
                    <div
                      className="absolute left-4 top-3 pointer-events-none text-muted-foreground text-base select-none"
                    >
                      Ask me to plan your next trip...
                    </div>
                  )}
                  {isMentionOpen && (
                    <div className="absolute bottom-14 left-0 z-20 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover w-fit">
                      {filteredParticipants.length ? (
                        filteredParticipants.map((name, idx) => (
                          <button
                            key={name}
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-2 px-4 py-2 pr-4 text-left text-sm hover:bg-muted/70",
                              idx === activeIndex && "bg-muted/90"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertMention(name);
                            }}
                            onMouseEnter={() => setActiveIndex(idx)}
                          >
                            <span className="font-medium text-foreground">@{name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 pr-4 text-sm text-muted-foreground">
                          No matches
                        </div>
                      )}
                    </div>
                  )}
                  {hasText && (
                    <Button
                      size="icon"
                      className="absolute right-2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                      onClick={handleSend}
                      disabled={isSending}
                      aria-label="Send message"
                    >
                      <ArrowUp className="h-4 w-4 text-white" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "itinerary" && (
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <ItineraryView 
              selectedLocation={selectedLocation}
              selectedDates={selectedDates}
            />
          </div>
        )}

        {activeTab === "splits" && (
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="flex-1" hideScrollbar>
              <div className="flex flex-col gap-4 px-6 py-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Expense splits</p>
                    <p className="text-sm text-muted-foreground">
                      Add expenses and see the simplest way to settle up.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsAddExpenseOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add expense
                    </Button>
                  </div>
                </div>

                <SplitsView
                  expenses={expenses}
                  settlements={settlements}
                  participants={participants}
                  balances={balances}
                  onDeleteExpense={removeExpense}
                />
              </div>
            </ScrollArea>
            <AddExpenseDialog
              open={isAddExpenseOpen}
              onOpenChange={setIsAddExpenseOpen}
              participants={participants}
              onAdd={addExpense}
            />
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <TicketsView tickets={tickets} />
          </div>
        )}
      </Card>
    </div>
  );
}

export default ChatView;
