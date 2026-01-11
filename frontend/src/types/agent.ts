export type AgentStatusType = "idle" | "running" | "success" | "error";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatusType;
  description?: string;
}

