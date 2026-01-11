import { ArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
  participants?: string[];
}

export function ChatInput({
  onSend,
  disabled = false,
  className,
  participants = ["AI"],
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  const normalizedParticipants = useMemo(() => {
    const cleaned = participants
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
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const query = mentionQuery.trim().toLowerCase();
    const alwaysFirst = "AI";
    const others = normalizedParticipants.filter(
      (name) => name.toLowerCase() !== "ai"
    );

    if (!query) return [alwaysFirst, ...others];

    const filtered = others.filter((name) =>
      name.toLowerCase().includes(query)
    );

    return [alwaysFirst, ...filtered];
  }, [mentionQuery, normalizedParticipants]);

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

  const handleInput = () => {
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

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    setIsMentionOpen(false);
    setMentionQuery("");
    setActiveIndex(0);
    if (contentEditableRef.current) {
      contentEditableRef.current.textContent = "";
    }
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
        const choice =
          filteredParticipants[activeIndex] ?? filteredParticipants[0];
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

  useEffect(() => {
    if (contentEditableRef.current && value === "") {
      contentEditableRef.current.textContent = "";
    }
  }, [value]);

  const hasText = value.trim().length > 0;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-4 py-4",
        className,
      )}
    >
      <div className="relative flex w-full items-center">
        <div
          ref={contentEditableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          className={cn(
            "h-12 flex-1 rounded-lg border border-border bg-background pr-12 text-base focus-visible:ring-2 focus-visible:ring-primary/20 outline-none px-4 py-3",
            disabled && "opacity-50 cursor-not-allowed"
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
            disabled={disabled}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
}

