import { X, MapPin, Calendar, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  getSavedSessions,
  deleteChatSession,
  type SavedChatSession,
} from "@/services/chatSessionService";

interface PreviousChatsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function groupSessionsByDate(
  sessions: SavedChatSession[]
): Record<string, SavedChatSession[]> {
  const groups: Record<string, SavedChatSession[]> = {};
  
  sessions.forEach((session) => {
    const date = new Date(session.updatedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let groupKey: string;
    if (diffDays === 0) {
      groupKey = "Today";
    } else if (diffDays === 1) {
      groupKey = "Yesterday";
    } else if (diffDays < 7) {
      groupKey = "This Week";
    } else if (diffDays < 30) {
      groupKey = "This Month";
    } else {
      groupKey = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(session);
  });
  
  return groups;
}

export function PreviousChatsSidebar({
  isOpen,
  onClose,
}: PreviousChatsSidebarProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SavedChatSession[]>([]);

  // Refresh sessions when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setSessions(getSavedSessions());
    }
  }, [isOpen]);

  const groupedSessions = useMemo(
    () => groupSessionsByDate(sessions),
    [sessions]
  );

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      navigate("/chat", {
        state: { sessionId },
      });
      onClose();
    },
    [navigate, onClose]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      deleteChatSession(sessionId);
      // Refresh sessions list
      setSessions(getSavedSessions());
    },
    []
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-background shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Previous Trips
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No previous trips yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start planning your first trip!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Object.entries(groupedSessions).map(([dateGroup, groupSessions]) => (
                    <div key={dateGroup} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 px-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {dateGroup}
                        </h3>
                      </div>
                      <Separator />
                      <div className="flex flex-col gap-1">
                        {groupSessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => handleSessionClick(session.id)}
                            className="group relative flex flex-col gap-1 rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:bg-accent hover:border-border"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="flex-1 text-sm font-medium text-foreground line-clamp-2">
                                {session.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => handleDelete(e, session.id)}
                                aria-label="Delete chat"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {session.location && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs gap-1"
                                >
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDate(session.updatedAt)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

