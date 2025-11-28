import { Settings, ImagePlus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import langs from "@/localization/langs";
import { setAppLanguage } from "@/helpers/language_helpers";
import { setTheme, getCurrentTheme } from "@/helpers/theme_helpers";
import { useState, useEffect } from "react";
import type { ThemeMode } from "@/types/theme-mode";
import { useBackground } from "@/helpers/background_helpers";
import packageJson from "../../package.json";

export default function SettingsModal() {
  const { t, i18n } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("system");
  const { background, setBackground } = useBackground();

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

  const handleBackgroundToggle = async (enabled: boolean) => {
    const updated = await window.backgroundAPI.update({ enabled });
    setBackground(updated);
  };

  const handleSelectImage = async () => {
    const result = await window.backgroundAPI.selectImage();
    if (result) {
      setBackground(result);
    }
  };

  const handleRemoveBackground = async () => {
    await window.backgroundAPI.remove();
    const updated = await window.backgroundAPI.get();
    setBackground(updated);
  };

  const handleOpacityChange = async (value: number[]) => {
    const opacity = value[0] / 100;
    const updated = await window.backgroundAPI.update({ opacity });
    setBackground(updated);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={t("settings")}>
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
          <DialogDescription>{t("settingsDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto py-4 pr-2">
          {/* Language Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t("languageSection")}</h3>
              <p className="text-muted-foreground text-sm">
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
                  className="hover:bg-accent/50 flex items-center space-y-0 space-x-3 rounded-lg border p-4 transition-colors"
                >
                  <RadioGroupItem value={lang.key} id={`lang-${lang.key}`} />
                  <Label
                    htmlFor={`lang-${lang.key}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div className="flex items-center justify-between">
                      <span>{lang.nativeName}</span>
                      <span className="text-muted-foreground text-xs">
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
              <p className="text-muted-foreground text-sm">
                {t("themeDescription")}
              </p>
            </div>
            <RadioGroup
              value={currentTheme}
              onValueChange={handleThemeChange}
              className="space-y-2"
            >
              <div className="hover:bg-accent/50 flex items-center space-y-0 space-x-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem value="light" id="theme-light" />
                <Label
                  htmlFor="theme-light"
                  className="flex-1 cursor-pointer font-normal"
                >
                  {t("themeLight")}
                </Label>
              </div>
              <div className="hover:bg-accent/50 flex items-center space-y-0 space-x-3 rounded-lg border p-4 transition-colors">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label
                  htmlFor="theme-dark"
                  className="flex-1 cursor-pointer font-normal"
                >
                  {t("themeDark")}
                </Label>
              </div>
              <div className="hover:bg-accent/50 flex items-center space-y-0 space-x-3 rounded-lg border p-4 transition-colors">
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

          {/* Background Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{t("backgroundSection")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("backgroundDescription")}
              </p>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="background-enabled" className="cursor-pointer">
                {t("backgroundEnabled")}
              </Label>
              <Switch
                id="background-enabled"
                checked={background.enabled}
                onCheckedChange={handleBackgroundToggle}
                disabled={!background.imagePath}
              />
            </div>

            {/* Image selection and preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectImage}
                  className="flex-1"
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {t("backgroundSelectImage")}
                </Button>
                {background.imagePath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveBackground}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Preview */}
              {background.imageData ? (
                <div className="overflow-hidden rounded-lg border">
                  <div
                    className="h-24 w-full bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${background.imageData}")` }}
                  />
                </div>
              ) : (
                <div className="bg-muted/30 flex h-24 items-center justify-center rounded-lg border">
                  <span className="text-muted-foreground text-sm">
                    {t("backgroundNoImage")}
                  </span>
                </div>
              )}
            </div>

            {/* Opacity slider */}
            {background.imagePath && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("backgroundOpacity")}</Label>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(background.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(background.opacity * 100)]}
                  onValueChange={handleOpacityChange}
                  min={0}
                  max={90}
                  step={5}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">
                  {t("backgroundOpacityDesc")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Version Section */}
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-semibold">{t("versionSection")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("versionDescription")}
              </p>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-lg border p-4">
              <span className="text-sm font-medium">{t("currentVersion")}</span>
              <span className="text-muted-foreground font-mono text-sm">
                v{packageJson.version}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
