export type ApplicationId = string;

export type AgentRunStatus = "queued" | "running" | "completed" | "failed";

export interface AgentRunEvent {
  applicationId: ApplicationId;
  runId: string;
  status: AgentRunStatus;
  step: string;
  timestamp: string;
}
