import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/types/agent";

interface AgentStatusProps {
  agent: Agent;
}

const statusColors: Record<Agent["status"], string> = {
  idle: "bg-muted text-foreground",
  running: "bg-primary text-primary-foreground",
  success: "bg-green-500 text-white",
  error: "bg-destructive text-destructive-foreground",
};

export function AgentStatus({ agent }: AgentStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 px-3 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{agent.name}</p>
        {agent.description && (
          <p className="text-xs text-muted-foreground">{agent.description}</p>
        )}
      </div>
      <Badge className={statusColors[agent.status]}>{agent.status}</Badge>
    </div>
  );
}

