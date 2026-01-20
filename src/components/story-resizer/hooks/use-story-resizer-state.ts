import { useCallback, useMemo, useReducer } from "react";
import type {
  AmbientBaseType,
  BackgroundType,
  BorderRadiusOption,
  ProcessedImage,
} from "@/lib/types";
import {
  DEFAULT_AMBIENT_BLUR_PERCENT,
  DEFAULT_BLUR_PERCENT,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_SCALE,
} from "@/lib/types";

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
  blurPercent: DEFAULT_BLUR_PERCENT,
  ambientBlurPercent: DEFAULT_AMBIENT_BLUR_PERCENT,
  scale: DEFAULT_SCALE,
  borderRadius: DEFAULT_BORDER_RADIUS,
};

export function useStoryResizerState() {
  const [state, dispatch] = useReducer(reducer, initialState);

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
  };
}
