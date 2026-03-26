import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MetricsFooter } from "./MetricsFooter";
import { AiChatWidget } from "./AiChatWidget";
import { DemoTourOverlay } from "./DemoTourOverlay";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoTourProvider } from "@/contexts/DemoTourContext";

export function AppLayout() {
  return (
    <TooltipProvider>
      <DemoTourProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              <main data-tour-content className="flex-1 p-3 pb-2 sm:p-6 sm:pb-2 max-w-full overflow-x-hidden">
                <Outlet />
              </main>
              <MetricsFooter />
            </div>
            <AiChatWidget />
            <DemoTourOverlay />
          </div>
        </SidebarProvider>
      </DemoTourProvider>
    </TooltipProvider>
  );
}
