export type AgentStatus = "idle" | "running" | "complete" | "error";

export interface AgentNode {
  id: string;
  name: string;
  shortName: string;
  icon: string; // lucide icon name
  isEngine?: boolean;
  parallel?: boolean; // rendered side-by-side
  groupId?: string;   // agents in same group render in parallel
}

export interface AgentState extends AgentNode {
  status: AgentStatus;
  duration: number; // seconds
  startDelay: number; // ms before this agent starts
}

export interface LogEntry {
  timestamp: string;
  agent: string;
  message: string;
  level: "info" | "warning" | "critical";
}

export const agentNodes: AgentNode[] = [
  { id: "doc_parse", name: "Document Parser Agent", shortName: "DocParser", icon: "FileText" },
  { id: "fin_spread", name: "Financial Spreading Agent", shortName: "FinSpread", icon: "BarChart3", groupId: "parallel1" },
  { id: "gst_verify", name: "GST Verification Agent", shortName: "GSTVerify", icon: "ShieldCheck", groupId: "parallel1" },
  { id: "gstr_engine", name: "GSTR Reconciliation Engine", shortName: "GSTRRecon", icon: "Zap", isEngine: true, groupId: "parallel2" },
  { id: "buyer_engine", name: "Buyer Concentration Engine", shortName: "BuyerConc", icon: "Zap", isEngine: true, groupId: "parallel2" },
  { id: "promoter_intel", name: "Promoter Intelligence Agent", shortName: "PromoterIntel", icon: "Users" },
  { id: "risk_score", name: "Risk Scoring Agent", shortName: "RiskScore", icon: "Target" },
  { id: "cam_gen", name: "CAM Generator Agent", shortName: "CAMGen", icon: "FileOutput" },
  { id: "counter_fact", name: "Counterfactual Agent", shortName: "CounterFact", icon: "GitBranch" },
];
