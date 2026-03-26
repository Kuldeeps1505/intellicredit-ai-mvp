import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApplication,
  fetchApplicationOptions,
  fetchApplicationSummary,
  fetchAuditTrail,
  fetchBankAnalytics,
  fetchCamData,
  fetchDiligenceData,
  fetchDocuments,
  fetchFacilityData,
  fetchFinancialData,
  fetchHealth,
  fetchPipelineStatus,
  fetchPromoterData,
  fetchRiskData,
  generateCam,
  getApplicationWebSocketUrl,
  sendChatMessage,
  startPipeline,
  submitAuditOverride,
  uploadApplicationDocument,
  type ApplicationSummary,
  type AuditOverridePayload,
  type CreateApplicationPayload,
  type DocItem,
  type PipelineStatusResponse,
} from "@/lib/api";
import {
  emptyApplication,
  emptyAuditData,
  emptyBankData,
  emptyCamData,
  emptyDiligenceData,
  emptyFacilityData,
  emptyFinancialData,
  emptyPipelineStatus,
  emptyPromoterData,
  emptyRiskData,
} from "@/lib/emptyData";

interface DatasetContextValue {
  activeDataset: string;
  setActiveDataset: (id: string) => void;
  dataset: ApplicationSummary;
  applications: ApplicationSummary[];
  documents: DocItem[];
  riskData: typeof emptyRiskData;
  promoterData: typeof emptyPromoterData;
  diligenceData: typeof emptyDiligenceData;
  camData: typeof emptyCamData;
  financialData: typeof emptyFinancialData;
  bankData: typeof emptyBankData;
  auditData: typeof emptyAuditData;
  facilityData: typeof emptyFacilityData;
  pipelineStatus: PipelineStatusResponse;
  isLoading: boolean;
  apiConnected: boolean;
  apiHealthChecking: boolean;
  applicationsQueryError: boolean;
  startPipelineRun: () => Promise<unknown>;
  refreshPipelineStatus: () => Promise<unknown>;
  createApplicationRecord: (payload: CreateApplicationPayload) => Promise<{ id: string }>;
  uploadDocument: (file: File, documentType: string) => Promise<DocItem>;
  generateCamReport: () => Promise<unknown>;
  submitAuditOverrideRecord: (payload: AuditOverridePayload) => Promise<unknown>;
  sendChat: (message: string, history: Array<{ role: string; content: string }>) => Promise<string>;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [activeDataset, setActiveDataset] = useState("");

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 20_000,
    retry: 2,
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplicationOptions,
    refetchInterval: 10_000,  // poll every 10s so new apps appear automatically
  });

  useEffect(() => {
    if (!activeDataset && applicationsQuery.data?.length) {
      setActiveDataset(applicationsQuery.data[0].id);
    }
  }, [activeDataset, applicationsQuery.data]);

  const applicationQuery = useQuery({
    queryKey: ["application", activeDataset],
    queryFn: () => fetchApplicationSummary(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents", activeDataset],
    queryFn: () => fetchDocuments(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const riskQuery = useQuery({
    queryKey: ["risk", activeDataset],
    queryFn: () => fetchRiskData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const promoterQuery = useQuery({
    queryKey: ["promoter", activeDataset],
    queryFn: () => fetchPromoterData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const diligenceQuery = useQuery({
    queryKey: ["diligence", activeDataset],
    queryFn: () => fetchDiligenceData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const camQuery = useQuery({
    queryKey: ["cam", activeDataset],
    queryFn: () => fetchCamData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const financialQuery = useQuery({
    queryKey: ["financials", activeDataset],
    queryFn: () => fetchFinancialData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const bankQuery = useQuery({
    queryKey: ["bank", activeDataset],
    queryFn: () => fetchBankAnalytics(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const auditQuery = useQuery({
    queryKey: ["audit", activeDataset],
    queryFn: () => fetchAuditTrail(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const facilityQuery = useQuery({
    queryKey: ["facilities", activeDataset],
    queryFn: () => fetchFacilityData(activeDataset),
    enabled: Boolean(activeDataset),
  });

  const pipelineQuery = useQuery({
    queryKey: ["pipeline", activeDataset],
    queryFn: () => fetchPipelineStatus(activeDataset),
    enabled: Boolean(activeDataset),
    refetchInterval: (query) => {
      const status = query.state.data;
      const stillRunning = status?.agents.some((agent) => agent.status === "running");
      return stillRunning ? 2000 : 5000; // keep polling every 5s even when idle
    },
  });

  // When pipeline transitions to complete, invalidate all page data
  const prevProgressRef = React.useRef(0);
  React.useEffect(() => {
    const progress = pipelineQuery.data?.progress ?? 0;
    const wasRunning = prevProgressRef.current > 0 && prevProgressRef.current < 100;
    const nowComplete = progress === 100;
    if (wasRunning && nowComplete) {
      void queryClient.invalidateQueries({ queryKey: ["risk", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["financials", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["cam", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["promoter", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["bank", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["diligence", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["audit", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["facilities", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["application", activeDataset] });
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
    prevProgressRef.current = progress;
  }, [pipelineQuery.data?.progress, activeDataset, queryClient]);

  useEffect(() => {
    if (!activeDataset || typeof WebSocket === "undefined") return;
    const url = getApplicationWebSocketUrl(activeDataset);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    let t: ReturnType<typeof setTimeout> | undefined;
    ws.onmessage = (event) => {
      if (t) clearTimeout(t);
      const invalidateAll = () => {
        void queryClient.invalidateQueries({ queryKey: ["pipeline", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["risk", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["financials", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["cam", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["promoter", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["bank", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["diligence", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["audit", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["facilities", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["application", activeDataset] });
        void queryClient.invalidateQueries({ queryKey: ["applications"] });
      };
      t = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["pipeline", activeDataset] });
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.event_type === "complete" || msg?.result === "success" || msg?.result === "error") {
            invalidateAll();
          }
        } catch { /* ignore */ }
      }, 400);
    };
    return () => {
      if (t) clearTimeout(t);
      ws.close();
    };
  }, [activeDataset, queryClient]);

  const startPipelineMutation = useMutation({
    mutationFn: () => startPipeline(activeDataset),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pipeline", activeDataset] });
      await queryClient.invalidateQueries({ queryKey: ["application", activeDataset] });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      setActiveDataset(result.id);
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) =>
      uploadApplicationDocument(activeDataset, file, documentType),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["documents", activeDataset] });
    },
  });

  const generateCamMutation = useMutation({
    mutationFn: () => generateCam(activeDataset),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cam", activeDataset] }),
        queryClient.invalidateQueries({ queryKey: ["pipeline", activeDataset] }),
      ]);
    },
  });

  const auditOverrideMutation = useMutation({
    mutationFn: (payload: AuditOverridePayload) => submitAuditOverride(activeDataset, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["audit", activeDataset] });
    },
  });

  const value = useMemo<DatasetContextValue>(() => ({
    activeDataset,
    setActiveDataset,
    dataset: applicationQuery.data ?? applicationsQuery.data?.find((application) => application.id === activeDataset) ?? emptyApplication,
    applications: applicationsQuery.data ?? [],
    documents: documentsQuery.data ?? [],
    riskData: riskQuery.data ?? emptyRiskData,
    promoterData: promoterQuery.data ?? emptyPromoterData,
    diligenceData: diligenceQuery.data ?? emptyDiligenceData,
    camData: camQuery.data ?? emptyCamData,
    financialData: financialQuery.data ?? emptyFinancialData,
    bankData: bankQuery.data ?? emptyBankData,
    auditData: auditQuery.data ?? emptyAuditData,
    facilityData: facilityQuery.data ?? emptyFacilityData,
    pipelineStatus: pipelineQuery.data ?? emptyPipelineStatus,
    isLoading: [
      applicationsQuery.isLoading,
      applicationQuery.isLoading,
      documentsQuery.isLoading,
      riskQuery.isLoading,
      promoterQuery.isLoading,
      diligenceQuery.isLoading,
      camQuery.isLoading,
      financialQuery.isLoading,
      bankQuery.isLoading,
      auditQuery.isLoading,
      facilityQuery.isLoading,
    ].some(Boolean),
    apiConnected: healthQuery.isSuccess && healthQuery.data?.status === "ok",
    apiHealthChecking: healthQuery.isPending && !healthQuery.data,
    applicationsQueryError: applicationsQuery.isError,
    startPipelineRun: () => startPipelineMutation.mutateAsync(),
    refreshPipelineStatus: () => queryClient.invalidateQueries({ queryKey: ["pipeline", activeDataset] }),
    createApplicationRecord: (payload) => createApplicationMutation.mutateAsync(payload),
    uploadDocument: (file, documentType) => uploadDocumentMutation.mutateAsync({ file, documentType }),
    generateCamReport: () => generateCamMutation.mutateAsync(),
    submitAuditOverrideRecord: (payload) => auditOverrideMutation.mutateAsync(payload),
    sendChat: async (message, history) => {
      const response = await sendChatMessage(activeDataset, message, history);
      return response.reply;
    },
  }), [
    activeDataset,
    applicationQuery.data,
    applicationsQuery.data,
    applicationsQuery.isError,
    applicationsQuery.isLoading,
    applicationQuery.isLoading,
    auditOverrideMutation,
    auditQuery.data,
    auditQuery.isLoading,
    bankQuery.data,
    bankQuery.isLoading,
    camQuery.data,
    camQuery.isLoading,
    createApplicationMutation,
    diligenceQuery.data,
    diligenceQuery.isLoading,
    documentsQuery.data,
    documentsQuery.isLoading,
    facilityQuery.data,
    facilityQuery.isLoading,
    financialQuery.data,
    financialQuery.isLoading,
    generateCamMutation,
    healthQuery.data,
    healthQuery.isPending,
    healthQuery.isSuccess,
    pipelineQuery.data,
    promoterQuery.data,
    promoterQuery.isLoading,
    queryClient,
    riskQuery.data,
    riskQuery.isLoading,
    startPipelineMutation,
    uploadDocumentMutation,
  ]);

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
};

export const useDataset = () => {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
};
