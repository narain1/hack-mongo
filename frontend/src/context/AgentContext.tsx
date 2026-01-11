import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchAgents } from "@/services/agentService";
import type { Agent } from "@/types/agent";

interface AgentContextValue {
  agents: Agent[];
  isLoading: boolean;
}

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo(() => ({ agents, isLoading }), [agents, isLoading]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgentContext must be used within an AgentProvider");
  }
  return ctx;
}

