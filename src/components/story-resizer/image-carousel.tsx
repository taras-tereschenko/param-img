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
  onPrev?: () => void;
  onNext?: () => void;
  canScrollPrev?: boolean;
  canScrollNext?: boolean;
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
  onPrev,
  onNext,
  canScrollPrev,
  canScrollNext,
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
          className="absolute inset-0 h-full w-full"
        />
        {/* Overlay buttons - separated to prevent misclicks */}
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
        {/* Navigation buttons - only show when can scroll in that direction */}
        {onPrev && canScrollPrev && (
          <Button
            size="icon-sm"
            variant="secondary"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
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
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
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
});

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
          <EmptyTitle>
            {isOnlyItem ? "Drop images here" : "Add more"}
          </EmptyTitle>
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
  blurPercent,
  scale,
  borderRadius,
  onFilesAdded,
  onRemoveImage,
  onDownloadImage,
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
      className="flex h-full flex-col py-4"
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
                    blurPercent={blurPercent}
                    scale={scale}
                    borderRadius={borderRadius}
                    onRemove={() => onRemoveImage(image.id)}
                    onDownload={() => onDownloadImage(image)}
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

    </div>
  );
}
