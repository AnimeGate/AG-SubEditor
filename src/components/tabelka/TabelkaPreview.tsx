import { useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ImagePlus, X } from "lucide-react";
import { extractPlainText, calculateScaledValues } from "@/lib/tabelka-generator";

interface TabelkaPreviewProps {
  width: number;
  height: number;
  side: "left" | "right";
  content: {
    title: string;
    content: string;
    description: string;
    groupName: string;
  };
}

export function TabelkaPreview({
  width,
  height,
  side,
  content,
}: TabelkaPreviewProps) {
  const { t } = useTranslation();
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle background image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Calculate SVG viewBox and table position
  const preview = useMemo(() => {
    const isRight = side === "right";
    const scaled = calculateScaledValues(width, height, isRight);

    // Base table dimensions (from the ASS drawing commands)
    // The table drawing is 900x600 units, scaled by fscx/fscy
    const baseTableWidth = 900;
    const baseTableHeight = 600;

    // Scale factor from generator (scaleX/scaleY are percentages, e.g., "60" = 60%)
    const scalePercent = parseFloat(scaled.scaleX);
    const scaleFactor = scalePercent / 100;

    // Actual table dimensions in video coordinates
    const tableWidth = baseTableWidth * scaleFactor;
    const tableHeight = baseTableHeight * scaleFactor;

    // Center position of the table
    const centerX = parseFloat(scaled.posX);
    const centerY = parseFloat(scaled.posY);

    // Table bounding box
    const tableLeft = centerX - tableWidth / 2;
    const tableTop = centerY - tableHeight / 2;

    return {
      viewBox: `0 0 ${width} ${height}`,
      table: {
        x: tableLeft,
        y: tableTop,
        width: tableWidth,
        height: tableHeight,
        centerX: centerX,
        centerY: centerY,
        rx: 25 * scaleFactor,
        ry: 25 * scaleFactor,
      },
      fontSize: {
        title: 89 * scaleFactor,
        content: 60 * scaleFactor,
        desc: 48 * scaleFactor,
      },
    };
  }, [width, height, side]);

  // Extract plain text for display - keep all lines for content
  const displayContent = useMemo(
    () => ({
      title: extractPlainText(content.title),
      contentLines: extractPlainText(content.content).split("\n").filter(line => line.trim()),
      description: extractPlainText(content.description),
    }),
    [content]
  );

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Monitor className="h-4 w-4" />
          {t("tabelka.preview")}
          <div className="ml-auto flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {backgroundImage ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveBackground}
                className="h-7 gap-1 px-2 text-xs"
              >
                <X className="h-3 w-3" />
                {t("tabelka.removeBackground")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 gap-1 px-2 text-xs"
              >
                <ImagePlus className="h-3 w-3" />
                {t("tabelka.addBackground")}
              </Button>
            )}
            <span className="text-xs font-normal text-muted-foreground">
              {width}×{height}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-2 pt-0">
        {/* Fixed aspect ratio container */}
        <svg
          viewBox={preview.viewBox}
          className="h-full w-full rounded-md border"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxHeight: "100%", maxWidth: "100%", background: backgroundImage ? "transparent" : "rgba(0,0,0,0.9)" }}
        >
          {/* Background image if provided */}
          {backgroundImage && (
            <image
              href={backgroundImage}
              x={0}
              y={0}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid slice"
            />
          )}

          {/* Background gradient simulation */}
          <defs>
            <linearGradient id="tableBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDF8E5" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#E5EEF8" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="tableBorder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2A2E52" />
              <stop offset="100%" stopColor="#3F4257" />
            </linearGradient>
          </defs>

          {/* Table Background */}
          <rect
            x={preview.table.x}
            y={preview.table.y}
            width={preview.table.width}
            height={preview.table.height}
            rx={preview.table.rx}
            ry={preview.table.ry}
            fill="url(#tableBg)"
            stroke="url(#tableBorder)"
            strokeWidth={Math.max(3, preview.table.width * 0.006)}
          />

          {/* Title Header Box */}
          <rect
            x={preview.table.x + preview.table.width * 0.15}
            y={preview.table.y + preview.table.height * 0.05}
            width={preview.table.width * 0.7}
            height={preview.table.height * 0.15}
            rx={preview.table.rx * 0.5}
            ry={preview.table.ry * 0.5}
            fill="none"
            stroke="#2A2E52"
            strokeWidth={Math.max(2, preview.table.width * 0.004)}
            opacity={0.6}
          />

          {/* Decorative lines */}
          <line
            x1={preview.table.x + preview.table.width * 0.05}
            y1={preview.table.y + preview.table.height * 0.25}
            x2={preview.table.x + preview.table.width * 0.95}
            y2={preview.table.y + preview.table.height * 0.25}
            stroke="#2A2E52"
            strokeWidth={Math.max(1, preview.table.width * 0.003)}
            opacity={0.4}
          />
          <line
            x1={preview.table.x + preview.table.width * 0.05}
            y1={preview.table.y + preview.table.height * 0.82}
            x2={preview.table.x + preview.table.width * 0.95}
            y2={preview.table.y + preview.table.height * 0.82}
            stroke="#2A2E52"
            strokeWidth={Math.max(1, preview.table.width * 0.003)}
            opacity={0.4}
          />

          {/* Title Text */}
          <text
            x={preview.table.centerX}
            y={preview.table.y + preview.table.height * 0.13}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#74BEFF"
            fontSize={preview.fontSize.title}
            fontFamily="Tahoma, sans-serif"
            fontWeight="bold"
          >
            {displayContent.title || content.groupName}
          </text>

          {/* Content Text - Multiple lines */}
          <text
            x={preview.table.centerX}
            textAnchor="middle"
            fill="#74BEFF"
            fontSize={preview.fontSize.content}
            fontFamily="Tahoma, sans-serif"
            fontWeight="bold"
          >
            {displayContent.contentLines.slice(0, 4).map((line, index) => {
              const totalLines = Math.min(displayContent.contentLines.length, 4);
              const lineHeight = preview.fontSize.content * 1.3;
              const contentAreaCenter = preview.table.y + preview.table.height * 0.53;
              const startY = contentAreaCenter - ((totalLines - 1) * lineHeight) / 2;
              return (
                <tspan
                  key={index}
                  x={preview.table.centerX}
                  y={startY + index * lineHeight}
                >
                  {line.length > 35 ? line.substring(0, 35) + "..." : line}
                </tspan>
              );
            })}
          </text>

          {/* Description Text */}
          <text
            x={preview.table.centerX}
            y={preview.table.y + preview.table.height * 0.92}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#74BEFF"
            fontSize={preview.fontSize.desc}
            fontFamily="Tahoma, sans-serif"
            fontWeight="bold"
          >
            {displayContent.description}
          </text>

          {/* Side indicator in SVG */}
          <rect
            x={side === "left" ? 20 : width - 80}
            y={20}
            width={60}
            height={24}
            rx={4}
            fill="rgba(255,255,255,0.9)"
          />
          <text
            x={side === "left" ? 50 : width - 50}
            y={32}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#000"
            fontSize={14}
            fontWeight="500"
          >
            {side === "left" ? t("tabelka.left") : t("tabelka.right")}
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
