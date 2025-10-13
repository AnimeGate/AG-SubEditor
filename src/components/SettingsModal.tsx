import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import langs from "@/localization/langs";
import { setAppLanguage } from "@/helpers/language_helpers";
import { setTheme, getCurrentTheme } from "@/helpers/theme_helpers";
import { useState, useEffect } from "react";
import type { ThemeMode } from "@/types/theme-mode";
import packageJson from "../../package.json";

export default function SettingsModal() {
  const { t, i18n } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    // Get current theme from localStorage
    getCurrentTheme().then(({ local }) => {
      setCurrentTheme(local || "system");
    });
  }, []);

  const handleLanguageChange = (value: string) => {
    setAppLanguage(value, i18n);
  };

  const handleThemeChange = async (value: string) => {
    const theme = value as ThemeMode;
    setCurrentTheme(theme);
    await setTheme(theme);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={t("settings")}>
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
          <DialogDescription>{t("settingsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t("languageSection")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("languageDescription")}
              </p>
            </div>
            <RadioGroup
              value={i18n.language}
              onValueChange={handleLanguageChange}
              className="space-y-2"
            >
              {langs.map((lang) => (
                <div
                  key={lang.key}
                  className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <RadioGroupItem value={lang.key} id={`lang-${lang.key}`} />
                  <Label
                    htmlFor={`lang-${lang.key}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div className="flex items-center justify-between">
                      <span>{lang.nativeName}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang.prefix}
                      </span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Theme Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t("themeSection")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("themeDescription")}
              </p>
            </div>
            <RadioGroup
              value={currentTheme}
              onValueChange={handleThemeChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="light" id="theme-light" />
                <Label
                  htmlFor="theme-light"
                  className="flex-1 cursor-pointer font-normal"
                >
                  {t("themeLight")}
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label
                  htmlFor="theme-dark"
                  className="flex-1 cursor-pointer font-normal"
                >
                  {t("themeDark")}
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="system" id="theme-system" />
                <Label
                  htmlFor="theme-system"
                  className="flex-1 cursor-pointer font-normal"
                >
                  {t("themeSystem")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Version Section */}
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold">{t("versionSection")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("versionDescription")}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <span className="text-sm font-medium">{t("currentVersion")}</span>
              <span className="text-sm font-mono text-muted-foreground">
                v{packageJson.version}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
