import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/types/agent";

interface AgentSelectorProps {
  agents: Agent[];
}

export function AgentSelector({ agents }: AgentSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {agents.map((agent) => (
        <Badge key={agent.id} variant="outline">
          {agent.name}
        </Badge>
      ))}
    </div>
  );
}

