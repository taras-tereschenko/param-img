import { useCallback, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DownloadIcon,
  ScanImageIcon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { ImageCarousel } from "./image-carousel";
import { ActionBar } from "./action-bar";
import { BlurPanel } from "./blur-panel";
import { AmbientPanel } from "./ambient-panel";
import { ColorPanel } from "./color-panel";
import { ResizePanel } from "./resize-panel";
import {
  prepareProcessedImages,
  useImageExport,
  useImagePersistence,
  usePanelNavigation,
  useSharedFiles,
  useStoryResizerState,
} from "./hooks";
import { useEnhance } from "./hooks/use-enhance";
import { useInstallPrompt } from "@/components/pwa/pwa-provider";
import { useCredits } from "@/hooks/use-credits";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function StoryResizer() {
  const { triggerShow } = useInstallPrompt();
  const { activeSheet, openPanel, closePanel } = usePanelNavigation();
  const { refetch: refetchCredits } = useCredits();

  const {
    images,
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurPercent,
    ambientBlurPercent,
    scale,
    borderRadius,
    activeBlurPercent,
    hasImages,
    activeAction,
    colorSheetSelection,
    addImages,
    removeImage,
    setBackground,
    setCustomColor,
    setAmbientBase,
    setAmbientCustomColor,
    setBlurPercent,
    setAmbientBlurPercent,
    setScale,
    setBorderRadius,
    // Enhancement actions
    setEnhancementStatus,
    addEnhancedImage,
  } = useStoryResizerState();

  // Enhancement functionality
  const { enhanceImage } = useEnhance({
    onStatusChange: setEnhancementStatus,
    onEnhancedImageCreated: (sourceId, enhancedImage) => {
      addEnhancedImage(sourceId, enhancedImage);
    },
    onCreditsUsed: refetchCredits,
  });

  // Persistence and shared files
  useImagePersistence({ images, onImagesLoaded: addImages });
  useSharedFiles({
    onFilesReceived: addImages,
    onShowInstallPrompt: triggerShow,
  });

  // Export functionality
  const {
    isDownloading,
    downloadProgress,
    isSharing,
    canShare,
    handleDownload,
    handleDownloadImage,
    handleShare,
  } = useImageExport(images, {
    background,
    customColor,
    scale,
    ambientBase,
    ambientCustomColor,
    activeBlurPercent,
    borderRadius,
  });

  // Close panel if no images
  useEffect(() => {
    if (images.length === 0 && activeSheet) {
      closePanel();
    }
  }, [images.length, activeSheet, closePanel]);

  // File handling
  const handleFilesAdded = useCallback(
    async (files: Array<File>) => {
      const newImages = await prepareProcessedImages(files);
      addImages(newImages);
      triggerShow();
    },
    [addImages, triggerShow],
  );

  // Action bar click handler
  const handleActionClick = useCallback(
    (action: "blur" | "ambient" | "color" | "resize") => {
      openPanel(action);
      if (action === "blur") {
        setBackground("blur");
      } else if (action === "ambient") {
        setBackground("ambient");
      } else if (action === "color") {
        if (
          background !== "black" &&
          background !== "white" &&
          background !== "custom"
        ) {
          setBackground("black");
        }
      }
    },
    [background, openPanel, setBackground],
  );

  // Blur panel handlers
  const handleBlurPercentChange = useCallback(
    (percent: number) => {
      setBlurPercent(percent);
      setBackground("blur");
    },
    [setBlurPercent, setBackground],
  );

  // Ambient handlers
  const handleAmbientBaseChange = useCallback(
    (base: "black" | "white" | "custom") => {
      setAmbientBase(base);
      setBackground("ambient");
    },
    [setAmbientBase, setBackground],
  );

  const handleAmbientCustomColorChange = useCallback(
    (color: string | null) => {
      setAmbientCustomColor(color);
      setBackground("ambient");
    },
    [setAmbientCustomColor, setBackground],
  );

  const handleAmbientBlurPercentChange = useCallback(
    (percent: number) => {
      setAmbientBlurPercent(percent);
      setBackground("ambient");
    },
    [setAmbientBlurPercent, setBackground],
  );

  // Color handlers
  const handleColorSelect = useCallback(
    (color: "black" | "white" | "custom") => {
      setBackground(color);
    },
    [setBackground],
  );

  const handleCustomColorChange = useCallback(
    (color: string) => {
      setCustomColor(color);
      setBackground("custom");
    },
    [setCustomColor, setBackground],
  );

  return (
    <div className="flex h-svh flex-col items-center justify-center bg-muted/30 md:p-8">
      {/* Centered container for desktop */}
      <div className="flex h-full w-full flex-col bg-background shadow-none md:aspect-[1/2] md:w-auto md:overflow-hidden md:rounded-2xl md:shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <HugeiconsIcon
              icon={ScanImageIcon}
              strokeWidth={2}
              className="size-5"
            />
            Param Img
          </h1>
          {hasImages && (
            <div className="flex items-center gap-2">
              {canShare && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={handleShare}
                  disabled={isSharing || isDownloading}
                >
                  {isSharing ? (
                    <Spinner />
                  ) : (
                    <HugeiconsIcon icon={Share08Icon} strokeWidth={2} />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || isSharing}
                className="relative overflow-hidden"
              >
                {isDownloading && (
                  <Progress
                    value={downloadProgress}
                    className="absolute inset-0 flex-nowrap gap-0"
                  >
                    <ProgressTrack className="absolute inset-0 h-full rounded-none bg-transparent">
                      <ProgressIndicator className="bg-primary-foreground/20" />
                    </ProgressTrack>
                  </Progress>
                )}
                {isDownloading ? (
                  <Spinner className="relative z-10" />
                ) : (
                  <HugeiconsIcon
                    icon={DownloadIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                )}
                <span className={isDownloading ? "relative z-10" : undefined}>
                  {isDownloading
                    ? `${Math.round(downloadProgress)}%`
                    : `Export (${images.length})`}
                </span>
              </Button>
            </div>
          )}
        </header>

        {/* Main carousel area */}
        <main className="min-h-0 flex-1 overflow-hidden">
          <ImageCarousel
            images={images}
            background={background}
            customColor={customColor}
            ambientBase={ambientBase}
            ambientCustomColor={ambientCustomColor}
            blurPercent={activeBlurPercent}
            scale={scale}
            borderRadius={borderRadius}
            onFilesAdded={handleFilesAdded}
            onRemoveImage={removeImage}
            onDownloadImage={handleDownloadImage}
            onEnhanceImage={enhanceImage}
          />
        </main>

        {/* Bottom panel area */}
        <footer className="border-t bg-background">
          {!activeSheet ? (
            <ActionBar
              disabled={!hasImages}
              activeAction={activeAction}
              onActionClick={handleActionClick}
            />
          ) : activeSheet === "blur" ? (
            <BlurPanel
              blurPercent={blurPercent}
              onBlurPercentChange={handleBlurPercentChange}
              onBack={closePanel}
            />
          ) : activeSheet === "ambient" ? (
            <AmbientPanel
              ambientBase={ambientBase}
              ambientCustomColor={ambientCustomColor}
              blurPercent={ambientBlurPercent}
              onAmbientBaseChange={handleAmbientBaseChange}
              onAmbientCustomColorChange={handleAmbientCustomColorChange}
              onBlurPercentChange={handleAmbientBlurPercentChange}
              onBack={closePanel}
            />
          ) : activeSheet === "color" ? (
            <ColorPanel
              selectedColor={colorSheetSelection}
              customColor={customColor}
              onColorSelect={handleColorSelect}
              onCustomColorChange={handleCustomColorChange}
              onBack={closePanel}
            />
          ) : (
            <ResizePanel
              scale={scale}
              onScaleChange={setScale}
              borderRadius={borderRadius}
              onBorderRadiusChange={setBorderRadius}
              onBack={closePanel}
            />
          )}
        </footer>
      </div>
    </div>
  );
}
