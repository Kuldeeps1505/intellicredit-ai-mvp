import type { ApplicationSummary, PipelineStatusResponse } from "@/lib/api";
import type { RiskDataset } from "@/lib/riskData";
import type { PromoterDataset } from "@/lib/promoterData";
import type { DiligenceDataset } from "@/lib/diligenceData";
import type { CamDataset } from "@/lib/camData";
import type { FinancialSpreadsDataset } from "@/lib/financialSpreadsData";
import type { BankStatementDataset } from "@/lib/bankStatementData";
import type { AuditTrailDataset } from "@/lib/auditTrailData";
import type { FacilityDataset } from "@/lib/facilityData";

export const emptyApplication: ApplicationSummary = {
  id: "",
  label: "No application selected",
  emoji: "•",
  score: 0,
  companyName: "Loading application",
  cin: "—",
  pan: "",
  gstin: "",
  loanAmount: "0",
  purpose: "",
  sector: "",
  status: "idle",
};

export const emptyRiskData: RiskDataset = {
  score: 0,
  riskCategory: "PENDING",
  defaultProb12m: 0,
  defaultProb24m: 0,
  fiveCs: [],
  gstrReconciliation: [],
  suspectITC: "₹0",
  buyerConcentration: [],
  topThreeConcentration: 0,
  financialRatios: [],
  riskFlags: [],
};

export const emptyPromoterData: PromoterDataset = {
  directors: [],
  networkNodes: [],
  networkEdges: [],
  litigation: [],
  news: [],
  overallPromoterRisk: "low",
  mca21Flags: [],
};

export const emptyDiligenceData: DiligenceDataset = {
  checks: [],
  fieldVisits: [],
  compliance: [],
  completionPercent: 0,
  overallStatus: "concerns",
};

export const emptyCamData: CamDataset = {
  generatedAt: "Pending",
  sections: [],
  recommendation: {
    decision: "conditional",
    summary: "CAM data will appear after backend generation completes.",
    conditions: [],
    loanTerms: {
      amount: "—",
      tenure: "—",
      rate: "—",
      security: "—",
      disbursement: "—",
    },
  },
  counterfactuals: [],
  keyMetrics: [],
};

export const emptyFinancialData: FinancialSpreadsDataset = {
  pnl: [],
  balanceSheet: [],
  cashFlow: [],
  ratios: [],
};

export const emptyBankData: BankStatementDataset = {
  summary: {
    abb: 0,
    avgMonthlyCredits: 0,
    avgMonthlyDebits: 0,
    creditDebitRatio: 0,
    emiObligations: 0,
    emiCount: 0,
    bounceRatio: 0,
    totalBounces: 0,
    cashWithdrawalPercent: 0,
    behaviorScore: 0,
  },
  monthlyCashFlow: [],
  creditCategories: [],
  debitCategories: [],
  redFlags: [],
  topCounterparties: [],
};

export const emptyAuditData: AuditTrailDataset = {
  events: [],
  overrides: [],
  workflow: [],
  compliance: [],
};

export const emptyFacilityData: FacilityDataset = {
  existingFacilities: [],
  proposedFacilities: [],
  totalExistingFundBased: "₹0.00 Cr",
  totalExistingNonFundBased: "₹0.00 Cr",
  totalProposedFundBased: "₹0.00 Cr",
  totalProposedNonFundBased: "₹0.00 Cr",
  workingCapital: {
    currentAssets: [],
    currentLiabilities: [],
    netWorkingCapital: { fy22: 0, fy23: 0, fy24: 0, projected: 0 },
    mpbf: { method: "Pending", amount: "₹0.00 Cr", details: "Pending" },
    drawingPower: "Pending",
    assessedBankFinance: "Pending",
  },
  sensitivityAnalysis: [],
};

export const emptyPipelineStatus: PipelineStatusResponse = {
  agents: [],
  progress: 0,
  logs: [],
};
