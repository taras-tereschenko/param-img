import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { DownloadIcon } from "@hugeicons/core-free-icons";
import { Spinner } from "@/components/ui/spinner";
import { ImageCarousel } from "./image-carousel";
import { ActionBar } from "./action-bar";
import { BlurPanel } from "./blur-panel";
import { AmbientPanel } from "./ambient-panel";
import { ColorPanel } from "./color-panel";
import { ResizePanel } from "./resize-panel";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  ProcessedImage,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import {
  DEFAULT_AMBIENT_BLUR_RADIUS,
  DEFAULT_BLUR_RADIUS,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_SCALE,
} from "@/lib/types";
import {
  createStoryFilename,
  fileToDataUrl,
  generateImageId,
  prepareImage,
} from "@/lib/image-utils";
import { processImageForStory } from "@/lib/canvas-utils";
import { useInstallPrompt } from "@/components/pwa/pwa-provider";

interface State {
  images: Array<ProcessedImage>;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  ambientBlurRadius: number;
  scale: number;
  borderRadius: BorderRadiusOption;
}

type Action =
  | { type: "ADD_IMAGES"; images: Array<ProcessedImage> }
  | { type: "REMOVE_IMAGE"; id: string }
  | { type: "SET_BACKGROUND"; background: BackgroundType }
  | { type: "SET_CUSTOM_COLOR"; color: string | null }
  | { type: "SET_AMBIENT_BASE"; ambientBase: AmbientBaseType }
  | { type: "SET_AMBIENT_CUSTOM_COLOR"; color: string | null }
  | { type: "SET_BLUR_RADIUS"; blurRadius: number }
  | { type: "SET_AMBIENT_BLUR_RADIUS"; ambientBlurRadius: number }
  | { type: "SET_SCALE"; scale: number }
  | { type: "SET_BORDER_RADIUS"; borderRadius: BorderRadiusOption }
  | { type: "CLEAR_ALL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_IMAGES":
      return { ...state, images: [...state.images, ...action.images] };
    case "REMOVE_IMAGE":
      return {
        ...state,
        images: state.images.filter((img) => img.id !== action.id),
      };
    case "SET_BACKGROUND":
      return { ...state, background: action.background };
    case "SET_CUSTOM_COLOR":
      return { ...state, customColor: action.color };
    case "SET_AMBIENT_BASE":
      return { ...state, ambientBase: action.ambientBase };
    case "SET_AMBIENT_CUSTOM_COLOR":
      return { ...state, ambientCustomColor: action.color };
    case "SET_BLUR_RADIUS":
      return { ...state, blurRadius: action.blurRadius };
    case "SET_AMBIENT_BLUR_RADIUS":
      return { ...state, ambientBlurRadius: action.ambientBlurRadius };
    case "SET_SCALE":
      return { ...state, scale: action.scale };
    case "SET_BORDER_RADIUS":
      return { ...state, borderRadius: action.borderRadius };
    case "CLEAR_ALL":
      return {
        ...state,
        images: [],
        customColor: null,
        ambientCustomColor: null,
      };
    default:
      return state;
  }
}

const initialState: State = {
  images: [],
  background: "blur",
  customColor: null,
  ambientBase: "black",
  ambientCustomColor: null,
  blurRadius: DEFAULT_BLUR_RADIUS,
  ambientBlurRadius: DEFAULT_AMBIENT_BLUR_RADIUS,
  scale: DEFAULT_SCALE,
  borderRadius: DEFAULT_BORDER_RADIUS,
};

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function StoryResizer() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { triggerShow } = useInstallPrompt();
  const {
    images,
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurRadius,
    ambientBlurRadius,
    scale,
    borderRadius,
  } = state;

  // Get the active blur radius based on current background mode
  const activeBlurRadius =
    background === "ambient" ? ambientBlurRadius : blurRadius;

  // URL-based panel state for browser back button support
  const navigate = useNavigate();
  const { panel: activeSheet } = useSearch({ from: "/" });

  const openPanel = useCallback(
    (panel: "blur" | "ambient" | "color" | "resize") => {
      navigate({
        to: "/",
        search: { panel },
        resetScroll: false,
      });
    },
    [navigate],
  );

  const closePanel = useCallback(() => {
    navigate({
      to: "/",
      search: {},
      resetScroll: false,
    });
  }, [navigate]);

  // Close panel if no images (e.g., after page reload)
  useEffect(() => {
    if (images.length === 0 && activeSheet) {
      closePanel();
    }
  }, [images.length, activeSheet, closePanel]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Derived state for color sheet - only show custom as selected if it's actually custom
  const colorSheetSelection = useMemo(() => {
    if (background === "black") return "black";
    if (background === "white") return "white";
    if (background === "custom") return "custom";
    return "black"; // Default to black for blur/ambient modes
  }, [background]);

  const handleFilesAdded = useCallback(
    async (files: Array<File>) => {
      const newImages: Array<ProcessedImage> = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const preparedDataUrl = await prepareImage(dataUrl);

          return {
            id: generateImageId(),
            originalFile: file,
            originalDataUrl: preparedDataUrl,
            processedDataUrl: null,
            backgroundColor: "blur" as BackgroundType,
            customColor: null,
            scale: DEFAULT_SCALE,
            status: "pending" as const,
          };
        }),
      );

      dispatch({ type: "ADD_IMAGES", images: newImages });

      // Trigger install prompt after first image is added
      triggerShow();
    },
    [triggerShow],
  );

  const handleRemoveImage = useCallback((id: string) => {
    dispatch({ type: "REMOVE_IMAGE", id });
  }, []);

  const handleActionClick = useCallback(
    (action: "blur" | "ambient" | "color" | "resize") => {
      openPanel(action);
      // Set the background type when opening the panel
      if (action === "blur") {
        dispatch({ type: "SET_BACKGROUND", background: "blur" });
      } else if (action === "ambient") {
        dispatch({ type: "SET_BACKGROUND", background: "ambient" });
      } else if (action === "color") {
        // Default to black when opening color panel (unless custom color is already set)
        if (
          background !== "black" &&
          background !== "white" &&
          background !== "custom"
        ) {
          dispatch({ type: "SET_BACKGROUND", background: "black" });
        }
      }
    },
    [background, openPanel],
  );

  // Ambient handlers
  const handleAmbientBaseChange = useCallback((base: AmbientBaseType) => {
    dispatch({ type: "SET_AMBIENT_BASE", ambientBase: base });
    dispatch({ type: "SET_BACKGROUND", background: "ambient" });
  }, []);

  const handleAmbientCustomColorChange = useCallback((color: string | null) => {
    dispatch({ type: "SET_AMBIENT_CUSTOM_COLOR", color });
    dispatch({ type: "SET_BACKGROUND", background: "ambient" });
  }, []);

  const handleBlurPanelRadiusChange = useCallback((radius: number) => {
    dispatch({ type: "SET_BLUR_RADIUS", blurRadius: radius });
    dispatch({ type: "SET_BACKGROUND", background: "blur" });
  }, []);

  const handleAmbientBlurRadiusChange = useCallback((radius: number) => {
    dispatch({ type: "SET_AMBIENT_BLUR_RADIUS", ambientBlurRadius: radius });
    dispatch({ type: "SET_BACKGROUND", background: "ambient" });
  }, []);

  // Color handlers
  const handleColorSelect = useCallback(
    (color: "black" | "white" | "custom") => {
      if (color === "black") {
        dispatch({ type: "SET_BACKGROUND", background: "black" });
      } else if (color === "white") {
        dispatch({ type: "SET_BACKGROUND", background: "white" });
      } else {
        dispatch({ type: "SET_BACKGROUND", background: "custom" });
      }
    },
    [],
  );

  const handleCustomColorChange = useCallback((color: string) => {
    dispatch({ type: "SET_CUSTOM_COLOR", color });
    dispatch({ type: "SET_BACKGROUND", background: "custom" });
  }, []);

  // Scale handlers
  const handleScaleChange = useCallback((newScale: number) => {
    dispatch({ type: "SET_SCALE", scale: newScale });
  }, []);

  // Border radius handler
  const handleBorderRadiusChange = useCallback(
    (newBorderRadius: BorderRadiusOption) => {
      dispatch({ type: "SET_BORDER_RADIUS", borderRadius: newBorderRadius });
    },
    [],
  );

  // Download handler
  const handleDownload = useCallback(async () => {
    if (images.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const processedUrl = await processImageForStory(
          image.originalDataUrl,
          background,
          customColor,
          scale,
          ambientBase,
          ambientCustomColor,
          activeBlurRadius,
          borderRadius,
        );

        const filename = createStoryFilename(image.originalFile.name);
        downloadDataUrl(processedUrl, filename);

        setDownloadProgress(((i + 1) / images.length) * 100);

        if (i < images.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error("Failed to download images:", error);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [
    images,
    background,
    customColor,
    scale,
    ambientBase,
    ambientCustomColor,
    activeBlurRadius,
    borderRadius,
  ]);

  // Single image download handler
  const handleDownloadImage = useCallback(
    (processedUrl: string, originalFilename: string) => {
      const filename = createStoryFilename(originalFilename);
      downloadDataUrl(processedUrl, filename);
    },
    [],
  );

  const hasImages = images.length > 0;

  // Map background type to active action for visual feedback
  const activeAction = useMemo(() => {
    if (background === "blur") return "blur";
    if (background === "ambient") return "ambient";
    return "color"; // black, white, or custom
  }, [background]);

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-muted/30 md:p-8">
      {/* Centered container for desktop */}
      <div className="flex h-full w-full flex-col bg-background shadow-none md:aspect-[1/2] md:w-auto md:overflow-hidden md:rounded-2xl md:shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-semibold">Param Img</h1>
          {hasImages && (
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
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
                  : `Export images (${images.length})`}
              </span>
            </Button>
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
            blurRadius={activeBlurRadius}
            scale={scale}
            borderRadius={borderRadius}
            onFilesAdded={handleFilesAdded}
            onRemoveImage={handleRemoveImage}
            onDownloadImage={handleDownloadImage}
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
              blurRadius={blurRadius}
              onBlurRadiusChange={handleBlurPanelRadiusChange}
              onBack={closePanel}
            />
          ) : activeSheet === "ambient" ? (
            <AmbientPanel
              ambientBase={ambientBase}
              ambientCustomColor={ambientCustomColor}
              blurRadius={ambientBlurRadius}
              onAmbientBaseChange={handleAmbientBaseChange}
              onAmbientCustomColorChange={handleAmbientCustomColorChange}
              onBlurRadiusChange={handleAmbientBlurRadiusChange}
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
              onScaleChange={handleScaleChange}
              borderRadius={borderRadius}
              onBorderRadiusChange={handleBorderRadiusChange}
              onBack={closePanel}
            />
          )}
        </footer>
      </div>
    </div>
  );
}
