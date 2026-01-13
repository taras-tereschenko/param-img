import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  CloudUploadIcon,
  Delete02Icon,
  DownloadCircle02Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";
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
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { processImageForStory } from "@/lib/canvas-utils";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: Array<ProcessedImage>;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  scale: number;
  borderRadius: BorderRadiusOption;
  onFilesAdded: (files: Array<File>) => void;
  onRemoveImage: (id: string) => void;
  onDownloadImage: (processedUrl: string, filename: string) => void;
}

interface PreviewItemProps {
  image: ProcessedImage;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  scale: number;
  borderRadius: BorderRadiusOption;
  onRemove: () => void;
  onDownload: (processedUrl: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
}

function PreviewItem({
  image,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  scale,
  borderRadius,
  onRemove,
  onDownload,
  onPrev,
  onNext,
  canScrollPrev,
  canScrollNext,
}: PreviewItemProps) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function process() {
      setIsProcessing(true);
      try {
        const result = await processImageForStory(
          image.originalDataUrl,
          background,
          customColor,
          scale,
          ambientBase,
          ambientCustomColor,
          blurRadius,
          borderRadius,
        );
        if (!cancelled) {
          setProcessedUrl(result);
        }
      } catch (error) {
        console.error("Failed to process image:", error);
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }

    process();

    return () => {
      cancelled = true;
    };
  }, [
    image.originalDataUrl,
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurRadius,
    scale,
    borderRadius,
  ]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative aspect-[9/16] max-h-full max-w-full overflow-hidden rounded-lg border">
        {isProcessing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <HugeiconsIcon
              icon={Loading01Icon}
              strokeWidth={2}
              className="size-8 animate-spin text-muted-foreground"
            />
          </div>
        )}
        {processedUrl && (
          <img
            src={processedUrl}
            alt={`Preview of ${image.originalFile.name}`}
            className="h-full w-full object-cover"
          />
        )}
        {/* Overlay buttons - separated to prevent misclicks */}
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute left-2 top-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Remove</span>
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute right-2 top-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => processedUrl && onDownload(processedUrl)}
          disabled={!processedUrl || isProcessing}
        >
          <HugeiconsIcon icon={DownloadCircle02Icon} strokeWidth={2} />
          <span className="sr-only">Download</span>
        </Button>
        {/* Navigation buttons - only show when can scroll in that direction */}
        {onPrev && canScrollPrev && (
          <Button
            size="icon-sm"
            variant="secondary"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={onPrev}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="sr-only">Previous</span>
          </Button>
        )}
        {onNext && canScrollNext && (
          <Button
            size="icon-sm"
            variant="secondary"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={onNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="sr-only">Next</span>
          </Button>
        )}
      </div>
    </div>
  );
}

interface AddMoreItemProps {
  onFilesAdded: (files: Array<File>) => void;
  isOnlyItem: boolean;
  onPrev?: () => void;
  canScrollPrev?: boolean;
}

function AddMoreItem({
  onFilesAdded,
  isOnlyItem,
  onPrev,
  canScrollPrev,
}: AddMoreItemProps) {
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
    <div className="relative h-full">
      <div
        {...getRootProps()}
        className={cn(
          "flex h-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-full",
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
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {isOnlyItem ? "Drop images here" : "Add more"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isOnlyItem ? "or tap to select" : "Tap to select more images"}
            </p>
          </div>
          {isOnlyItem && (
            <Button variant="outline" className="mt-2">
              Select Images
            </Button>
          )}
        </div>
      </div>
      {/* Navigation button - only show when can scroll */}
      {onPrev && canScrollPrev && (
        <Button
          size="icon-sm"
          variant="secondary"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="sr-only">Previous</span>
        </Button>
      )}
    </div>
  );
}

export function ImageCarousel({
  images,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  scale,
  borderRadius,
  onFilesAdded,
  onRemoveImage,
  onDownloadImage,
}: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Scroll to the add-more item when new images are added
  useEffect(() => {
    if (api && images.length > 0) {
      // Scroll to the last image (before the add-more item)
      api.scrollTo(images.length - 1);
    }
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
    <div
      className={cn("flex h-full flex-col pt-4", count > 1 ? "pb-0" : "pb-4")}
    >
      {/* Wrapper to center carousel */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Carousel
          setApi={setApi}
          className="h-full"
          opts={{
            align: "center",
          }}
        >
          <CarouselContent className="-ml-0">
            {images.map((image) => (
              <CarouselItem key={image.id} className="pl-0">
                <div className="h-full px-4">
                  <PreviewItem
                    image={image}
                    background={background}
                    customColor={customColor}
                    ambientBase={ambientBase}
                    ambientCustomColor={ambientCustomColor}
                    blurRadius={blurRadius}
                    scale={scale}
                    borderRadius={borderRadius}
                    onRemove={() => onRemoveImage(image.id)}
                    onDownload={(url) =>
                      onDownloadImage(url, image.originalFile.name)
                    }
                    onPrev={count > 1 ? () => api?.scrollPrev() : undefined}
                    onNext={count > 1 ? () => api?.scrollNext() : undefined}
                    canScrollPrev={api?.canScrollPrev() ?? false}
                    canScrollNext={api?.canScrollNext() ?? false}
                  />
                </div>
              </CarouselItem>
            ))}
            {/* Add-more item at the end */}
            <CarouselItem className="pl-0">
              <div className="h-full px-4">
                <AddMoreItem
                  onFilesAdded={onFilesAdded}
                  isOnlyItem={false}
                  onPrev={count > 1 ? () => api?.scrollPrev() : undefined}
                  canScrollPrev={api?.canScrollPrev() ?? false}
                />
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "size-2 rounded-full transition-all",
                current === index
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
            >
              <span className="sr-only">Go to slide {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
