import { ImagePreview } from "./image-preview";
import { type ProcessedImage, type BackgroundType, type AmbientBaseType } from "@/lib/types";

interface ImageListProps {
  images: ProcessedImage[];
  background: BackgroundType;
  customColor: string | null;
  ambientBase: AmbientBaseType;
  ambientCustomColor: string | null;
  blurRadius: number;
  scale: number;
  onRemove: (id: string) => void;
  onUpdateImage: (id: string, updates: Partial<ProcessedImage>) => void;
}

export function ImageList({
  images,
  background,
  customColor,
  ambientBase,
  ambientCustomColor,
  blurRadius,
  scale,
  onRemove,
}: ImageListProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((image) => (
        <ImagePreview
          key={image.id}
          image={image}
          background={background}
          customColor={customColor}
          ambientBase={ambientBase}
          ambientCustomColor={ambientCustomColor}
          blurRadius={blurRadius}
          scale={scale}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
