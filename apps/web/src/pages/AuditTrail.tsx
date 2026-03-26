import { useState } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ClipboardList, Bot, User, Monitor, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Clock, Shield, ShieldAlert, ShieldX,
  FileEdit, Eye, Zap,
} from "lucide-react";

const actorTypeConfig = {
  ai_agent: { icon: Bot, color: "text-primary", bg: "bg-primary/10", label: "AI" },
  human: { icon: User, color: "text-warning", bg: "bg-warning/10", label: "Human" },
  system: { icon: Monitor, color: "text-muted-foreground", bg: "bg-secondary", label: "System" },
};

const actionTypeConfig: Record<string, { color: string }> = {
  data_extraction: { color: "bg-info/20 text-info border-info/30" },
  analysis: { color: "bg-primary/20 text-primary border-primary/30" },
  decision: { color: "bg-safe/20 text-safe border-safe/30" },
  override: { color: "bg-warning/20 text-warning border-warning/30" },
  modification: { color: "bg-warning/20 text-warning border-warning/30" },
  initiation: { color: "bg-muted text-muted-foreground border-border" },
  verification: { color: "bg-safe/20 text-safe border-safe/30" },
};

const workflowStatusConfig = {
  completed: { icon: CheckCircle2, color: "text-safe", bg: "bg-safe" },
  in_progress: { icon: Clock, color: "text-info", bg: "bg-info" },
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted-foreground" },
  blocked: { icon: XCircle, color: "text-destructive", bg: "bg-destructive" },
};

const complianceConfig = {
  compliant: { icon: CheckCircle2, color: "text-safe", bg: "bg-safe/15 border-safe/30" },
  partial: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15 border-warning/30" },
  non_compliant: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15 border-destructive/30" },
};

const AuditTrail = () => {
  const { auditData: data, camData, submitAuditOverrideRecord } = useDataset();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    originalRecommendation: "",
    overriddenTo: "",
    reason: "",
    officer: "Credit Officer",
    approvedBy: "Branch Manager",
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const decisionLabel =
    camData.recommendation.decision === "approve"
      ? "APPROVE"
      : camData.recommendation.decision === "reject"
        ? "REJECT"
        : "CONDITIONAL";

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="space-y-4 pr-2 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardList className="h-5 w-5 text-primary shrink-0" />
            <h2 className="text-lg font-display text-foreground truncate">Audit Trail & Decision Log</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-xs font-display border-primary/30">
                  Record override
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Human override</DialogTitle>
                  <DialogDescription>
                    Submits to the API and appears under Human Overrides after refresh.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Original (AI) recommendation</Label>
                    <Input
                      value={overrideForm.originalRecommendation}
                      onChange={(e) => setOverrideForm((p) => ({ ...p, originalRecommendation: e.target.value }))}
                      placeholder={decisionLabel}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Overridden to</Label>
                    <Input
                      value={overrideForm.overriddenTo}
                      onChange={(e) => setOverrideForm((p) => ({ ...p, overriddenTo: e.target.value }))}
                      placeholder="e.g. CONDITIONAL"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      value={overrideForm.reason}
                      onChange={(e) => setOverrideForm((p) => ({ ...p, reason: e.target.value }))}
                      placeholder="Documented rationale"
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Officer</Label>
                      <Input
                        value={overrideForm.officer}
                        onChange={(e) => setOverrideForm((p) => ({ ...p, officer: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Approved by</Label>
                      <Input
                        value={overrideForm.approvedBy}
                        onChange={(e) => setOverrideForm((p) => ({ ...p, approvedBy: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    disabled={overrideSubmitting || !overrideForm.reason.trim() || !overrideForm.overriddenTo.trim()}
                    onClick={() => {
                      setOverrideSubmitting(true);
                      const orig =
                        overrideForm.originalRecommendation.trim() ||
                        `${decisionLabel} — ${camData.recommendation.summary.slice(0, 120)}`;
                      void submitAuditOverrideRecord({
                        originalRecommendation: orig,
                        overriddenTo: overrideForm.overriddenTo.trim(),
                        reason: overrideForm.reason.trim(),
                        officer: overrideForm.officer.trim() || undefined,
                        approvedBy: overrideForm.approvedBy.trim() || undefined,
                      })
                        .then(() => {
                          toast.success("Override recorded");
                          setOverrideOpen(false);
                          setOverrideForm((p) => ({ ...p, reason: "", overriddenTo: "" }));
                        })
                        .catch(() => toast.error("Override failed — check API connection"))
                        .finally(() => setOverrideSubmitting(false));
                    }}
                  >
                    {overrideSubmitting ? "Submitting…" : "Submit override"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Badge className="bg-secondary text-muted-foreground border-border text-xs">
              {data.events.length} Events
            </Badge>
            {data.overrides.length > 0 && (
              <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                <FileEdit className="h-3 w-3 mr-1" />
                {data.overrides.length} Override{data.overrides.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Approval Workflow Pipeline */}
        <Card data-tour="audit-workflow" className="p-4 overflow-hidden">
          <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">Approval Workflow</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {data.workflow.map((stage, i) => {
              const cfg = workflowStatusConfig[stage.status];
              const StageIcon = cfg.icon;
              return (
                <div key={stage.stage} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className={`flex-shrink-0 p-2.5 rounded-lg border ${
                      stage.status === "completed" ? "border-safe/30 bg-safe/10" :
                      stage.status === "in_progress" ? "border-info/30 bg-info/10" :
                      stage.status === "blocked" ? "border-destructive/30 bg-destructive/10" :
                      "border-border bg-secondary/30"
                    }`}
                    style={{ minWidth: 120 }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <StageIcon className={`h-3 w-3 ${cfg.color}`} />
                      <span className="text-xs font-display font-medium text-foreground truncate">{stage.stage}</span>
                    </div>
                    {stage.actor && (
                      <p className="text-[9px] text-muted-foreground truncate">{stage.actor}</p>
                    )}
                    {stage.timestamp && (
                      <p className="text-[9px] font-mono-numbers text-muted-foreground/60">{stage.timestamp.split(" ")[1]}</p>
                    )}
                    {stage.notes && (
                      <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{stage.notes}</p>
                    )}
                  </motion.div>
                  {i < data.workflow.length - 1 && (
                    <ArrowRight className={`h-3 w-3 mx-1 flex-shrink-0 ${
                      stage.status === "completed" ? "text-safe" : "text-border"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Human Overrides */}
        {data.overrides.length > 0 && (
          <Card data-tour="audit-overrides" className="p-4 border-warning/30 bg-warning/10">
            <div className="flex items-center gap-2 mb-3">
              <FileEdit className="h-4 w-4 text-warning" />
              <h3 className="text-xs font-display text-warning uppercase tracking-wider">
                Human Overrides ({data.overrides.length})
              </h3>
            </div>
            <div className="space-y-3">
              {data.overrides.map((ovr, i) => (
                <motion.div
                  key={ovr.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-lg border border-warning/20 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-display text-foreground font-medium">{ovr.officer}</span>
                    <span className="text-[10px] font-mono-numbers text-muted-foreground">{ovr.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-secondary/30 rounded p-2">
                      <p className="text-[9px] text-muted-foreground uppercase">Original</p>
                      <p className="text-xs text-foreground font-body">{ovr.originalRecommendation}</p>
                    </div>
                    <div className="bg-warning/10 rounded p-2">
                      <p className="text-[9px] text-warning uppercase">Overridden To</p>
                      <p className="text-xs text-foreground font-body">{ovr.overriddenTo}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-body"><strong>Reason:</strong> {ovr.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Approved by: {ovr.approvedBy}</p>
                  {ovr.flaggedForReview && (
                    <Badge className="mt-1 bg-destructive/20 text-destructive border-destructive/30 text-[9px]">
                      Flagged for Senior Review
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Event Timeline */}
        <Card data-tour="audit-timeline" className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider">Decision Timeline</h3>
          </div>
          <div className="space-y-0 relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
            {data.events.map((event, i) => {
              const actorCfg = actorTypeConfig[event.actorType];
              const ActorIcon = actorCfg.icon;
              const actionCfg = actionTypeConfig[event.actionType] || actionTypeConfig.initiation;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative pl-10 pb-4"
                >
                  <div className={`absolute left-[6px] top-1 h-[18px] w-[18px] rounded-full flex items-center justify-center ${actorCfg.bg} border border-border`}>
                    <ActorIcon className={`h-2.5 w-2.5 ${actorCfg.color}`} />
                  </div>
                  <div className="bg-secondary/20 rounded-lg border border-border/50 p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono-numbers text-muted-foreground">{event.timestamp}</span>
                      <Badge className={`text-[8px] px-1 py-0 ${actionCfg.color}`}>
                        {event.actionType.replace("_", " ").toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] font-display text-muted-foreground">{event.module}</span>
                      {event.confidence && (
                        <span className="text-[9px] font-mono-numbers text-primary ml-auto">{event.confidence}% conf</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-display text-foreground font-medium">{event.actor}</span>
                      <Badge className={`text-[8px] px-1 py-0 ${actorCfg.bg} ${actorCfg.color} border-transparent`}>
                        {actorCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs font-body text-foreground">{event.description}</p>
                    {event.details && (
                      <p className="text-xs font-body text-muted-foreground mt-1">{event.details}</p>
                    )}
                    {event.previousValue && event.newValue && (
                      <div className="mt-1.5 flex gap-2 text-[10px]">
                        <span className="text-muted-foreground line-through">{event.previousValue}</span>
                        <ArrowRight className="h-3 w-3 text-warning" />
                        <span className="text-warning font-medium">{event.newValue}</span>
                      </div>
                    )}
                    {event.dataSources && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {event.dataSources.map((src) => (
                          <span key={src} className="text-[8px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{src}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Compliance Badges */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider">Regulatory Compliance</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {data.compliance.map((item, i) => {
              const cfg = complianceConfig[item.status];
              const CompIcon = cfg.icon;
              return (
                <motion.div
                  key={item.regulation}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`p-3 rounded-lg border ${cfg.bg}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CompIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="text-xs font-display text-foreground font-medium">{item.regulation}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-body">{item.details}</p>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default AuditTrail;
