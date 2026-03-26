import { useState, useMemo, useCallback } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { downloadCamReport } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Target, TrendingUp, Clock, Zap, Download, Eye, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCamPdf, generateCamPdfBlobUrl } from "@/lib/generateCamPdf";
import { RiskGauge } from "@/components/risk/RiskGauge";

const decisionConfig = {
  approve: { icon: CheckCircle2, color: "text-safe", bg: "bg-safe/15 border-safe/30", label: "APPROVED" },
  reject: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15 border-destructive/30", label: "REJECTED" },
  conditional: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15 border-warning/30", label: "CONDITIONAL" },
};

const difficultyConfig = {
  easy: { color: "text-safe", bg: "bg-safe/15" },
  medium: { color: "text-warning", bg: "bg-warning/15" },
  hard: { color: "text-destructive", bg: "bg-destructive/15" },
};

const CamReport = () => {
  const {
    activeDataset,
    dataset,
    camData: data,
    riskData,
    promoterData,
    financialData,
    bankData,
    diligenceData,
    facilityData,
    generateCamReport,
  } = useDataset();
  const dec = decisionConfig[data.recommendation.decision];
  const DecIcon = dec.icon;

  // Interactive counterfactual state
  const [enabledActions, setEnabledActions] = useState<Set<number>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  const getPdfData = () => ({
    camData: data,
    dataset,
    riskData,
    promoterData,
    financialData,
    bankData,
    diligenceData,
    facilityData,
  });

  const handlePreview = () => {
    const url = generateCamPdfBlobUrl(getPdfData());
    setPreviewUrl(url);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const toggleAction = (idx: number) => {
    setEnabledActions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const simulatedScore = useMemo(() => {
    const base = riskData.score;
    let bonus = 0;
    enabledActions.forEach((idx) => {
      const cf = data.counterfactuals[idx];
      if (cf) bonus += cf.scoreImpact;
    });
    return Math.min(100, base + bonus);
  }, [enabledActions, riskData.score, data.counterfactuals]);

  const maxPossibleScore = useMemo(() => {
    return Math.min(100, riskData.score + data.counterfactuals.reduce((sum, cf) => sum + cf.scoreImpact, 0));
  }, [riskData.score, data.counterfactuals]);

  const scoreChanged = enabledActions.size > 0;

  const handleExportPdf = useCallback(async () => {
    if (!activeDataset) return;
    setExportBusy(true);
    const pdfPayload = {
      camData: data,
      dataset,
      riskData,
      promoterData,
      financialData,
      bankData,
      diligenceData,
      facilityData,
    };
    try {
      try {
        const { blob, filename } = await downloadCamReport(activeDataset, "pdf");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Downloaded CAM from server");
      } catch {
        await generateCamReport();
        generateCamPdf(pdfPayload);
        toast.message("Server export unavailable; generated PDF in browser");
      }
    } finally {
      setExportBusy(false);
    }
  }, [
    activeDataset,
    data,
    dataset,
    riskData,
    promoterData,
    financialData,
    bankData,
    diligenceData,
    facilityData,
    generateCamReport,
  ]);

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-4 pr-2 max-w-full">
        {/* Title + Decision Banner */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-display text-foreground">Credit Appraisal Memorandum</h2>
              <p className="text-[10px] text-muted-foreground font-mono-numbers">Generated: {data.generatedAt}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-display border-primary/30 text-primary hover:bg-primary/10"
              onClick={handlePreview}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-display border-primary/30 text-primary hover:bg-primary/10"
              disabled={exportBusy}
              onClick={() => { void handleExportPdf(); }}
            >
              <Download className="h-3.5 w-3.5" />
              {exportBusy ? "Exporting…" : "Export PDF"}
            </Button>
            </div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 rounded-lg border ${dec.bg} w-fit`}
            >
              <DecIcon className={`h-5 w-5 ${dec.color}`} />
              <span className={`text-sm font-display font-bold ${dec.color}`}>{dec.label}</span>
            </motion.div>
          </div>
        </div>

        {/* Key Metrics + Mini Gauge */}
        <div data-tour="cam-metrics" className="grid grid-cols-1 md:grid-cols-[1fr_minmax(0,200px)] gap-4">
          <Card className="p-4">
            <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-3">Key Metrics Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {data.keyMetrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-secondary/30 rounded-lg px-3 py-2.5"
                >
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  <p className={`text-sm font-mono-numbers font-bold ${
                    m.status === "good" ? "text-safe" : m.status === "warning" ? "text-warning" : "text-destructive"
                  }`}>
                    {m.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
          <Card className="p-3 flex items-center justify-center">
            <RiskGauge
              score={riskData.score}
              category={riskData.riskCategory}
              defaultProb12m={riskData.defaultProb12m}
              defaultProb24m={riskData.defaultProb24m}
            />
          </Card>
        </div>

        {/* CAM Sections */}
        <Card data-tour="cam-sections" className="p-5">
          <div className="space-y-5">
            {data.sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <h4 className="text-xs font-display text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {section.title}
                </h4>
                <p className="text-xs text-muted-foreground font-body leading-relaxed pl-7">
                  {section.content}
                </p>
                {i < data.sections.length - 1 && <Separator className="mt-4" />}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Recommendation + Loan Terms */}
        <div data-tour="cam-recommendation" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={`p-4 border ${dec.bg.split(" ").pop()}`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider">
                Recommendation
              </h3>
            </div>
            <p className="text-xs text-foreground font-body leading-relaxed mb-4">{data.recommendation.summary}</p>
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">
                {data.recommendation.decision === "reject" ? "Required Actions" : "Conditions"}
              </p>
              {data.recommendation.conditions.map((cond, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                  <span>{cond}</span>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-3">Proposed Terms</h3>
            {Object.entries(data.recommendation.loanTerms).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-[10px] text-muted-foreground font-display capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={`text-xs font-mono-numbers ${value === "NOT APPLICABLE" ? "text-destructive" : "text-foreground"}`}>
                  {value}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* Path to Approval — Interactive Simulator */}
        {data.counterfactuals.length > 0 && (
          <Card data-tour="cam-simulator" className="p-5 border-primary/20">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-display text-primary uppercase tracking-wider font-bold">
                Path to Approval — Interactive Simulator
              </h3>
              <Badge className="text-[9px] bg-primary/20 text-primary border-primary/30 px-1.5 py-0">
                AI Counterfactual Engine
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
              {/* Left: Toggle Cards */}
              <div className="space-y-2.5">
                <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-1">
                  Toggle actions to simulate score changes
                </p>
                {data.counterfactuals.map((cf, i) => {
                  const diff = difficultyConfig[cf.difficulty];
                  const isOn = enabledActions.has(i);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
                        isOn
                          ? "border-primary/50 bg-primary/10 shadow-md shadow-primary/10"
                          : "border-border bg-secondary/20 hover:border-border/80"
                      }`}
                      onClick={() => toggleAction(i)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <Switch
                            checked={isOn}
                            onCheckedChange={() => toggleAction(i)}
                            className="data-[state=checked]:bg-primary"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-body font-medium ${isOn ? "text-foreground" : "text-muted-foreground"}`}>
                            {cf.action}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{cf.impact}</p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-center">
                            <p className="text-[8px] text-muted-foreground">Impact</p>
                            <p className={`text-sm font-mono-numbers font-bold ${isOn ? "text-safe" : "text-muted-foreground"}`}>
                              +{cf.scoreImpact}
                            </p>
                          </div>
                          <div className="text-center">
                            <Badge className={`text-[7px] px-1.5 py-0 ${diff.bg} ${diff.color} border-transparent`}>
                              {cf.difficulty.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[9px] font-mono-numbers text-muted-foreground">{cf.timeframe}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right: Animated Score Gauge */}
              <div className="flex flex-col items-center justify-center">
                <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider mb-4">
                  Simulated Score
                </p>

                {/* Circular gauge */}
                <div className="relative w-36 h-36 mb-3">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="2.5"
                    />
                    {/* Base score arc */}
                    <motion.circle
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 - riskData.score }}
                      animate={{ strokeDashoffset: 100 - riskData.score }}
                      opacity={0.3}
                    />
                    {/* Simulated score arc */}
                    <motion.circle
                      cx="18" cy="18" r="15.9155"
                      fill="none"
                      stroke={
                        simulatedScore >= 75 ? "hsl(var(--safe))" :
                        simulatedScore >= 60 ? "hsl(var(--warning))" :
                        "hsl(var(--destructive))"
                      }
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="100"
                      initial={{ strokeDashoffset: 100 - riskData.score }}
                      animate={{ strokeDashoffset: 100 - simulatedScore }}
                      transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    />
                  </svg>
                  {/* Center number */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={simulatedScore}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-3xl font-mono-numbers font-bold ${
                        simulatedScore >= 75 ? "text-safe" : simulatedScore >= 60 ? "text-warning" : "text-destructive"
                      }`}
                    >
                      {simulatedScore}
                    </motion.span>
                    <span className="text-[9px] text-muted-foreground font-display">/ 100</span>
                  </div>
                </div>

                {/* Score delta */}
                <AnimatePresence mode="wait">
                  {scoreChanged && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-1.5 mb-2"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-safe" />
                      <span className="text-sm font-mono-numbers font-bold text-safe">
                        +{simulatedScore - riskData.score}
                      </span>
                      <span className="text-[9px] text-muted-foreground">points</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Category label */}
                <motion.div
                  key={simulatedScore >= 75 ? "low" : simulatedScore >= 50 ? "med" : "high"}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`px-3 py-1 rounded-full text-[10px] font-display font-bold ${
                    simulatedScore >= 75
                      ? "bg-safe/15 text-safe border border-safe/30"
                      : simulatedScore >= 50
                      ? "bg-warning/15 text-warning border border-warning/30"
                      : "bg-destructive/15 text-destructive border border-destructive/30"
                  }`}
                >
                  {simulatedScore >= 75 ? "APPROVAL ZONE" : simulatedScore >= 60 ? "CONDITIONAL" : "HIGH RISK"}
                </motion.div>

                {/* Progress toward max */}
                <div className="w-full mt-4 px-2">
                  <div className="flex justify-between text-[8px] text-muted-foreground font-mono-numbers mb-1">
                    <span>Current: {riskData.score}</span>
                    <span>Max: {maxPossibleScore}</span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        simulatedScore >= 75 ? "bg-safe" : simulatedScore >= 60 ? "bg-warning" : "bg-destructive"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${((simulatedScore - riskData.score) / Math.max(1, maxPossibleScore - riskData.score)) * 100}%`,
                      }}
                      transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground text-center mt-1">
                    {enabledActions.size} of {data.counterfactuals.length} actions selected
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* PDF Preview Overlay */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-[min(100vw-1rem,90vw)] h-[min(100dvh-2rem,90vh)] max-w-5xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col mx-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-display text-foreground">CAM Report Preview</span>
                  <span className="text-[10px] text-muted-foreground font-mono-numbers">— {dataset.companyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-display border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => { generateCamPdf(getPdfData()); }}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={closePreview}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* PDF iframe */}
              <iframe
                src={previewUrl}
                className="flex-1 w-full bg-muted"
                title="CAM Report Preview"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScrollArea>
  );
};

export default CamReport;
