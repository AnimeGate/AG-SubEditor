import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import SettingsModal from "./SettingsModal";
import { ChangelogHistoryDialog } from "./ChangelogHistoryDialog";
import { FileText, Flame } from "lucide-react";
import { debugLog } from "@/helpers/debug-logger";

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouterState();
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
            <Link to="/">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                {t("navSubtitleEditor")}
              </Button>
            </Link>
            <Link to="/wypalarka">
              <Button
                variant={isActive("/wypalarka") ? "default" : "ghost"}
                className="gap-2"
              >
                <Flame className="h-4 w-4" />
                {t("navWypalarka")}
              </Button>
            </Link>
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
