import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings2, Zap, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
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

  const currentPreset = QUALITY_PRESETS[settings.qualityPreset];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          title={t("wypalarkaEncodingSettings")}
          data-tour="settings-button"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t("wypalarkaEncodingSettings")}
          </DialogTitle>
          <DialogDescription>{t("wypalarkaEncodingSettingsDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quality Preset */}
          <div className="space-y-3" data-tour="quality-preset">
            <Label htmlFor="quality-preset">{t("wypalarkaQualityPreset")}</Label>
            <Select value={settings.qualityPreset} onValueChange={handlePresetChange}>
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
          </div>

          {/* Custom Bitrate Input */}
          {settings.qualityPreset === "custom" && (
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

          {/* Hardware Acceleration */}
          <div className="space-y-3 pt-2 border-t" data-tour="gpu-acceleration">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
