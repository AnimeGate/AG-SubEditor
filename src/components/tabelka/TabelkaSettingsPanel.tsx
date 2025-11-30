import { useTranslation } from "react-i18next";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table2, Sparkles } from "lucide-react";
import { BLUEPRINTS, RESOLUTION_PRESETS } from "@/lib/tabelka-blueprints";
import type { TabelkaState } from "./Tabelka";

interface TabelkaSettingsPanelProps {
  state: TabelkaState;
  onPresetChange: (presetId: string) => void;
  onResolutionChange: (width: number, height: number) => void;
  onSideChange: (side: "left" | "right") => void;
  onBlueprintChange: (blueprintId: string) => void;
  onContentChange: (
    field: "title" | "content" | "description",
    value: string
  ) => void;
  onContentFontSizeChange: (size: number) => void;
  onSaveContent: () => void;
  onGenerate: () => void;
}

export function TabelkaSettingsPanel({
  state,
  onPresetChange,
  onResolutionChange,
  onSideChange,
  onBlueprintChange,
  onContentChange,
  onContentFontSizeChange,
  onSaveContent,
  onGenerate,
}: TabelkaSettingsPanelProps) {
  const { t } = useTranslation();

  const isCustomResolution = state.presetId === "custom";

  // Get selected blueprint name for display
  const selectedBlueprint = BLUEPRINTS.find((bp) => bp.id === state.blueprintId);

  return (
    <Card className="flex w-80 shrink-0 flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Table2 className="h-5 w-5" />
          {t("tabelka.title")}
        </CardTitle>
        <CardDescription>{t("tabelka.description")}</CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1">
        <CardContent className="space-y-6 pb-6">
          {/* Resolution Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("tabelka.resolution")}</Label>
            <Select value={state.presetId} onValueChange={onPresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isCustomResolution && (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="width" className="text-xs text-muted-foreground">
                    {t("tabelka.width")}
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    value={state.width}
                    onChange={(e) =>
                      onResolutionChange(
                        parseInt(e.target.value) || 1920,
                        state.height
                      )
                    }
                    className="font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="height" className="text-xs text-muted-foreground">
                    {t("tabelka.height")}
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={state.height}
                    onChange={(e) =>
                      onResolutionChange(
                        state.width,
                        parseInt(e.target.value) || 1080
                      )
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Position Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("tabelka.position")}</Label>
            <RadioGroup
              value={state.side}
              onValueChange={(v) => onSideChange(v as "left" | "right")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="left" id="left" />
                <Label htmlFor="left" className="cursor-pointer">
                  {t("tabelka.left")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="right" />
                <Label htmlFor="right" className="cursor-pointer">
                  {t("tabelka.right")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Blueprint/Template Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("tabelka.template")}</Label>
            <Select
              value={state.blueprintId}
              onValueChange={onBlueprintChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLUEPRINTS.map((blueprint) => (
                  <SelectItem key={blueprint.id} value={blueprint.id}>
                    {blueprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Editable Content Fields - shown for all blueprints */}
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs text-muted-foreground">
                  {t("tabelka.titleField")}
                </Label>
                <Input
                  id="title"
                  value={state.title}
                  onChange={(e) => onContentChange("title", e.target.value)}
                  onBlur={onSaveContent}
                  placeholder={selectedBlueprint?.defaults.title ?? "Tytuł"}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="content" className="text-xs text-muted-foreground">
                  {t("tabelka.contentField")}
                </Label>
                <Textarea
                  id="content"
                  value={state.content}
                  onChange={(e) => onContentChange("content", e.target.value)}
                  onBlur={onSaveContent}
                  placeholder={selectedBlueprint?.defaults.content ?? "Zawartość"}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {t("tabelka.contentHint")}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {t("tabelka.contentFontSize")}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {state.contentFontSize}
                  </span>
                </div>
                <Slider
                  value={[state.contentFontSize]}
                  onValueChange={(value) => onContentFontSizeChange(value[0])}
                  min={24}
                  max={150}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc" className="text-xs text-muted-foreground">
                  {t("tabelka.descriptionField")}
                </Label>
                <Input
                  id="desc"
                  value={state.description}
                  onChange={(e) => onContentChange("description", e.target.value)}
                  onBlur={onSaveContent}
                  placeholder={selectedBlueprint?.defaults.description ?? "Opis / Discord"}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={onGenerate} className="w-full" size="lg">
            <Sparkles className="mr-2 h-4 w-4" />
            {t("tabelka.generate")}
          </Button>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
