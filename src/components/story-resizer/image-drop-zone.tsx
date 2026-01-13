import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, CloudUploadIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageDropZone({ onFilesAdded, disabled }: ImageDropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={cn(
            "rounded-full p-4 transition-colors",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}
        >
          <HugeiconsIcon
            icon={isDragActive ? CloudUploadIcon : Image01Icon}
            strokeWidth={1.5}
            className={cn(
              "size-8",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop your images here"
              : "Drag and drop images here"}
          </p>
          <p className="text-xs text-muted-foreground">
            Supports JPEG, PNG, and WebP
          </p>
        </div>

        <Button type="button" variant="outline" onClick={open} disabled={disabled}>
          Browse Files
        </Button>
      </div>
    </div>
  );
}
