import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, FileText, FolderOutput } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WypalarkaFileInputProps {
  onFilesSelected: (video: string, subtitle: string, output: string) => void;
  disabled?: boolean;
}

export function WypalarkaFileInput({ onFilesSelected, disabled }: WypalarkaFileInputProps) {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<{ path: string; name: string } | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<{ path: string; name: string } | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const handleSelectVideo = async () => {
    const result = await window.ffmpegAPI.selectVideoFile();
    if (result) {
      setVideoFile({ path: result.filePath, name: result.fileName });
      // Auto-generate output filename based on video name
      const baseName = result.fileName.replace(/\.[^.]+$/, "");
      setOutputPath(`${baseName}_with_subs.mp4`);
    }
  };

  const handleSelectSubtitle = async () => {
    const result = await window.ffmpegAPI.selectSubtitleFile();
    if (result) {
      setSubtitleFile({ path: result.filePath, name: result.fileName });
    }
  };

  const handleSelectOutput = async () => {
    if (!outputPath) return;
    const result = await window.ffmpegAPI.selectOutputPath(outputPath);
    if (result) {
      setOutputPath(result);
    }
  };

  const handleProcess = () => {
    if (videoFile && subtitleFile && outputPath) {
      onFilesSelected(videoFile.path, subtitleFile.path, outputPath);
    }
  };

  const isReadyToProcess = videoFile && subtitleFile && outputPath;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            {t("wypalarkaVideoFile")}
          </CardTitle>
          <CardDescription>{t("wypalarkaVideoFileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSelectVideo}
            disabled={disabled}
            variant="outline"
            className="w-full justify-start overflow-hidden"
          >
            <Film className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate" title={videoFile?.path}>
              {videoFile ? videoFile.name : t("wypalarkaSelectVideo")}
            </span>
          </Button>
          {videoFile && (
            <p className="text-xs text-muted-foreground truncate" title={videoFile.path}>
              {videoFile.path}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("wypalarkaSubtitleFile")}
          </CardTitle>
          <CardDescription>{t("wypalarkaSubtitleFileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSelectSubtitle}
            disabled={disabled}
            variant="outline"
            className="w-full justify-start overflow-hidden"
          >
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate" title={subtitleFile?.path}>
              {subtitleFile ? subtitleFile.name : t("wypalarkaSelectSubtitle")}
            </span>
          </Button>
          {subtitleFile && (
            <p className="text-xs text-muted-foreground truncate" title={subtitleFile.path}>
              {subtitleFile.path}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOutput className="h-5 w-5" />
            {t("wypalarkaOutputFile")}
          </CardTitle>
          <CardDescription>{t("wypalarkaOutputFileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSelectOutput}
            disabled={disabled || !outputPath}
            variant="outline"
            className="w-full justify-start overflow-hidden"
          >
            <FolderOutput className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate" title={outputPath || undefined}>
              {outputPath ? outputPath.split(/[\\/]/).pop() || outputPath : t("wypalarkaSelectOutput")}
            </span>
          </Button>
          {outputPath && (
            <p className="text-xs text-muted-foreground truncate" title={outputPath}>
              {outputPath}
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleProcess}
        disabled={!isReadyToProcess || disabled}
        className="w-full"
        size="lg"
      >
        {t("wypalarkaStartProcess")}
      </Button>
    </div>
  );
}
