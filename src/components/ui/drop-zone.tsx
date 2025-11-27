import { useCallback, useState } from "react";
import { cn } from "@/utils/tailwind";

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string[]; // File extensions: [".mp4", ".mkv", ".ass"]
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  activeClassName?: string;
}

export function DropZone({
  onDrop,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
  activeClassName = "border-primary bg-primary/5",
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      // Check if files are being dragged (not text, etc.)
      if (e.dataTransfer.types.includes("Files")) {
        setIsDragOver(true);
        e.dataTransfer.dropEffect = "copy";
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set false if leaving the drop zone entirely
    // (not entering a child element)
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);

      // Filter by accepted extensions if specified
      let filteredFiles = files;
      if (accept && accept.length > 0) {
        filteredFiles = files.filter((file) => {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          return accept.includes(ext);
        });
      }

      // Respect multiple flag
      if (!multiple && filteredFiles.length > 1) {
        filteredFiles = [filteredFiles[0]];
      }

      if (filteredFiles.length > 0) {
        onDrop(filteredFiles);
      }
    },
    [onDrop, accept, multiple, disabled],
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "transition-colors duration-200",
        isDragOver && activeClassName,
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </div>
  );
}
