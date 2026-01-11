import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentOrchestration } from "@/hooks/useAgentOrchestration";
import { AgentStatus } from "./AgentStatus";
import { AgentSelector } from "./AgentSelector";

export function OrchestrationPanel() {
  const { agents, activeAgents } = useAgentOrchestration();

  return (
    <Card className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardTitle className="text-base">Agent Orchestration</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitoring {activeAgents.length} active agents
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <AgentSelector agents={agents} />
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <AgentStatus key={agent.id} agent={agent} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

