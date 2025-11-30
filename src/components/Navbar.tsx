import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SettingsModal from "./SettingsModal";
import { ChangelogHistoryDialog } from "./ChangelogHistoryDialog";
import { FileText, Flame, Table2 } from "lucide-react";
import { debugLog } from "@/helpers/debug-logger";
import { useProcessing } from "@/contexts/ProcessingContext";

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouterState();
  const { isProcessing } = useProcessing();
  const currentPath = router.location.pathname;

  const isActive = (path: string) => currentPath === path;

  // Log route changes
  useEffect(() => {
    debugLog.route(`Navigated to: ${currentPath}`);
  }, [currentPath]);

  return (
    <nav className="bg-card/50 border-b backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-xl font-bold">
              {t("appName")}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Link to="/" disabled={isProcessing}>
                      <Button
                        variant={isActive("/") ? "default" : "ghost"}
                        className="gap-2"
                        disabled={isProcessing && !isActive("/")}
                      >
                        <FileText className="h-4 w-4" />
                        {t("navSubtitleEditor")}
                      </Button>
                    </Link>
                  </span>
                </TooltipTrigger>
                {isProcessing && !isActive("/") && (
                  <TooltipContent>{t("navDisabledWhileProcessing")}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Link to="/wypalarka" disabled={isProcessing}>
                      <Button
                        variant={isActive("/wypalarka") ? "default" : "ghost"}
                        className="gap-2"
                        disabled={isProcessing && !isActive("/wypalarka")}
                      >
                        <Flame className="h-4 w-4" />
                        {t("navWypalarka")}
                      </Button>
                    </Link>
                  </span>
                </TooltipTrigger>
                {isProcessing && !isActive("/wypalarka") && (
                  <TooltipContent>{t("navDisabledWhileProcessing")}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Link to="/tabelka" disabled={isProcessing}>
                      <Button
                        variant={isActive("/tabelka") ? "default" : "ghost"}
                        className="gap-2"
                        disabled={isProcessing && !isActive("/tabelka")}
                      >
                        <Table2 className="h-4 w-4" />
                        {t("navTabelka")}
                      </Button>
                    </Link>
                  </span>
                </TooltipTrigger>
                {isProcessing && !isActive("/tabelka") && (
                  <TooltipContent>{t("navDisabledWhileProcessing")}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right: Changelog & Settings */}
        <div className="flex items-center gap-1">
          <ChangelogHistoryDialog />
          <SettingsModal />
        </div>
      </div>
    </nav>
  );
}
