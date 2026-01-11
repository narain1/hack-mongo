import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserPlus, Copy, Link2, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";

const participants: Array<{ id: string; name: string; emoji?: string; initials?: string; color?: string }> = [];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface UserAvatarsProps {
  className?: string;
}

export function UserAvatars({ className }: UserAvatarsProps) {
  const { sessionId } = useChat();
  const navigate = useNavigate();
  const [isInvitePopoverOpen, setIsInvitePopoverOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `${window.location.origin}/chat?session=${sessionId}`;

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      // Navigate to chat page
      navigate(`/chat?session=${sessionId}`);
      setTimeout(() => {
        setLinkCopied(false);
        setIsInvitePopoverOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="flex items-center gap-4">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
          >
            <Avatar className="h-12 w-12 border border-border">
              <AvatarFallback
                className={cn(
                  "text-base font-semibold text-white",
                  participant.color || "bg-secondary/50"
                )}
              >
                {participant.emoji || participant.initials || getInitials(participant.name)}
              </AvatarFallback>
            </Avatar>
            <span>{participant.name}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <Popover.Root open={isInvitePopoverOpen} onOpenChange={setIsInvitePopoverOpen}>
            <Popover.Trigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border border-border bg-secondary/50 hover:bg-secondary/70"
                title="Invite friends"
              >
                <UserPlus className="h-5 w-5" />
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
                align="center"
                sideOffset={8}
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
          <span className="text-sm text-muted-foreground">Invite</span>
        </div>
      </div>
    </div>
  );
}

