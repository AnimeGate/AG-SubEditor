import type React from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import packageJson from "../../../package.json";

interface FileUploadSectionProps {
  fileName: string;
  totalLines: number;
  onFileUpload: (file: File) => void;
  onExport: () => void;
  hasFile: boolean;
}

export function FileUploadSection({
  fileName,
  totalLines,
  onFileUpload,
  onExport,
  hasFile,
}: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="border-b bg-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ass"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-5 w-5" />
            {t("importFile")}
          </Button>

          {fileName && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fileName}</span>
              <span className="text-muted-foreground">
                ({totalLines} {t("lines")})
              </span>
            </div>
          )}

          <Badge variant="secondary" className="text-xs font-mono">
            v{packageJson.version}
          </Badge>
        </div>

        <Button
          size="lg"
          variant="default"
          onClick={onExport}
          disabled={!hasFile}
          className="gap-2"
        >
          <Download className="h-5 w-5" />
          {t("exportFile")}
        </Button>
      </div>
    </div>
  );
}
