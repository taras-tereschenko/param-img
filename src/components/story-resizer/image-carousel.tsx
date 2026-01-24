import { memo, useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CloudUploadIcon,
  Delete02Icon,
  DownloadCircle02Icon,
} from "@hugeicons/core-free-icons";
import { CSSPreview } from "./css-preview";
import { EnhanceButton } from "./enhance-button";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  ProcessedImage,
} from "@/lib/types";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: Array<ProcessedImage>;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  scale: number;
  borderRadius: BorderRadiusOption;
  onFilesAdded: (files: Array<File>) => void;
  onRemoveImage: (id: string) => void;
  onDownloadImage: (image: ProcessedImage) => void;
  onEnhanceImage: (image: ProcessedImage) => void;
}

interface PreviewItemProps {
  image: ProcessedImage;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  scale: number;
  borderRadius: BorderRadiusOption;
  onRemove: () => void;
  onDownload: () => void;
  onEnhance: () => void;
}

const PreviewItem = memo(function PreviewItem({
  image,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurPercent,
  scale,
  borderRadius,
  onRemove,
  onDownload,
  onEnhance,
}: PreviewItemProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative aspect-[9/21] h-full max-w-full overflow-hidden rounded-lg border">
        {/* GPU-accelerated CSS preview */}
        <CSSPreview
          imageUrl={image.originalDataUrl}
          naturalWidth={image.naturalWidth}
          naturalHeight={image.naturalHeight}
          background={background}
          customColor={customColor}
          ambientBase={ambientBase}
          ambientCustomColor={ambientCustomColor}
          blurPercent={blurPercent}
          scale={scale}
          borderRadius={borderRadius}
          enhancements={image.enhancements}
          className="absolute inset-0 h-full w-full"
        />
        {/* Top overlay buttons */}
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute left-2 top-2 z-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Remove</span>
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute right-2 top-2 z-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onDownload}
        >
          <HugeiconsIcon icon={DownloadCircle02Icon} strokeWidth={2} />
          <span className="sr-only">Download</span>
        </Button>

        {/* Bottom overlay - Enhancement button */}
        <div className="absolute bottom-2 right-2 z-10">
          <EnhanceButton image={image} onEnhance={onEnhance} />
        </div>
      </div>
    </div>
  );
});

interface AddMoreItemProps {
  onFilesAdded: (files: Array<File>) => void;
  isOnlyItem: boolean;
}

function AddMoreItem({ onFilesAdded, isOnlyItem }: AddMoreItemProps) {
  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    multiple: true,
  });

  return (
    <Empty
      {...getRootProps()}
      className={cn(
        "h-full cursor-pointer rounded-2xl border-2 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
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
            icon={isOnlyItem ? CloudUploadIcon : Add01Icon}
            strokeWidth={1.5}
            className={cn(
              "size-8",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
        </EmptyMedia>
        <EmptyTitle>{isOnlyItem ? "Drop images here" : "Add more"}</EmptyTitle>
        <EmptyDescription>
          {isOnlyItem ? "or tap to select" : "Tap to select more images"}
        </EmptyDescription>
      </EmptyHeader>
      {isOnlyItem && (
        <EmptyContent>
          <Button variant="outline">Select Images</Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export function ImageCarousel({
  images,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurPercent,
  scale,
  borderRadius,
  onFilesAdded,
  onRemoveImage,
  onDownloadImage,
  onEnhanceImage,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateCount = () => setCount(api.scrollSnapList().length);

    updateCount();
    api.on("reInit", updateCount);

    return () => {
      api.off("reInit", updateCount);
    };
  }, [api, images.length]);

  const hasImages = images.length > 0;

  // Empty state - show full-size dropzone
  if (!hasImages) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="min-h-0 flex-1">
          <AddMoreItem onFilesAdded={onFilesAdded} isOnlyItem={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col py-4">
      {/* Wrapper to center carousel */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Carousel
          setApi={setApi}
          className="h-full"
          opts={{
            align: "center",
            containScroll: false,
          }}
        >
          <CarouselContent className="-ml-10">
            {images.map((image) => (
              <CarouselItem key={image.id} className="basis-[70%] pl-10">
                <div className="h-full">
                  <PreviewItem
                    image={image}
                    background={background}
                    customColor={customColor}
                    ambientBase={ambientBase}
                    ambientCustomColor={ambientCustomColor}
                    blurPercent={blurPercent}
                    scale={scale}
                    borderRadius={borderRadius}
                    onRemove={() => onRemoveImage(image.id)}
                    onDownload={() => onDownloadImage(image)}
                    onEnhance={() => onEnhanceImage(image)}
                  />
                </div>
              </CarouselItem>
            ))}
            {/* Add-more item at the end */}
            <CarouselItem className="basis-[70%] pl-10">
              <div className="h-full">
                <AddMoreItem onFilesAdded={onFilesAdded} isOnlyItem={false} />
              </div>
            </CarouselItem>
          </CarouselContent>
          {count > 1 && (
            <>
              <CarouselPrevious
                variant="secondary"
                className="left-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              />
              <CarouselNext
                variant="secondary"
                className="right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );
}
