import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TimeAdjustmentPanelProps {
  onApply: (
    adjustment: number,
    unit: "milliseconds" | "seconds",
    applyTo: "start" | "end" | "both",
    scope: "selected" | "all"
  ) => void;
  selectedCount: number;
  totalCount: number;
}

export function TimeAdjustmentPanel({
  onApply,
  selectedCount,
  totalCount,
}: TimeAdjustmentPanelProps) {
  const [adjustment, setAdjustment] = useState<string>("0");
  const [unit, setUnit] = useState<"milliseconds" | "seconds">("milliseconds");
  const [applyTo, setApplyTo] = useState<"start" | "end" | "both">("both");
  const [scope, setScope] = useState<"selected" | "all">("all");
  const { t } = useTranslation();

  const handleApply = () => {
    const value = Number.parseFloat(adjustment);
    if (isNaN(value)) return;

    onApply(value, unit, applyTo, scope);
  };

  const handleReset = () => {
    setAdjustment("0");
    setUnit("milliseconds");
    setApplyTo("both");
    setScope("all");
  };

  const adjustmentValue = Number.parseFloat(adjustment);
  const isPositive = adjustmentValue > 0;
  const isNegative = adjustmentValue < 0;

  return (
    <Card className="w-full lg:w-96 shrink-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("timeSyncControl")}
        </CardTitle>
        <CardDescription>{t("timeSyncDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Adjustment Input */}
        <div className="space-y-2">
          <Label htmlFor="adjustment">{t("adjustTimeBy")}</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="adjustment"
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                className="font-mono pr-8"
                step="any"
              />
              {isPositive && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-semibold">
                  +
                </span>
              )}
              {isNegative && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-semibold">
                  −
                </span>
              )}
            </div>
            <Select
              value={unit}
              onValueChange={(v) => setUnit(v as "milliseconds" | "seconds")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milliseconds">{t("milliseconds")}</SelectItem>
                <SelectItem value="seconds">{t("seconds")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Apply To Options */}
        <div className="space-y-3">
          <Label>{t("applyTo")}</Label>
          <RadioGroup
            value={applyTo}
            onValueChange={(v) => setApplyTo(v as "start" | "end" | "both")}
          >
            <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="start" id="start" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="start" className="font-medium cursor-pointer">
                  {t("startTimeOnly")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("startTimeDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="end" id="end" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="end" className="font-medium cursor-pointer">
                  {t("endTimeOnly")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("endTimeDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="both" id="both" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="both" className="font-medium cursor-pointer">
                  {t("bothTimes")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bothTimesDesc")}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Selection Scope */}
        <div className="space-y-3">
          <Label>{t("selectionScope")}</Label>
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as "selected" | "all")}
          >
            <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem
                value="selected"
                id="selected"
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label
                  htmlFor="selected"
                  className="font-medium cursor-pointer"
                >
                  {t("selectedLines")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("selectedLinesDesc")} ({selectedCount}{" "}
                  {t("linesSelected")})
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="all" id="all" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="all" className="font-medium cursor-pointer">
                  {t("allLines")}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("allLinesDesc")} ({totalCount} {t("lines")})
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleApply} className="flex-1" size="lg">
            {t("applyTimeShift")}
          </Button>
          <Button onClick={handleReset} variant="outline" size="lg">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
