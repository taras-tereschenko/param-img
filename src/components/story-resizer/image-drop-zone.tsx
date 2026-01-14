import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { HugeiconsIcon } from "@hugeicons/react";
import { CloudUploadIcon, Image01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface ImageDropZoneProps {
  onFilesAdded: (files: Array<File>) => void;
  disabled?: boolean;
}

export function ImageDropZone({ onFilesAdded, disabled }: ImageDropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded],
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
    <Empty
      {...getRootProps()}
      className={cn(
        "relative min-h-[200px] rounded-xl border-2 p-8 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input {...getInputProps()} />

      <EmptyHeader>
        <EmptyMedia
          className={cn(
            "size-16 rounded-full",
            isDragActive ? "bg-primary/10" : "bg-muted",
          )}
        >
          <HugeiconsIcon
            icon={isDragActive ? CloudUploadIcon : Image01Icon}
            strokeWidth={1.5}
            className={cn(
              "size-8",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
        </EmptyMedia>
        <EmptyTitle>
          {isDragActive ? "Drop your images here" : "Drag and drop images here"}
        </EmptyTitle>
        <EmptyDescription>Supports JPEG, PNG, and WebP</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Button
          type="button"
          variant="outline"
          onClick={open}
          disabled={disabled}
        >
          Browse Files
        </Button>
      </EmptyContent>
    </Empty>
  );
}
