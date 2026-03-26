import { useState, useEffect, useRef, useCallback } from "react";
import { useDataset } from "@/contexts/DatasetContext";
import { agentNodes, AgentStatus, LogEntry } from "@/lib/agentData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BarChart3, ShieldCheck, Zap, Users, Target, FileOutput, GitBranch,
  Play, RotateCcw, CheckCircle2, XCircle, Loader2
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  FileText, BarChart3, ShieldCheck, Zap, Users, Target, FileOutput, GitBranch,
};

type NodeStatus = Record<string, { status: AgentStatus; elapsed: number }>;

const AgentProgress = () => {
  const { activeDataset, pipelineStatus, startPipelineRun, refreshPipelineStatus } = useDataset();

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [nodeStates, setNodeStates] = useState<NodeStatus>({});
  const [visibleLogs, setVisibleLogs] = useState<LogEntry[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [riskToasts, setRiskToasts] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetPipeline();
  }, [activeDataset]);

  useEffect(() => {
    const nextNodeStates: NodeStatus = {};
    pipelineStatus.agents.forEach((agent) => {
      nextNodeStates[agent.id] = { status: agent.status, elapsed: agent.duration };
    });
    setNodeStates(nextNodeStates);
    setVisibleLogs(pipelineStatus.logs);
    setOverallProgress(pipelineStatus.progress);
    setRunning(pipelineStatus.agents.some((agent) => agent.status === "running"));
    setFinished(Boolean(pipelineStatus.agents.length) && pipelineStatus.progress >= 100);
    setRiskToasts(pipelineStatus.logs.filter((log) => log.level === "critical").slice(-3));
  }, [pipelineStatus]);

  const resetPipeline = () => {
    setRunning(false);
    setFinished(false);
    setNodeStates({});
    setVisibleLogs([]);
    setOverallProgress(0);
    setRiskToasts([]);
  };

  const startPipeline = useCallback(() => {
    resetPipeline();
    setRunning(true);
    void startPipelineRun().then(() => refreshPipelineStatus());
  }, [refreshPipelineStatus, startPipelineRun]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLogs]);

  // Group agents for parallel rendering
  const renderGroups: { ids: string[]; parallel: boolean }[] = [
    { ids: ["doc_parse"], parallel: false },
    { ids: ["fin_spread", "gst_verify"], parallel: true },
    { ids: ["gstr_engine", "buyer_engine"], parallel: true },
    { ids: ["promoter_intel"], parallel: false },
    { ids: ["risk_score"], parallel: false },
    { ids: ["cam_gen"], parallel: false },
    { ids: ["counter_fact"], parallel: false },
  ];

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "running": return "bg-info";
      case "complete": return "bg-safe";
      case "error": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-info" />;
      case "complete": return <CheckCircle2 className="h-4 w-4 text-safe" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "critical": return "text-destructive";
      case "warning": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  const getAgentLogColor = (agent: string) => {
    const map: Record<string, string> = {
      DocParser: "text-foreground",
      FinSpread: "text-info",
      GSTVerify: "text-safe",
      GSTRRecon: "text-warning",
      BuyerConc: "text-caution",
      PromoterIntel: "text-primary",
      RiskScore: "text-destructive",
      CAMGen: "text-foreground",
      CounterFact: "text-info",
    };
    return map[agent] || "text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Top progress bar */}
      <div data-tour="agent-progress" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-display text-muted-foreground uppercase tracking-wider">
            Pipeline Progress
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-mono-numbers text-sm text-foreground">
              {Math.round(overallProgress)}%
            </span>
            {!running && !finished && (
              <Button size="sm" onClick={startPipeline} className="gap-1.5">
                <Play className="h-3.5 w-3.5" /> Run Pipeline
              </Button>
            )}
            {finished && (
              <Button size="sm" variant="outline" onClick={startPipeline} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Re-run
              </Button>
            )}
          </div>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-4 min-h-0 lg:h-[calc(100vh-220px)]">
        {/* Left — Agent Pipeline Graph */}
        <Card data-tour="agent-pipeline" className="p-4 overflow-y-auto max-h-[55vh] lg:max-h-none">
          <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider mb-4">
            Agent Pipeline
          </h3>
          <div className="space-y-0">
            {renderGroups.map((group, gi) => (
              <div key={gi}>
                {/* Connector line from previous group */}
                {gi > 0 && (
                  <div className="flex justify-center py-1">
                    <div className={`w-px h-5 ${
                      nodeStates[group.ids[0]]?.status === "complete" || nodeStates[group.ids[0]]?.status === "running"
                        ? "bg-primary"
                        : "bg-border border-dashed"
                    }`} />
                  </div>
                )}

                {/* Branch connector for parallel groups */}
                {group.parallel && (
                  <div className="flex justify-center py-0.5">
                    <div className="w-32 h-px bg-border" />
                  </div>
                )}

                <div className={`flex ${group.parallel ? "gap-2 justify-center" : "justify-center"}`}>
                  {group.ids.map((id) => {
                    const node = agentNodes.find((n) => n.id === id)!;
                    const state = nodeStates[id] || { status: "idle" as AgentStatus, elapsed: 0 };
                    const IconComp = iconMap[node.icon] || FileText;

                    return (
                      <motion.div
                        key={id}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
                          group.parallel ? "flex-1 max-w-[155px]" : "w-full max-w-[280px]"
                        } ${
                          state.status === "running"
                            ? "border-info bg-info/5"
                            : state.status === "complete"
                            ? "border-safe/30 bg-safe/5"
                            : state.status === "error"
                            ? "border-destructive bg-destructive/5"
                            : "border-border bg-card"
                        }`}
                        animate={state.status === "complete" ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Node circle */}
                        <div className={`relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                          state.status === "running"
                            ? "bg-info/20"
                            : state.status === "complete"
                            ? "bg-primary"
                            : "bg-muted"
                        }`}>
                          {state.status === "running" && (
                            <span className="absolute inset-0 rounded-full animate-sonar bg-info/30" />
                          )}
                          {state.status === "complete" ? (
                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                          ) : (
                            <IconComp className={`h-4 w-4 ${
                              state.status === "running" ? "text-info" : "text-muted-foreground"
                            }`} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-display truncate ${
                              state.status === "idle" ? "text-muted-foreground" : "text-foreground"
                            }`}>
                              {node.shortName}
                            </span>
                            {node.isEngine && (
                              <span className="text-[9px] font-display text-primary">⚡NEW</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {getStatusIcon(state.status)}
                            <span className="text-[10px] font-mono-numbers text-muted-foreground">
                              {state.status === "idle"
                                ? "Waiting"
                                : state.status === "running"
                                ? `${state.elapsed.toFixed(1)}s`
                                : `${state.elapsed.toFixed(1)}s ✓`}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Merge connector for parallel groups */}
                {group.parallel && (
                  <div className="flex justify-center py-0.5">
                    <div className="w-32 h-px bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Right — Log Stream */}
        <Card data-tour="agent-logs" className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-display text-muted-foreground uppercase tracking-wider">
              Live Log Stream
            </h3>
            <Badge variant="secondary" className="text-[10px] font-mono-numbers">
              {visibleLogs.length} entries
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 font-mono-numbers text-xs space-y-0.5 bg-background/50 min-h-full">
              {visibleLogs.length === 0 && !running && (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-body">
                  Click "Run Pipeline" to start analysis
                </div>
              )}
              <AnimatePresence>
                {visibleLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`py-0.5 ${log.level === "critical" ? "bg-destructive/10 px-2 rounded -mx-2" : ""}`}
                  >
                    <span className="text-muted-foreground">[{log.timestamp}]</span>{" "}
                    <span className={`font-semibold ${getAgentLogColor(log.agent)}`}>
                      [{log.agent}]
                    </span>{" "}
                    <span className={getLogColor(log.level)}>{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logEndRef} />
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Risk Flag Toasts */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 space-y-2 max-w-sm sm:ml-auto">
        <AnimatePresence>
          {riskToasts.map((toast, i) => (
            <motion.div
              key={toast.timestamp + toast.message}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`px-4 py-3 rounded-lg border shadow-lg ${
                toast.level === "critical"
                  ? "bg-destructive/20 border-destructive text-destructive"
                  : "bg-warning/20 border-warning text-warning"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">🚨</span>
                <div>
                  <p className="text-xs font-display font-bold">{toast.agent}</p>
                  <p className="text-xs font-body mt-0.5">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentProgress;
