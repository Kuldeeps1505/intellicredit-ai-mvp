import { useLocation, useNavigate } from "react-router-dom";
import { useDataset } from "@/contexts/DatasetContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Wifi, WifiOff, Loader2, Palette } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/upload": "Document Upload",
  "/agents": "Agent Progress",
  "/risk": "Risk Analytics",
  "/spreads": "Financial Spreads",
  "/bank-analytics": "Bank Analytics",
  "/promoter": "Promoter Intel",
  "/diligence": "Due Diligence",
  "/report": "CAM Report",
  "/audit": "Audit Trail",
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    dataset,
    riskData,
    pipelineStatus,
    apiConnected,
    apiHealthChecking,
    applicationsQueryError,
  } = useDataset();
  const { toggleTheme, themeName } = useTheme();
  const title = pageTitles[location.pathname] || "IntelliCredit AI";
  const pipelineRunning = pipelineStatus.agents.some((agent) => agent.status === "running");

  const scoreColor =
    riskData.score >= 70 ? "bg-safe text-white border-safe/50" :
    riskData.score >= 50 ? "bg-warning text-white border-warning/50" :
    "bg-destructive text-destructive-foreground border-destructive/50";

  const scoreGlow =
    riskData.score >= 70 ? "shadow-safe/30" :
    riskData.score >= 50 ? "shadow-warning/30" :
    "shadow-destructive/30";

  const connectionOk = apiConnected && !applicationsQueryError;
  const connectionFailed = !apiHealthChecking && (!apiConnected || applicationsQueryError);

  return (
    <header className="min-h-14 border-b border-border/50 bg-card backdrop-blur-sm shadow-header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 py-2 sm:px-6 sm:py-0 sticky top-0 z-40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm min-w-0">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <div className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
        <span className="text-muted-foreground font-body hidden sm:inline">IntelliCredit</span>
        <span className="text-muted-foreground/40 hidden sm:inline">/</span>
        <span className="text-primary/80 font-display font-medium truncate max-w-[140px] sm:max-w-[180px]">
          {dataset.companyName}
        </span>
        <span className="text-muted-foreground/40 hidden md:inline">/</span>
        <span className="text-foreground font-display font-medium truncate">{title}</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Palette className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span className="text-xs">{themeName}</span>
          </TooltipContent>
        </Tooltip>

        <button
          onClick={() => navigate("/risk")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-numbers font-bold border shadow-md cursor-pointer transition-all hover:scale-105 ${scoreColor} ${scoreGlow}`}
          title="Jump to Risk Analytics"
        >
          <span>{riskData.score}</span>
          <span className="text-[8px] font-display opacity-80">/100</span>
        </button>

        <div className="bg-secondary px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs font-mono-numbers text-muted-foreground hidden sm:block max-w-[120px] truncate">
          {dataset.cin.length > 12 ? `${dataset.cin.slice(0, 12)}…` : dataset.cin}
        </div>

        <div className="bg-secondary px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-display uppercase tracking-wider text-muted-foreground">
          {pipelineRunning ? "Running" : dataset.status}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              {apiHealthChecking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground hidden lg:inline">API…</span>
                </>
              ) : connectionOk ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-safe" />
                  </span>
                  <Wifi className="h-3.5 w-3.5 text-safe" />
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                  <WifiOff className="h-3.5 w-3.5 text-destructive" />
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">
              {apiHealthChecking
                ? "Checking API…"
                : connectionFailed
                  ? "API unreachable or application list failed. Set VITE_API_URL and ensure the backend is running."
                  : "Connected to IntelliCredit API"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
