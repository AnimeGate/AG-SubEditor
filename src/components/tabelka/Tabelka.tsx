import { useState, useCallback, useEffect } from "react";
import { TabelkaSettingsPanel } from "./TabelkaSettingsPanel";
import { TabelkaPreview } from "./TabelkaPreview";
import { TabelkaOutput } from "./TabelkaOutput";
import {
  BLUEPRINTS,
  getBlueprintById,
  getResolutionPresetById,
  getContentForBlueprint,
  saveContentForBlueprint,
} from "@/lib/tabelka-blueprints";
import { generateTabelka, generateLogo } from "@/lib/tabelka-generator";

export interface TabelkaState {
  // Resolution
  presetId: string;
  width: number;
  height: number;

  // Position
  side: "left" | "right";

  // Selected blueprint
  blueprintId: string;

  // Editable content (per blueprint, saved to localStorage)
  title: string;
  content: string;
  description: string;

  // Content font size override (default 108)
  contentFontSize: number;
}

const DEFAULT_BLUEPRINT_ID = BLUEPRINTS[0]?.id ?? "custom";

function getInitialState(): TabelkaState {
  const content = getContentForBlueprint(DEFAULT_BLUEPRINT_ID);
  return {
    presetId: "1080p",
    width: 1920,
    height: 1080,
    side: "left",
    blueprintId: DEFAULT_BLUEPRINT_ID,
    title: content.title,
    content: content.content,
    description: content.description,
    contentFontSize: 70,
  };
}

export default function Tabelka() {
  const [state, setState] = useState<TabelkaState>(getInitialState);
  const [output, setOutput] = useState<string>("");
  const [logoOutput, setLogoOutput] = useState<string>("");

  // Handle preset change
  const handlePresetChange = useCallback((presetId: string) => {
    const preset = getResolutionPresetById(presetId);
    if (preset) {
      setState((prev) => ({
        ...prev,
        presetId,
        width: preset.width,
        height: preset.height,
      }));
    }
  }, []);

  // Handle custom resolution change
  const handleResolutionChange = useCallback(
    (width: number, height: number) => {
      setState((prev) => ({
        ...prev,
        presetId: "custom",
        width,
        height,
      }));
    },
    []
  );

  // Handle side change
  const handleSideChange = useCallback((side: "left" | "right") => {
    setState((prev) => ({ ...prev, side }));
  }, []);

  // Handle content font size change
  const handleContentFontSizeChange = useCallback((size: number) => {
    setState((prev) => ({ ...prev, contentFontSize: size }));
  }, []);

  // Handle blueprint change - load saved content for new blueprint
  const handleBlueprintChange = useCallback((blueprintId: string) => {
    const content = getContentForBlueprint(blueprintId);
    setState((prev) => ({
      ...prev,
      blueprintId,
      title: content.title,
      content: content.content,
      description: content.description,
    }));
  }, []);

  // Handle content changes
  const handleContentChange = useCallback(
    (field: "title" | "content" | "description", value: string) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Save content to localStorage when it changes
  const handleSaveContent = useCallback(() => {
    saveContentForBlueprint(state.blueprintId, {
      title: state.title,
      content: state.content,
      description: state.description,
    });
  }, [state.blueprintId, state.title, state.content, state.description]);

  // Generate output
  const handleGenerate = useCallback(() => {
    const blueprint = getBlueprintById(state.blueprintId);
    if (!blueprint) return;

    // Override font size in content style (replace \fsXX with user's font size)
    const contentStyleWithFontSize = blueprint.contentStyle.replace(
      /\\fs\d+/,
      `\\fs${state.contentFontSize}`
    );

    // Combine style prefix with user content
    const styledTitle = blueprint.titleStyle + state.title;
    const styledContent = contentStyleWithFontSize + state.content;
    const styledDescription = blueprint.descriptionStyle + state.description;

    const result = generateTabelka({
      width: state.width,
      height: state.height,
      side: state.side,
      title: styledTitle,
      content: styledContent,
      description: styledDescription,
      groupName: blueprint.name,
    });

    setOutput(result);

    // Generate logo with the same resolution
    const logoResult = generateLogo({
      width: state.width,
      height: state.height,
    });
    setLogoOutput(logoResult);

    // Auto-save content when generating
    handleSaveContent();
  }, [state, handleSaveContent]);

  // Get current content for preview (plain text only)
  const getCurrentContent = useCallback(() => {
    return {
      title: state.title,
      content: state.content,
      description: state.description,
      groupName: getBlueprintById(state.blueprintId)?.name ?? "Grupa",
    };
  }, [state.blueprintId, state.title, state.content, state.description]);

  return (
    <div className="flex h-full flex-1 gap-4 overflow-hidden p-4">
      {/* Left Panel - Settings */}
      <TabelkaSettingsPanel
        state={state}
        onPresetChange={handlePresetChange}
        onResolutionChange={handleResolutionChange}
        onSideChange={handleSideChange}
        onBlueprintChange={handleBlueprintChange}
        onContentChange={handleContentChange}
        onContentFontSizeChange={handleContentFontSizeChange}
        onSaveContent={handleSaveContent}
        onGenerate={handleGenerate}
      />

      {/* Right Panel - Preview & Output */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Preview */}
        <TabelkaPreview
          width={state.width}
          height={state.height}
          side={state.side}
          content={getCurrentContent()}
        />

        {/* Output */}
        <TabelkaOutput output={output} logoOutput={logoOutput} />
      </div>
    </div>
  );
}
