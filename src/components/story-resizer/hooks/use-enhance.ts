import { useCallback } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { EnhancementStatus, ProcessedImage } from "@/lib/types";

interface UseEnhanceOptions {
  onStatusChange: (id: string, status: EnhancementStatus) => void;
  onEnhancedImageCreated: (
    sourceId: string,
    enhancedImage: ProcessedImage,
  ) => void;
  onCreditsUsed: () => void;
}

/** Zod schema for validating enhance API response */
const EnhanceResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    enhancedImageBase64: z.string(),
    mimeType: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export function useEnhance({
  onStatusChange,
  onEnhancedImageCreated,
  onCreditsUsed,
}: UseEnhanceOptions) {
  const enhanceImage = useCallback(
    async (image: ProcessedImage) => {
      // Don't enhance enhanced results (they're already enhanced)
      if (image.isEnhancedResult) {
        toast.info("This is already an enhanced image");
        return;
      }

      // Don't enhance if already loading
      if (image.enhancementStatus === "loading") {
        return;
      }

      onStatusChange(image.id, "loading");

      try {
        // Extract base64 from data URL
        const base64Match = image.originalDataUrl.match(
          /^data:([^;]+);base64,(.+)$/,
        );
        if (!base64Match) {
          throw new Error("Invalid image data format");
        }

        const mimeType = base64Match[1];
        const imageBase64 = base64Match[2];

        const response = await fetch("/api/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            imageBase64,
            mimeType,
          }),
        });

        const json: unknown = await response.json();
        const parseResult = EnhanceResponseSchema.safeParse(json);

        if (!parseResult.success) {
          throw new Error("Invalid API response format");
        }

        const data = parseResult.data;

        if (!response.ok) {
          if (response.status === 401) {
            // Import authClient dynamically to avoid circular deps
            const { authClient } = await import("@/lib/auth-client");
            toast.error("Please sign in to enhance images", {
              action: {
                label: "Sign in",
                onClick: () => {
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: window.location.pathname,
                  });
                },
              },
            });
            onStatusChange(image.id, "idle");
            return;
          }

          if (response.status === 402) {
            toast.error("No credits remaining", {
              description: "Purchase more credits to continue enhancing",
              action: {
                label: "Buy credits",
                onClick: () => {
                  window.location.href = "/api/polar/checkout";
                },
              },
            });
            onStatusChange(image.id, "idle");
            return;
          }

          if (response.status === 429) {
            toast.error("Too many requests", {
              description: "Please wait a moment before trying again",
            });
            onStatusChange(image.id, "idle");
            return;
          }

          // API returned error status - data should be error type
          if (!data.success) {
            throw new Error(data.error);
          }
          throw new Error("Enhancement failed");
        }

        // Handle successful enhanced image response - data.success is true here
        if (data.success) {
          const enhancedDataUrl = `data:${data.mimeType};base64,${data.enhancedImageBase64}`;
          // Create a new ProcessedImage for the enhanced result
          const enhancedImage: ProcessedImage = {
            id: crypto.randomUUID(),
            originalFile: image.originalFile,
            originalDataUrl: enhancedDataUrl, // Enhanced IS the original for this entry
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            enhancementStatus: "idle",
            isEnhancedResult: true,
            sourceImageId: image.id,
          };
          onEnhancedImageCreated(image.id, enhancedImage);
          onCreditsUsed();
          toast.success("Image enhanced!", {
            description: "Enhanced version added to carousel",
          });
        } else {
          throw new Error(data.error);
        }
      } catch (error: unknown) {
        console.error("Enhancement failed:", error);
        onStatusChange(image.id, "error");

        // Provide more specific error messages
        let description = "Please try again";
        if (error instanceof TypeError && error.message.includes("fetch")) {
          description = "Network error. Check your connection.";
        } else if (error instanceof Error) {
          description = error.message;
        }

        toast.error("Enhancement failed", {
          description,
          action: {
            label: "Retry",
            onClick: () => {
              // Reset to idle so user can retry
              onStatusChange(image.id, "idle");
            },
          },
        });
      }
    },
    [onStatusChange, onEnhancedImageCreated, onCreditsUsed],
  );

  return { enhanceImage };
}
