import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import SettingsModal from "./SettingsModal";
import { FileText, Flame } from "lucide-react";

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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

        {/* Right: Settings */}
        <div className="flex items-center">
          <SettingsModal />
        </div>
      </div>
    </nav>
  );
}
