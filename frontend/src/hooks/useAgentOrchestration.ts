import { useMemo } from "react";

import { useAgentContext } from "@/context/AgentContext";

export function useAgentOrchestration() {
  const { agents, isLoading } = useAgentContext();

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.status === "running"),
    [agents],
  );

  return { agents, activeAgents, isLoading };
}

