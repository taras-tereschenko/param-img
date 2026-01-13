import { useReducer, useCallback, useState } from "react";
import { ImageCarousel } from "./image-carousel";
import { ActionBar } from "./action-bar";
import { BlurPanel } from "./blur-panel";
import { AmbientPanel } from "./ambient-panel";
import { ColorPanel } from "./color-panel";
import { ResizePanel } from "./resize-panel";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { DownloadIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import {
  type ProcessedImage,
  type BackgroundType,
  type AmbientBaseType,
  DEFAULT_SCALE,
  DEFAULT_BLUR_RADIUS,
  DEFAULT_AMBIENT_BLUR_RADIUS,
} from "@/lib/types";
import {
  fileToDataUrl,
  generateImageId,
  prepareImage,
  createStoryFilename,
} from "@/lib/image-utils";
import { processImageForStory } from "@/lib/canvas-utils";

interface State {
  images: ProcessedImage[];
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  ambientBlurRadius: number;
  scale: number;
}

type Action =
  | { type: "ADD_IMAGES"; images: ProcessedImage[] }
  | { type: "REMOVE_IMAGE"; id: string }
  | { type: "SET_BACKGROUND"; background: BackgroundType }
  | { type: "SET_CUSTOM_COLOR"; color: string | null }
  | { type: "SET_AMBIENT_BASE"; ambientBase: AmbientBaseType }
  | { type: "SET_AMBIENT_CUSTOM_COLOR"; color: string | null }
  | { type: "SET_BLUR_RADIUS"; blurRadius: number }
  | { type: "SET_AMBIENT_BLUR_RADIUS"; ambientBlurRadius: number }
  | { type: "SET_SCALE"; scale: number }
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
    case "CLEAR_ALL":
      return { ...state, images: [], customColor: null, ambientCustomColor: null };
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
};

type SheetType = "blur" | "ambient" | "color" | "resize" | null;

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
  const { images, background, customColor, ambientBase, ambientCustomColor, blurRadius, ambientBlurRadius, scale } = state;

  // Get the active blur radius based on current background mode
  const activeBlurRadius = background === "ambient" ? ambientBlurRadius : blurRadius;

  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Derived state for color sheet - only show custom as selected if it's actually custom
  const colorSheetSelection = background === "black" ? "black"
    : background === "white" ? "white"
    : background === "custom" ? "custom"
    : "black"; // Default to black for blur/ambient modes

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newImages: ProcessedImage[] = await Promise.all(
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
      })
    );

    dispatch({ type: "ADD_IMAGES", images: newImages });
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    dispatch({ type: "REMOVE_IMAGE", id });
  }, []);

  const handleActionClick = useCallback((action: "blur" | "ambient" | "color" | "resize") => {
    setActiveSheet(action);
    // Set the background type when opening the panel
    if (action === "blur") {
      dispatch({ type: "SET_BACKGROUND", background: "blur" });
    } else if (action === "ambient") {
      dispatch({ type: "SET_BACKGROUND", background: "ambient" });
    } else if (action === "color") {
      // Default to black when opening color panel (unless custom color is already set)
      if (background !== "black" && background !== "white" && background !== "custom") {
        dispatch({ type: "SET_BACKGROUND", background: "black" });
      }
    }
  }, [background]);

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
  const handleColorSelect = useCallback((color: "black" | "white" | "custom") => {
    if (color === "black") {
      dispatch({ type: "SET_BACKGROUND", background: "black" });
    } else if (color === "white") {
      dispatch({ type: "SET_BACKGROUND", background: "white" });
    } else {
      dispatch({ type: "SET_BACKGROUND", background: "custom" });
    }
  }, []);

  const handleCustomColorChange = useCallback((color: string) => {
    dispatch({ type: "SET_CUSTOM_COLOR", color });
    dispatch({ type: "SET_BACKGROUND", background: "custom" });
  }, []);

  // Scale handlers
  const handleScaleChange = useCallback((newScale: number) => {
    dispatch({ type: "SET_SCALE", scale: newScale });
  }, []);

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
          activeBlurRadius
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
  }, [images, background, customColor, scale, ambientBase, ambientCustomColor, activeBlurRadius]);

  // Single image download handler
  const handleDownloadImage = useCallback((processedUrl: string, originalFilename: string) => {
    const filename = createStoryFilename(originalFilename);
    downloadDataUrl(processedUrl, filename);
  }, []);

  const hasImages = images.length > 0;

  // Map background type to active action for visual feedback
  const activeAction = background === "blur" ? "blur"
    : background === "ambient" ? "ambient"
    : (background === "black" || background === "white" || background === "custom") ? "color"
    : null;

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
          >
            <HugeiconsIcon
              icon={isDownloading ? Loading01Icon : DownloadIcon}
              strokeWidth={2}
              data-icon="inline-start"
              className={isDownloading ? "animate-spin" : undefined}
            />
            {isDownloading
              ? `${Math.round(downloadProgress)}%`
              : `Export images (${images.length})`}
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
          onFilesAdded={handleFilesAdded}
          onRemoveImage={handleRemoveImage}
          onDownloadImage={handleDownloadImage}
        />
      </main>

      {/* Bottom panel area */}
      <footer className="border-t bg-background">
        {activeSheet === null ? (
          <ActionBar
            disabled={!hasImages}
            activeAction={activeAction}
            onActionClick={handleActionClick}
          />
        ) : activeSheet === "blur" ? (
          <BlurPanel
            blurRadius={blurRadius}
            onBlurRadiusChange={handleBlurPanelRadiusChange}
            onBack={() => setActiveSheet(null)}
          />
        ) : activeSheet === "ambient" ? (
          <AmbientPanel
            ambientBase={ambientBase}
            ambientCustomColor={ambientCustomColor}
            blurRadius={ambientBlurRadius}
            onAmbientBaseChange={handleAmbientBaseChange}
            onAmbientCustomColorChange={handleAmbientCustomColorChange}
            onBlurRadiusChange={handleAmbientBlurRadiusChange}
            onBack={() => setActiveSheet(null)}
          />
        ) : activeSheet === "color" ? (
          <ColorPanel
            selectedColor={colorSheetSelection}
            customColor={customColor}
            onColorSelect={handleColorSelect}
            onCustomColorChange={handleCustomColorChange}
            onBack={() => setActiveSheet(null)}
          />
        ) : activeSheet === "resize" ? (
          <ResizePanel
            scale={scale}
            onScaleChange={handleScaleChange}
            onBack={() => setActiveSheet(null)}
          />
        ) : null}
      </footer>
      </div>
    </div>
  );
}
