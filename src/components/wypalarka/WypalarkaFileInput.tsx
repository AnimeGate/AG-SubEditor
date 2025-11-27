import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DropZone } from "@/components/ui/drop-zone";
import { Film, FileText, FolderOutput } from "lucide-react";
import { useTranslation } from "react-i18next";
import { debugLog } from "@/helpers/debug-logger";
import { getDroppedFilePaths, getFileName } from "@/lib/drop-helpers";
import { WypalarkaOutputConflictDialog } from "./WypalarkaOutputConflictDialog";

interface WypalarkaFileInputProps {
  onFilesSelected: (video: string, subtitle: string, output: string) => void;
  disabled?: boolean;
  onVideoPathChange?: (path: string | null) => void;
  onOutputPathChange?: (path: string | null) => void;
}

export function WypalarkaFileInput({
  onFilesSelected,
  disabled,
  onVideoPathChange,
  onOutputPathChange,
}: WypalarkaFileInputProps) {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  // Notify parent of video path changes
  useEffect(() => {
    onVideoPathChange?.(videoFile?.path ?? null);
  }, [videoFile, onVideoPathChange]);

  // Notify parent of output path changes
  useEffect(() => {
    onOutputPathChange?.(outputPath);
  }, [outputPath, onOutputPathChange]);

  // Recompute output when output defaults change while a video is already selected
  useEffect(() => {
    const unsubscribe = (window as any).settingsAPI?.onOutputUpdated?.(
      async () => {
        if (videoFile) {
          try {
            const resolved = await window.ffmpegAPI.getDefaultOutputPath(
              videoFile.path,
            );
            setOutputPath(resolved || null);
          } catch {}
        }
      },
    );
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [videoFile]);

  const handleSelectVideo = async () => {
    const result = await window.ffmpegAPI.selectVideoFile();
    if (result) {
      debugLog.file(`Selected video file: ${result.fileName}`);
      debugLog.file(`Video path: ${result.filePath}`);
      setVideoFile({ path: result.filePath, name: result.fileName });
      // Resolve absolute default output path via main process (settings-aware)
      try {
        const resolved = await window.ffmpegAPI.getDefaultOutputPath(
          result.filePath,
        );
        setOutputPath(resolved || null);
      } catch {
        const baseName = result.fileName.replace(/\.[^.]+$/, "");
        setOutputPath(`${baseName}_with_subs.mp4`);
      }
    }
  };

  const handleSelectSubtitle = async () => {
    const result = await window.ffmpegAPI.selectSubtitleFile();
    if (result) {
      debugLog.file(`Selected subtitle file: ${result.fileName}`);
      debugLog.file(`Subtitle path: ${result.filePath}`);
      setSubtitleFile({ path: result.filePath, name: result.fileName });
    }
  };

  const handleSelectOutput = async () => {
    if (!outputPath) return;
    const result = await window.ffmpegAPI.selectOutputPath(outputPath);
    if (result) {
      debugLog.file(`Output path selected: ${result}`);
      setOutputPath(result);
    }
  };

  const handleVideoDrop = async (files: File[]) => {
    const paths = getDroppedFilePaths(files);
    if (paths.length > 0) {
      const filePath = paths[0];
      const fileName = getFileName(filePath);
      debugLog.file(`Dropped video file: ${fileName}`);
      debugLog.file(`Video path: ${filePath}`);
      setVideoFile({ path: filePath, name: fileName });
      // Resolve absolute default output path via main process (settings-aware)
      try {
        const resolved =
          await window.ffmpegAPI.getDefaultOutputPath(filePath);
        setOutputPath(resolved || null);
      } catch {
        const baseName = fileName.replace(/\.[^.]+$/, "");
        setOutputPath(`${baseName}_with_subs.mp4`);
      }
    }
  };

  const handleSubtitleDrop = (files: File[]) => {
    const paths = getDroppedFilePaths(files);
    if (paths.length > 0) {
      const filePath = paths[0];
      const fileName = getFileName(filePath);
      debugLog.file(`Dropped subtitle file: ${fileName}`);
      debugLog.file(`Subtitle path: ${filePath}`);
      setSubtitleFile({ path: filePath, name: fileName });
    }
  };

  const handleProcess = async () => {
    if (videoFile && subtitleFile && outputPath) {
      // Check if output file already exists
      try {
        const exists = await window.ffmpegAPI.checkOutputExists(outputPath);
        if (exists) {
          debugLog.file(`Output file already exists: ${outputPath}`);
          setConflictDialogOpen(true);
          return;
        }
      } catch (error) {
        debugLog.error(`Failed to check output file existence: ${error}`);
        // Continue with processing if check fails
      }

      startProcessing();
    }
  };

  const startProcessing = () => {
    if (videoFile && subtitleFile && outputPath) {
      debugLog.ffmpeg(`Starting single file burn: ${videoFile.name}`);
      debugLog.ffmpeg(`Video: ${videoFile.path}`);
      debugLog.ffmpeg(`Subtitle: ${subtitleFile.path}`);
      debugLog.ffmpeg(`Output: ${outputPath}`);
      onFilesSelected(videoFile.path, subtitleFile.path, outputPath);
    }
  };

  const handleConflictOverwrite = () => {
    setConflictDialogOpen(false);
    debugLog.file(`User chose to overwrite existing file: ${outputPath}`);
    startProcessing();
  };

  const handleConflictAutoRename = async () => {
    if (!outputPath) return;
    try {
      const newPath = await window.ffmpegAPI.resolveOutputConflict(outputPath);
      debugLog.file(`Auto-renamed output to: ${newPath}`);
      setOutputPath(newPath);
      setConflictDialogOpen(false);
      // Start processing with new path
      if (videoFile && subtitleFile) {
        debugLog.ffmpeg(`Starting single file burn: ${videoFile.name}`);
        debugLog.ffmpeg(`Video: ${videoFile.path}`);
        debugLog.ffmpeg(`Subtitle: ${subtitleFile.path}`);
        debugLog.ffmpeg(`Output: ${newPath}`);
        onFilesSelected(videoFile.path, subtitleFile.path, newPath);
      }
    } catch (error) {
      debugLog.error(`Failed to auto-rename output: ${error}`);
    }
  };

  const handleConflictChooseNew = async () => {
    setConflictDialogOpen(false);
    if (!outputPath) return;
    const result = await window.ffmpegAPI.selectOutputPath(outputPath);
    if (result) {
      debugLog.file(`User chose new output path: ${result}`);
      setOutputPath(result);
      // Don't start automatically, let user click the button again
    }
  };

  const handleConflictCancel = () => {
    setConflictDialogOpen(false);
    debugLog.file(`User cancelled conflict resolution`);
  };

  const isReadyToProcess = videoFile && subtitleFile && outputPath;

  return (
    <div className="space-y-4">
      <DropZone
        onDrop={handleVideoDrop}
        accept={[".mp4", ".mkv", ".avi", ".mov", ".webm", ".m4v", ".wmv", ".flv"]}
        disabled={disabled}
        className="rounded-lg"
        activeClassName="ring-2 ring-primary ring-offset-2 ring-offset-background"
      >
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
              <Film className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={videoFile?.path}>
                {videoFile ? videoFile.name : t("wypalarkaSelectVideo")}
              </span>
            </Button>
            {videoFile && (
              <p
                className="text-muted-foreground truncate text-xs"
                title={videoFile.path}
              >
                {videoFile.path}
              </p>
            )}
            {!videoFile && (
              <p className="text-muted-foreground text-center text-xs">
                {t("wypalarkaDropHint")}
              </p>
            )}
          </CardContent>
        </Card>
      </DropZone>

      <DropZone
        onDrop={handleSubtitleDrop}
        accept={[".ass", ".srt", ".ssa", ".sub", ".vtt"]}
        disabled={disabled}
        className="rounded-lg"
        activeClassName="ring-2 ring-primary ring-offset-2 ring-offset-background"
      >
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
              <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={subtitleFile?.path}>
                {subtitleFile ? subtitleFile.name : t("wypalarkaSelectSubtitle")}
              </span>
            </Button>
            {subtitleFile && (
              <p
                className="text-muted-foreground truncate text-xs"
                title={subtitleFile.path}
              >
                {subtitleFile.path}
              </p>
            )}
            {!subtitleFile && (
              <p className="text-muted-foreground text-center text-xs">
                {t("wypalarkaDropHint")}
              </p>
            )}
          </CardContent>
        </Card>
      </DropZone>

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
            <FolderOutput className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate" title={outputPath || undefined}>
              {outputPath
                ? outputPath.split(/[\\/]/).pop() || outputPath
                : t("wypalarkaSelectOutput")}
            </span>
          </Button>
          {outputPath && (
            <p
              className="text-muted-foreground truncate text-xs"
              title={outputPath}
            >
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

      {/* Output Conflict Dialog */}
      <WypalarkaOutputConflictDialog
        open={conflictDialogOpen}
        outputPath={outputPath || ""}
        onOverwrite={handleConflictOverwrite}
        onAutoRename={handleConflictAutoRename}
        onChooseNew={handleConflictChooseNew}
        onCancel={handleConflictCancel}
      />
    </div>
  );
}
