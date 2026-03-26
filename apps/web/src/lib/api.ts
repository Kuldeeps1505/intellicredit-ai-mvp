import type { ApplicationProfile } from "@/lib/applicationTypes";
import type { RiskDataset } from "@/lib/riskData";
import type { PromoterDataset, NetworkEdge } from "@/lib/promoterData";
import type { DiligenceDataset } from "@/lib/diligenceData";
import type { CamDataset } from "@/lib/camData";
import type { FinancialSpreadsDataset } from "@/lib/financialSpreadsData";
import type { BankStatementDataset } from "@/lib/bankStatementData";
import type { AuditTrailDataset } from "@/lib/auditTrailData";
import type { FacilityDataset } from "@/lib/facilityData";
import type { AgentState, LogEntry } from "@/lib/agentData";

export interface ApplicationSummary extends ApplicationProfile {
  decision?: string;
  status: string;
}

export interface DocItem {
  name: string;
  status: "pending" | "uploading" | "extracted" | "error";
  size?: string;
  doc_type?: string;
}

export interface PipelineStatusResponse {
  agents: AgentState[];
  progress: number;
  logs: LogEntry[];
}

export interface CreateApplicationPayload {
  company: {
    cin: string;
    name: string;
    pan?: string;
    gstin?: string;
    sector?: string;
  };
  loan_amount_requested: number;
  purpose?: string;
}

export interface ChatReply {
  reply: string;
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** WebSocket URL for pipeline events (matches FastAPI `/ws/applications/{id}`). */
export function getApplicationWebSocketUrl(appId: string): string {
  const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
  const hostPath = API_BASE_URL.replace(/^https?:\/\//i, "");
  return `${wsProtocol}://${hostPath}/ws/applications/${appId}`;
}

export async function fetchHealth(): Promise<{ status?: string }> {
  return apiFetch<{ status?: string }>("/health");
}

export interface HumanOverride {
  id: string;
  timestamp: string;
  officer: string;
  originalRecommendation: string;
  overriddenTo: string;
  reason: string;
  approvedBy: string;
  flaggedForReview: boolean;
}

export interface AuditOverridePayload {
  originalRecommendation: string;
  overriddenTo: string;
  reason: string;
  officer?: string;
  approvedBy?: string;
}

export async function submitAuditOverride(appId: string, body: AuditOverridePayload) {
  return apiFetch<HumanOverride>(`/api/applications/${appId}/audit/override`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadCamReport(appId: string, format: "pdf" | "docx" = "pdf") {
  const url = new URL(`${API_BASE_URL}/api/applications/${appId}/cam/download`);
  url.searchParams.set("format", format);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const blob = await response.blob();
  const cd = response.headers.get("Content-Disposition");
  let filename = `cam-${appId}.${format}`;
  if (cd) {
    const match = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(cd);
    if (match) {
      filename = decodeURIComponent(match[1].replace(/"/g, ""));
    }
  }
  return { blob, filename };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function normaliseSummary(summary: {
  id: string;
  label: string;
  emoji: string;
  score?: number;
  companyName: string;
  cin: string;
  pan?: string;
  gstin?: string;
  loanAmount: string;
  purpose?: string;
  sector?: string;
  decision?: string;
  status: string;
}): ApplicationSummary {
  return {
    id: summary.id,
    label: summary.label,
    emoji: summary.emoji,
    score: summary.score ?? 0,
    companyName: summary.companyName,
    cin: summary.cin,
    pan: summary.pan ?? "",
    gstin: summary.gstin ?? "",
    loanAmount: summary.loanAmount,
    purpose: summary.purpose ?? "",
    sector: summary.sector ?? "",
    decision: summary.decision,
    status: summary.status,
  };
}

export async function fetchApplicationOptions(): Promise<ApplicationSummary[]> {
  const [applications, demoIds] = await Promise.allSettled([
    apiFetch<ApplicationSummary[]>("/api/applications"),
    apiFetch<Record<string, {
      id: string;
      label: string;
      emoji: string;
      score?: number;
      companyName?: string;
      cin?: string;
      pan?: string;
      gstin?: string;
      loanAmount?: string;
      purpose?: string;
      sector?: string;
      decision?: string;
      status?: string;
    }>>("/api/demo-ids"),
  ]);

  const byId = new Map<string, ApplicationSummary>();

  if (applications.status === "fulfilled") {
    applications.value.forEach((item) => byId.set(item.id, normaliseSummary(item)));
  }

  if (demoIds.status === "fulfilled") {
    Object.values(demoIds.value).forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, normaliseSummary({
          id: item.id,
          label: item.label,
          emoji: item.emoji,
          score: item.score,
          companyName: item.companyName ?? item.label.split("—")[0]?.trim() ?? "Demo Application",
          cin: item.cin ?? "—",
          pan: item.pan ?? "",
          gstin: item.gstin ?? "",
          loanAmount: item.loanAmount ?? "—",
          purpose: item.purpose ?? "",
          sector: item.sector ?? "",
          decision: item.decision,
          status: item.status ?? "SEEDED",
        }));
      }
    });
  }

  return Array.from(byId.values());
}

export async function fetchApplicationSummary(id: string) {
  const summary = await apiFetch<ApplicationSummary>(`/api/applications/${id}`);
  return normaliseSummary(summary);
}

export async function createApplication(payload: CreateApplicationPayload) {
  return apiFetch<{ id: string }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadApplicationDocument(appId: string, file: File, documentType: string) {
  const formData = new FormData();
  formData.append("file", file);
  const url = new URL(`${API_BASE_URL}/api/applications/${appId}/documents`);
  url.searchParams.set("documentType", documentType);
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<DocItem>;
}

export async function fetchDocuments(appId: string) {
  return apiFetch<DocItem[]>(`/api/applications/${appId}/documents`);
}

export async function startPipeline(appId: string) {
  return apiFetch<{ jobId: string; status: string }>(`/api/applications/${appId}/pipeline/start`, {
    method: "POST",
  });
}

export async function fetchPipelineStatus(appId: string) {
  return apiFetch<PipelineStatusResponse>(`/api/applications/${appId}/pipeline/status`);
}

export async function fetchRiskData(appId: string) {
  return apiFetch<RiskDataset>(`/api/applications/${appId}/risk`);
}

export async function fetchFinancialData(appId: string) {
  return apiFetch<FinancialSpreadsDataset>(`/api/applications/${appId}/financials`);
}

export async function fetchPromoterData(appId: string) {
  const result = await apiFetch<PromoterDataset & { networkEdges: Array<NetworkEdge & { source?: string; target?: string; from?: string; to?: string }> }>(
    `/api/applications/${appId}/promoter`,
  );

  return {
    ...result,
    networkEdges: result.networkEdges.map((edge) => ({
      from: edge.from ?? edge.source ?? "",
      to: edge.to ?? edge.target ?? "",
      label: edge.label,
      suspicious: edge.suspicious,
    })),
  } satisfies PromoterDataset;
}

export async function fetchBankAnalytics(appId: string) {
  return apiFetch<BankStatementDataset>(`/api/applications/${appId}/bank-analytics`);
}

export async function fetchDiligenceData(appId: string) {
  return apiFetch<DiligenceDataset>(`/api/applications/${appId}/diligence`);
}

export async function fetchAuditTrail(appId: string) {
  return apiFetch<AuditTrailDataset>(`/api/applications/${appId}/audit`);
}

export async function fetchCamData(appId: string) {
  return apiFetch<CamDataset>(`/api/applications/${appId}/cam`);
}

export async function fetchFacilityData(appId: string) {
  return apiFetch<FacilityDataset>(`/api/applications/${appId}/facilities`);
}

export async function generateCam(appId: string) {
  return apiFetch<{ status: string; app_id: string }>(`/api/applications/${appId}/cam/generate`, {
    method: "POST",
  });
}

export async function sendChatMessage(appId: string, message: string, history: Array<{ role: string; content: string }>) {
  return apiFetch<ChatReply>(`/api/applications/${appId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
