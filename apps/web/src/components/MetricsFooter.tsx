import { useDataset } from "@/contexts/DatasetContext";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const decConfig = {
  approve: { label: "APPROVE", color: "text-safe", Icon: CheckCircle2 },
  reject: { label: "REJECT", color: "text-destructive", Icon: XCircle },
  conditional: { label: "CONDITIONAL", color: "text-warning", Icon: AlertTriangle },
};

export function MetricsFooter() {
  const { riskData, financialData, bankData, camData } = useDataset();

  const dscr = financialData.ratios.find((r) => r.name === "DSCR")?.fy24 ?? "—";
  const deRatio = financialData.ratios.find((r) => r.name === "Debt / Equity" || r.name === "D/E Ratio")?.fy24 ?? "—";
  const dec = decConfig[camData.recommendation.decision];
  const DecIcon = dec.Icon;

  const scoreColor =
    riskData.score >= 70 ? "text-safe" :
    riskData.score >= 50 ? "text-warning" :
    "text-destructive";

  return (
    <footer className="h-9 border-t border-border/50 bg-card backdrop-blur-sm shadow-footer flex items-center justify-between px-6 text-[10px] font-mono-numbers">
      <div className="flex items-center gap-5">
        <MetricPill label="Score" value={`${riskData.score}`} color={scoreColor} />
        <MetricPill label="DSCR" value={`${dscr}x`} color={Number(dscr) >= 1.5 ? "text-safe" : Number(dscr) >= 1.0 ? "text-warning" : "text-destructive"} />
        <MetricPill label="D/E" value={`${deRatio}x`} color={Number(deRatio) <= 1.5 ? "text-safe" : Number(deRatio) <= 2.5 ? "text-warning" : "text-destructive"} />
        <MetricPill label="ABB" value={`₹${bankData.summary.abb}L`} color="text-muted-foreground" />
        <MetricPill label="PD 12m" value={`${riskData.defaultProb12m}%`} color={riskData.defaultProb12m <= 5 ? "text-safe" : riskData.defaultProb12m <= 15 ? "text-warning" : "text-destructive"} />
      </div>
      <div className="flex items-center gap-1.5">
        <DecIcon className={`h-3 w-3 ${dec.color}`} />
        <span className={`font-display font-bold ${dec.color}`}>{dec.label}</span>
      </div>
    </footer>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/60 font-display uppercase">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
