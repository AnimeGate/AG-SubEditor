import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommandDialog } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings2, Zap, AlertCircle, CheckCircle2, ExternalLink, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import type { EncodingSettings } from "./WypalarkaSettings";

interface WypalarkaSettingsModalProps {
  settings: EncodingSettings;
  onSettingsChange: (settings: EncodingSettings) => void;
  disabled?: boolean;
  gpuAvailable?: boolean;
  gpuInfo?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QUALITY_PRESETS = {
  ultra: { bitrate: "6000k", label: "Ultra (6000k)", description: "Best quality, large file" },
  high: { bitrate: "4000k", label: "High (4000k)", description: "Great quality" },
  medium: { bitrate: "2400k", label: "Medium (2400k)", description: "Balanced" },
  low: { bitrate: "1200k", label: "Low (1200k)", description: "Small file, web" },
  custom: { bitrate: "custom", label: "Custom", description: "Set your own bitrate" },
};

export function WypalarkaSettingsModal({
  settings,
  onSettingsChange,
  disabled,
  gpuAvailable,
  gpuInfo,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: WypalarkaSettingsModalProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [localBitrate, setLocalBitrate] = useState(settings.customBitrate);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  // Output defaults (persisted via settingsAPI)
  const [outputLocationMode, setOutputLocationMode] = useState<"same_as_input" | "custom_folder">("same_as_input");
  const [outputCustomFolder, setOutputCustomFolder] = useState<string | null>(null);
  const [outputPrefix, setOutputPrefix] = useState<string>("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Load existing output defaults
  useEffect(() => {
    (async () => {
      try {
        const out = await (window as any).settingsAPI?.getOutput?.();
        if (out) {
          setOutputLocationMode(out.locationMode);
          setOutputCustomFolder(out.customFolder);
          setOutputPrefix(out.filenamePrefix || "");
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handlePresetChange = (preset: string) => {
    const newSettings = {
      ...settings,
      qualityPreset: preset as EncodingSettings["qualityPreset"],
    };

    if (preset !== "custom") {
      newSettings.customBitrate = QUALITY_PRESETS[preset as keyof typeof QUALITY_PRESETS].bitrate;
      setLocalBitrate(newSettings.customBitrate);
    }

    onSettingsChange(newSettings);
  };

  const applyProfile = (profile: string) => {
    // Map simple profiles to underlying settings
    const s = { ...settings, profile: profile as EncodingSettings["profile"] } as EncodingSettings;
    // Clear any previous scale settings
    s.scaleWidth = undefined;
    s.scaleHeight = undefined;

    switch (profile) {
      case "1080p":
        // Standard 1080p output (no scaling)
        s.useHardwareAccel = true;
        s.codec = "h264";
        s.preset = "p4";
        s.qualityMode = "vbr";
        s.customBitrate = "2400k";
        s.gpuDecode = false;
        s.spatialAQ = true;
        s.temporalAQ = true;
        s.rcLookahead = 20;
        break;
      case "1080p_downscale":
        // For 4K sources → 1080p
        s.useHardwareAccel = true;
        s.codec = "h264";
        s.preset = "p4";
        s.qualityMode = "vbr";
        s.customBitrate = "2400k";
        s.gpuDecode = false;
        s.spatialAQ = true;
        s.temporalAQ = true;
        s.rcLookahead = 20;
        s.scaleWidth = 1920;
        s.scaleHeight = 1080;
        break;
      case "1080p_cinema":
        // 1920x804 for ~2.39:1 letterbox
        s.useHardwareAccel = true;
        s.codec = "h264";
        s.preset = "p4";
        s.qualityMode = "vbr";
        s.customBitrate = "2400k";
        s.gpuDecode = false;
        s.spatialAQ = true;
        s.temporalAQ = true;
        s.rcLookahead = 20;
        s.scaleWidth = 1920;
        s.scaleHeight = 804;
        break;
      case "4k":
        // Standard 4K output (no scaling)
        s.useHardwareAccel = true;
        s.codec = "h264";
        s.preset = "p4";
        s.qualityMode = "vbr";
        s.customBitrate = "6M";
        s.gpuDecode = false;
        s.spatialAQ = true;
        s.temporalAQ = true;
        s.rcLookahead = 20;
        break;
      case "4k_cinema":
        // 3840x1608 for ~2.39:1 letterbox in 4K
        s.useHardwareAccel = true;
        s.codec = "h264";
        s.preset = "p4";
        s.qualityMode = "vbr";
        s.customBitrate = "6M";
        s.gpuDecode = false;
        s.spatialAQ = true;
        s.temporalAQ = true;
        s.rcLookahead = 20;
        s.scaleWidth = 3840;
        s.scaleHeight = 1608;
        break;
      default:
        s.profile = "custom";
        break;
    }
    onSettingsChange(s);
  };

  const handleBitrateChange = (value: string) => {
    setLocalBitrate(value);
    onSettingsChange({
      ...settings,
      customBitrate: value,
    });
  };

  const handleHardwareAccelChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      useHardwareAccel: checked,
    });
  };

  const handleGpuDecodeChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      gpuDecode: checked,
    });
  };

  const handleCodecChange = (value: string) => {
    onSettingsChange({
      ...settings,
      codec: value as EncodingSettings["codec"],
    });
  };

  const handlePresetChangeEncoder = (value: string) => {
    onSettingsChange({
      ...settings,
      preset: value as EncodingSettings["preset"],
    });
  };

  const handleRcModeChange = (value: string) => {
    onSettingsChange({
      ...settings,
      qualityMode: value as EncodingSettings["qualityMode"],
    });
  };

  const handleCqChange = (value: string) => {
    const parsed = parseInt(value, 10);
    onSettingsChange({
      ...settings,
      cq: Number.isFinite(parsed) ? parsed : undefined,
    });
  };

  const handleSpatialAQ = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      spatialAQ: checked,
    });
  };

  const handleTemporalAQ = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      temporalAQ: checked,
    });
  };

  const handleRcLookahead = (value: string) => {
    const parsed = parseInt(value, 10);
    onSettingsChange({
      ...settings,
      rcLookahead: Number.isFinite(parsed) ? parsed : undefined,
    });
  };

  const currentPreset = QUALITY_PRESETS[settings.qualityPreset];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          title={t("wypalarkaEncodingSettings")}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(92vw,720px)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t("wypalarkaEncodingSettings")}
          </DialogTitle>
          <DialogDescription>{t("wypalarkaEncodingSettingsDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Output Defaults */}
          <div className="space-y-3">
            <Label>{t("outputDefaults", { defaultValue: "Domyślne wyjście / Output defaults" })}</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label>{t("saveLocation", { defaultValue: "Miejsce zapisu / Save location" })}</Label>
                <Select value={outputLocationMode} onValueChange={(v) => setOutputLocationMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_as_input">{t("saveSameAsInput", { defaultValue: "Jak plik źródłowy / Same as input" })}</SelectItem>
                    <SelectItem value="input_subfolder">{t("saveInputSubfolder", { defaultValue: "Folder 'wypalone' obok pliku / 'wypalone' subfolder" })}</SelectItem>
                    <SelectItem value="custom_folder">{t("saveCustomFolder", { defaultValue: "Własny folder / Custom folder" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {outputLocationMode === "custom_folder" && (
                <div className="space-y-1">
                  <Label>{t("chooseFolder", { defaultValue: "Wybierz folder / Choose folder" })}</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={outputCustomFolder || ""} placeholder={t("noFolderSelected", { defaultValue: "Nie wybrano / Not selected" }) as string} />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const folder = await (window as any).settingsAPI?.selectOutputFolder?.();
                        if (folder) {
                          setOutputCustomFolder(folder);
                        }
                      }}
                    >
                      {t("choose", { defaultValue: "Wybierz / Choose" })}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label>{t("filenamePrefix", { defaultValue: "Prefiks nazwy pliku / Filename prefix" })}</Label>
                <Input value={outputPrefix} onChange={(e) => setOutputPrefix(e.target.value)} placeholder="e.g. subbed_" />
              </div>

              <div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saveState === "saving"}
                  onClick={async () => {
                    setSaveState("saving");
                    try {
                      await (window as any).settingsAPI?.updateOutput?.({
                        locationMode: outputLocationMode,
                        customFolder: outputLocationMode === "custom_folder" ? outputCustomFolder : null,
                        filenamePrefix: outputPrefix,
                      });
                      (window as any).debugAPI?.success?.("Output defaults saved");
                      setSaveState("success");
                      setTimeout(() => setSaveState("idle"), 2000);
                    } catch (e) {
                      (window as any).debugAPI?.error?.(`Failed to save output defaults: ${String(e)}`);
                      setSaveState("error");
                      setTimeout(() => setSaveState("idle"), 3000);
                    }
                  }}
                >
                  {saveState === "saving"
                    ? t("saving", { defaultValue: "Zapisywanie... / Saving..." })
                    : t("saveOutputDefaults", { defaultValue: "Zapisz domyślne / Save defaults" })}
                </Button>
                {saveState === "success" && (
                  <div className="text-xs text-green-600 flex items-center gap-2 mt-2">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("saved", { defaultValue: "Zapisano domyślne / Saved" })}
                  </div>
                )}
                {saveState === "error" && (
                  <div className="text-xs text-destructive flex items-center gap-2 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    {t("saveFailed", { defaultValue: "Nie udało się zapisać / Save failed" })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Profiles (Command dialog only) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{t("wypalarkaProfile")}</Label>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs p-3">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">{t("wypalarkaProfileHelpTitle")}</p>
                      <ul className="space-y-1.5 text-muted-foreground">
                        <li><span className="font-medium text-foreground">1080p</span> – {t("wypalarkaProfileHelp1080p")}</li>
                        <li><span className="font-medium text-foreground">1080p (downscale)</span> – {t("wypalarkaProfileHelp1080pDownscale")}</li>
                        <li><span className="font-medium text-foreground">1080p Cinema</span> – {t("wypalarkaProfileHelp1080pCinema")}</li>
                        <li><span className="font-medium text-foreground">4K</span> – {t("wypalarkaProfileHelp4k")}</li>
                        <li><span className="font-medium text-foreground">4K Cinema</span> – {t("wypalarkaProfileHelp4kCinema")}</li>
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="outline"
              type="button"
              className="w-full justify-start"
              onClick={() => setProfileDialogOpen(true)}
            >
              {(() => {
                const p = settings.profile ?? "custom";
                switch (p) {
                  case "1080p":
                    return t("wypalarkaProfile1080p");
                  case "1080p_downscale":
                    return t("wypalarkaProfile1080pDownscale");
                  case "1080p_cinema":
                    return t("wypalarkaProfile1080pCinema");
                  case "4k":
                    return t("wypalarkaProfile4k");
                  case "4k_cinema":
                    return t("wypalarkaProfile4kCinema");
                  default:
                    return t("wypalarkaProfileCustom");
                }
              })()}
            </Button>
            <p className="text-xs text-muted-foreground">{t("wypalarkaProfileDesc")}</p>
            <CommandDialog
              open={profileDialogOpen}
              onOpenChange={setProfileDialogOpen}
              onSelect={(value) => applyProfile(value)}
              groups={[
                {
                  title: "1080p",
                  items: [
                    { value: "1080p", label: t("wypalarkaProfile1080p") as string },
                    { value: "1080p_downscale", label: t("wypalarkaProfile1080pDownscale") as string },
                    { value: "1080p_cinema", label: t("wypalarkaProfile1080pCinema") as string },
                  ],
                },
                {
                  title: "4K",
                  items: [
                    { value: "4k", label: t("wypalarkaProfile4k") as string },
                    { value: "4k_cinema", label: t("wypalarkaProfile4kCinema") as string },
                  ],
                },
                {
                  title: t("wypalarkaProfileCustom") as string,
                  items: [
                    { value: "custom", label: t("wypalarkaProfileCustom") as string },
                  ],
                },
              ]}
            />
          </div>
          {/* Quality Preset (bitrate presets) - only enabled when profile is "custom" */}
          <div className="space-y-3">
            <Label htmlFor="quality-preset">{t("wypalarkaQualityPreset")}</Label>
            <Select
              value={settings.qualityPreset}
              onValueChange={handlePresetChange}
              disabled={(settings.profile !== "custom" && settings.profile !== undefined) || settings.qualityMode === "cq" || settings.qualityMode === "vbr_hq"}
            >
              <SelectTrigger id="quality-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultra">
                  <div className="flex items-center gap-2">
                    🔥 <span className="font-medium">{t("wypalarkaQualityUltra")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    ⚡ <span className="font-medium">{t("wypalarkaQualityHigh")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    📺 <span className="font-medium">{t("wypalarkaQualityMedium")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    💾 <span className="font-medium">{t("wypalarkaQualityLow")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    🎯 <span className="font-medium">{t("wypalarkaQualityCustom")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{currentPreset.description}</p>
            {settings.profile !== "custom" && settings.profile !== undefined && (
              <p className="text-xs text-muted-foreground">
                {t("wypalarkaQualityPresetLockedByProfile")}
              </p>
            )}
            {(settings.qualityMode === "cq" || settings.qualityMode === "vbr_hq") && (
              <p className="text-xs text-muted-foreground">
                {t("bitrateNotUsedCQVBRHQ")}
              </p>
            )}
          </div>

          {/* Custom Bitrate Input - only shown when profile is "custom" or undefined, and qualityPreset is "custom" */}
          {(settings.profile === "custom" || settings.profile === undefined) && settings.qualityPreset === "custom" && (
            <div className="space-y-3">
              <Label htmlFor="custom-bitrate">{t("wypalarkaCustomBitrate")}</Label>
              <Input
                id="custom-bitrate"
                type="text"
                placeholder="e.g., 3000k or 5M"
                value={localBitrate}
                onChange={(e) => handleBitrateChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("wypalarkaCustomBitrateDesc")}</p>
            </div>
          )}

          {/* Hardware Acceleration & Advanced */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="hardware-accel"
                checked={settings.useHardwareAccel}
                onCheckedChange={handleHardwareAccelChange}
              />
              <div className="space-y-2 flex-1">
                <Label htmlFor="hardware-accel" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {t("wypalarkaHardwareAccel")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("wypalarkaHardwareAccelDesc")}</p>

                {/* GPU Status */}
                <div className="mt-2">
                  {gpuAvailable === true && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("wypalarkaGpuAvailable")}
                    </Badge>
                  )}
                  {gpuAvailable === false && (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {t("wypalarkaGpuNotAvailable")}
                      </Badge>
                      <div className="text-xs space-y-1 p-3 bg-muted/50 rounded-md">
                        <p className="font-medium">{t("wypalarkaGpuSetupTitle")}</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>{t("wypalarkaGpuSetup1")}</li>
                          <li>{t("wypalarkaGpuSetup2")}</li>
                          <li>{t("wypalarkaGpuSetup3")}</li>
                        </ul>
                        <a
                          href="https://developer.nvidia.com/cuda-downloads"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                        >
                          {t("wypalarkaGpuDownload")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {gpuAvailable === undefined && (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {t("wypalarkaGpuDetecting")}
                    </Badge>
                  )}
                </div>

                {gpuInfo && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">{t("wypalarkaGpuInfo")}:</span> {gpuInfo}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced section (collapsible) */}
            <details className="pt-2">
              <summary className="cursor-pointer text-sm font-medium select-none">
                {t("wypalarkaAdvancedSettings", { defaultValue: "Zaawansowane / Advanced" })}
              </summary>
              <div className="mt-3 space-y-4">
                {/* GPU Decode toggle */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="gpu-decode"
                    checked={!!settings.gpuDecode}
                    onCheckedChange={handleGpuDecodeChange}
                    disabled={disabled || gpuAvailable === false}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="gpu-decode" className="cursor-pointer font-medium">
                      {t("wypalarkaGpuDecode")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("wypalarkaGpuDecodeDesc")}
                    </p>
                  </div>
                </div>

                {/* Advanced encoder controls */}
                <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label>{t("wypalarkaEncoderCodec")}</Label>
                <Select value={settings.codec ?? "h264"} onValueChange={handleCodecChange} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h264">H.264</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("wypalarkaEncoderCodecDesc")}</p>
              </div>
              <div className="space-y-1">
                <Label>{t("wypalarkaEncoderPreset")}</Label>
                <Select value={settings.preset ?? "p4"} onValueChange={handlePresetChangeEncoder} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">{t("wypalarkaEncoderPresetP1")}</SelectItem>
                    <SelectItem value="p2">{t("wypalarkaEncoderPresetP2")}</SelectItem>
                    <SelectItem value="p3">{t("wypalarkaEncoderPresetP3")}</SelectItem>
                    <SelectItem value="p4">{t("wypalarkaEncoderPresetP4")}</SelectItem>
                    <SelectItem value="p5">{t("wypalarkaEncoderPresetP5")}</SelectItem>
                    <SelectItem value="p6">{t("wypalarkaEncoderPresetP6")}</SelectItem>
                    <SelectItem value="p7">{t("wypalarkaEncoderPresetP7")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("wypalarkaEncoderPresetDesc")}</p>
              </div>
              <div className="space-y-1">
                <Label>{t("wypalarkaRateControl")}</Label>
                <Select value={settings.qualityMode ?? "vbr_hq"} onValueChange={handleRcModeChange} disabled={disabled}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cq">{t("wypalarkaRateControlCQ")}</SelectItem>
                    <SelectItem value="vbr">{t("wypalarkaRateControlVBR")}</SelectItem>
                    <SelectItem value="vbr_hq">{t("wypalarkaRateControlVBRHQ")}</SelectItem>
                    <SelectItem value="cbr">{t("wypalarkaRateControlCBR")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("wypalarkaRateControlDesc")}</p>
              </div>
              {(settings.qualityMode === "cq" || settings.qualityMode === "vbr_hq" || settings.qualityMode === undefined) && (
                <div className="space-y-1">
                  <Label>{t("wypalarkaCQ")}</Label>
                  <Input type="number" min={1} max={51} step={1} value={settings.cq ?? 19} onChange={(e) => handleCqChange(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t("wypalarkaCQDesc")}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <Checkbox id="spatial-aq" checked={settings.spatialAQ ?? true} onCheckedChange={handleSpatialAQ} />
                  <Label htmlFor="spatial-aq">{t("wypalarkaSpatialAQ")}</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="temporal-aq" checked={settings.temporalAQ ?? true} onCheckedChange={handleTemporalAQ} />
                  <Label htmlFor="temporal-aq">{t("wypalarkaTemporalAQ")}</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("wypalarkaSpatialAQDesc")}</p>
              <p className="text-xs text-muted-foreground">{t("wypalarkaTemporalAQDesc")}</p>
              <div className="space-y-1">
                <Label>{t("wypalarkaRcLookahead")}</Label>
                <Input type="number" min={0} max={64} step={1} value={settings.rcLookahead ?? 20} onChange={(e) => handleRcLookahead(e.target.value)} />
                <p className="text-xs text-muted-foreground">{t("wypalarkaRcLookaheadDesc")}</p>
              </div>
            </div>
              </div>
            </details>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
