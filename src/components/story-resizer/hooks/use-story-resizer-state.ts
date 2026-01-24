import { useCallback, useEffect, useMemo, useReducer } from "react";
import { z } from "zod";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  EnhancementStatus,
  ProcessedImage,
} from "@/lib/types";
import {
  DEFAULT_AMBIENT_BLUR_PERCENT,
  DEFAULT_BLUR_PERCENT,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_SCALE,
} from "@/lib/types";

const SETTINGS_STORAGE_KEY = "param-img-settings";

/**
 * Zod schema for persisted settings validation.
 * Must match the canonical types from @/lib/types.ts.
 * Using .partial() makes all fields optional - perfect for localStorage
 * where we might have outdated/incomplete data from previous versions.
 */
const PersistedSettingsSchema = z
  .object({
    background: z.enum(["blur", "black", "white", "custom", "ambient"]),
    customColor: z.string().nullable(),
    ambientBase: z.enum(["black", "white", "custom"]),
    ambientCustomColor: z.string().nullable(),
    blurPercent: z.number().min(0).max(100),
    ambientBlurPercent: z.number().min(0).max(100),
    scale: z.number().min(0).max(1),
    // BorderRadiusOption is 0 | 1 | 2 | 3 in types.ts
    borderRadius: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
    ]),
  })
  .partial();

/** Settings that persist to localStorage (uses canonical types from @/lib/types) */
interface PersistedSettings {
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  ambientBlurPercent: number;
  scale: number;
  borderRadius: BorderRadiusOption;
}

function loadPersistedSettings(): Partial<PersistedSettings> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    const result = PersistedSettingsSchema.safeParse(parsed);
    // Zod validates the shape matches our canonical types
    // The inferred type is compatible with Partial<PersistedSettings>
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

function savePersistedSettings(settings: PersistedSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

interface State {
  images: Array<ProcessedImage>;
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurPercent: number;
  ambientBlurPercent: number;
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
  | { type: "SET_BLUR_PERCENT"; blurPercent: number }
  | { type: "SET_AMBIENT_BLUR_PERCENT"; ambientBlurPercent: number }
  | { type: "SET_SCALE"; scale: number }
  | { type: "SET_BORDER_RADIUS"; borderRadius: BorderRadiusOption }
  | { type: "CLEAR_ALL" }
  | { type: "SET_ENHANCEMENT_STATUS"; id: string; status: EnhancementStatus }
  | {
      type: "ADD_ENHANCED_IMAGE";
      sourceId: string;
      enhancedImage: ProcessedImage;
    };

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
    case "SET_BLUR_PERCENT":
      return { ...state, blurPercent: action.blurPercent };
    case "SET_AMBIENT_BLUR_PERCENT":
      return { ...state, ambientBlurPercent: action.ambientBlurPercent };
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
    case "SET_ENHANCEMENT_STATUS":
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.id
            ? { ...img, enhancementStatus: action.status }
            : img,
        ),
      };
    case "ADD_ENHANCED_IMAGE": {
      const sourceIndex = state.images.findIndex(
        (img) => img.id === action.sourceId,
      );
      if (sourceIndex === -1) return state;
      const newImages = [...state.images];
      const sourceImage = {
        ...newImages[sourceIndex],
        enhancementStatus: "idle" as const,
      };
      // Put enhanced image at original's position, move original after it
      newImages[sourceIndex] = action.enhancedImage;
      newImages.splice(sourceIndex + 1, 0, sourceImage);
      return {
        ...state,
        images: newImages,
      };
    }
    default:
      return state;
  }
}

const defaultSettings: PersistedSettings = {
  background: "blur",
  customColor: null,
  ambientBase: "black",
  ambientCustomColor: null,
  blurPercent: DEFAULT_BLUR_PERCENT,
  ambientBlurPercent: DEFAULT_AMBIENT_BLUR_PERCENT,
  scale: DEFAULT_SCALE,
  borderRadius: DEFAULT_BORDER_RADIUS,
};

function createInitialState(): State {
  const persisted = loadPersistedSettings();
  return {
    images: [],
    ...defaultSettings,
    ...persisted,
  };
}

export function useStoryResizerState() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

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
  } = state;

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    savePersistedSettings({
      background,
      customColor,
      ambientBase,
      ambientCustomColor,
      blurPercent,
      ambientBlurPercent,
      scale,
      borderRadius,
    });
  }, [
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurPercent,
    ambientBlurPercent,
    scale,
    borderRadius,
  ]);

  // Derived values
  const activeBlurPercent =
    background === "ambient" ? ambientBlurPercent : blurPercent;

  const hasImages = images.length > 0;

  const activeAction = useMemo((): "blur" | "ambient" | "color" => {
    if (background === "blur") return "blur";
    if (background === "ambient") return "ambient";
    return "color";
  }, [background]);

  const colorSheetSelection = useMemo((): "black" | "white" | "custom" => {
    if (background === "black") return "black";
    if (background === "white") return "white";
    if (background === "custom") return "custom";
    return "black";
  }, [background]);

  // Actions
  const addImages = useCallback((newImages: Array<ProcessedImage>) => {
    dispatch({ type: "ADD_IMAGES", images: newImages });
  }, []);

  const removeImage = useCallback((id: string) => {
    dispatch({ type: "REMOVE_IMAGE", id });
  }, []);

  const setBackground = useCallback((bg: BackgroundType) => {
    dispatch({ type: "SET_BACKGROUND", background: bg });
  }, []);

  const setCustomColor = useCallback((color: string | null) => {
    dispatch({ type: "SET_CUSTOM_COLOR", color });
  }, []);

  const setAmbientBase = useCallback((base: AmbientBaseType) => {
    dispatch({ type: "SET_AMBIENT_BASE", ambientBase: base });
  }, []);

  const setAmbientCustomColor = useCallback((color: string | null) => {
    dispatch({ type: "SET_AMBIENT_CUSTOM_COLOR", color });
  }, []);

  const setBlurPercent = useCallback((percent: number) => {
    dispatch({ type: "SET_BLUR_PERCENT", blurPercent: percent });
  }, []);

  const setAmbientBlurPercent = useCallback((percent: number) => {
    dispatch({ type: "SET_AMBIENT_BLUR_PERCENT", ambientBlurPercent: percent });
  }, []);

  const setScale = useCallback((newScale: number) => {
    dispatch({ type: "SET_SCALE", scale: newScale });
  }, []);

  const setBorderRadius = useCallback((newBorderRadius: BorderRadiusOption) => {
    dispatch({ type: "SET_BORDER_RADIUS", borderRadius: newBorderRadius });
  }, []);

  const setEnhancementStatus = useCallback(
    (id: string, status: EnhancementStatus) => {
      dispatch({ type: "SET_ENHANCEMENT_STATUS", id, status });
    },
    [],
  );

  const addEnhancedImage = useCallback(
    (sourceId: string, enhancedImage: ProcessedImage) => {
      dispatch({ type: "ADD_ENHANCED_IMAGE", sourceId, enhancedImage });
    },
    [],
  );

  return {
    // State values
    images,
    background,
    customColor,
    ambientBase,
    ambientCustomColor,
    blurPercent,
    ambientBlurPercent,
    scale,
    borderRadius,
    // Derived values
    activeBlurPercent,
    hasImages,
    activeAction,
    colorSheetSelection,
    // Actions
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
  };
}
