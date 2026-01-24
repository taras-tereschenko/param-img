import { createFileRoute } from "@tanstack/react-router";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { EnhanceResponse } from "@/lib/types";
import { METER_SLUG, getMeterBalance, polar } from "@/lib/polar";
import { auth } from "@/lib/auth";
import { ensurePolarCustomerWithFreeCredits } from "@/lib/polar-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";

// Create Google provider with GEMINI_API_KEY
const google = createGoogleGenerativeAI({
  apiKey: getEnv().GEMINI_API_KEY,
});

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Type predicate to check if a string is an allowed MIME type */
function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as ReadonlyArray<string>).includes(value);
}

// Max image size in bytes (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Enhancement prompt for professional photo quality
const ENHANCEMENT_PROMPT = `Enhance this photo to professional quality:
- Optimize exposure and dynamic range
- Enhance colors naturally (avoid oversaturation)
- Reduce noise while preserving detail
- Apply subtle sharpening for clarity
- Professional-grade color grading
- Maintain original composition

Return the enhanced image.`;

/** AI SDK accepted media types for image input */
type AIMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Map our allowed MIME types to AI SDK media types */
function toAIMediaType(mimeType: AllowedMimeType): AIMediaType {
  // HEIC/HEIF are converted to JPEG by the browser before reaching the API
  // but we map them defensively in case they arrive directly
  if (mimeType === "image/heic" || mimeType === "image/heif") {
    return "image/jpeg";
  }
  // Other types map directly (jpeg, png, webp are in both sets)
  return mimeType;
}

interface EnhanceRequest {
  imageBase64: string;
  mimeType: string;
}

/** Validated request with properly typed fields */
interface ValidatedRequest {
  imageBase64: string;
  mimeType: AllowedMimeType;
  aiMediaType: AIMediaType;
}

/** Validation result - either error string or validated data */
type ValidationResult =
  | { success: false; error: string }
  | { success: true; data: ValidatedRequest };

/**
 * Validate the image request and return typed data
 */
function validateImageRequest(body: EnhanceRequest): ValidationResult {
  const { imageBase64, mimeType } = body;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    return { success: false, error: "Missing or invalid image data" };
  }

  if (!mimeType || typeof mimeType !== "string") {
    return { success: false, error: "Missing or invalid MIME type" };
  }

  // Validate MIME type
  if (!isAllowedMimeType(mimeType)) {
    return {
      success: false,
      error: `Invalid MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // Validate base64 format and size
  // Base64 is ~4/3 the size of binary, so 10MB binary ≈ 13.3MB base64
  const base64SizeLimit = Math.ceil((MAX_IMAGE_SIZE * 4) / 3);
  if (imageBase64.length > base64SizeLimit) {
    return {
      success: false,
      error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Basic base64 format validation
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(imageBase64)) {
    return { success: false, error: "Invalid base64 encoding" };
  }

  return {
    success: true,
    data: {
      imageBase64,
      mimeType,
      aiMediaType: toAIMediaType(mimeType),
    },
  };
}

export const Route = createFileRoute("/api/enhance")({
  server: {
    handlers: {
      POST: async ({ request }): Promise<Response> => {
        // Get Better Auth session
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          return Response.json(
            {
              success: false,
              error: "Authentication required",
            } satisfies EnhanceResponse,
            { status: 401 },
          );
        }

        const userId = session.user.id;
        const email = session.user.email;

        // Email is required for Polar customer creation
        if (!email) {
          return Response.json(
            {
              success: false,
              error: "Email required for enhancement feature",
            } satisfies EnhanceResponse,
            { status: 400 },
          );
        }

        // Check rate limit using user ID
        const rateLimitResult = await checkRateLimit(userId);
        if (rateLimitResult && !rateLimitResult.success) {
          return Response.json(
            {
              success: false,
              error: `Rate limit exceeded. Please wait ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
            } satisfies EnhanceResponse,
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": String(rateLimitResult.limit),
                "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                "X-RateLimit-Reset": String(rateLimitResult.reset),
              },
            },
          );
        }

        // Parse request body
        let body: EnhanceRequest;
        try {
          body = await request.json();
        } catch (error: unknown) {
          console.error("Failed to parse request body:", error);
          return Response.json(
            {
              success: false,
              error: "Invalid request body",
            } satisfies EnhanceResponse,
            { status: 400 },
          );
        }

        // Validate input
        const validation = validateImageRequest(body);
        if (!validation.success) {
          return Response.json(
            {
              success: false,
              error: validation.error,
            } satisfies EnhanceResponse,
            { status: 400 },
          );
        }

        const { imageBase64, aiMediaType } = validation.data;

        // Ensure customer exists with free credits (this also grants free credits if not yet granted)
        let customerId: string;
        try {
          const result = await ensurePolarCustomerWithFreeCredits(
            userId,
            email,
          );
          customerId = result.customerId;
        } catch (error: unknown) {
          console.error("Failed to ensure Polar customer:", error);
          return Response.json(
            {
              success: false,
              error: "Failed to initialize credits. Please try again.",
            } satisfies EnhanceResponse,
            { status: 500 },
          );
        }

        // Fetch meter balance (includes both paid + free credits)
        let meterBalance = 0;
        try {
          meterBalance = await getMeterBalance(customerId);
        } catch (error: unknown) {
          console.error("Failed to fetch meter balance:", error);
          return Response.json(
            {
              success: false,
              error: "Failed to check credits. Please try again.",
            } satisfies EnhanceResponse,
            { status: 500 },
          );
        }

        if (meterBalance <= 0) {
          return Response.json(
            {
              success: false,
              error: "No credits remaining. Purchase more credits to continue.",
            } satisfies EnhanceResponse,
            { status: 402 },
          );
        }

        try {
          // Use Vercel AI SDK with Gemini's image generation model
          const result = await generateText({
            model: google("gemini-3-pro-image-preview"),
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: ENHANCEMENT_PROMPT },
                  {
                    type: "image",
                    image: imageBase64,
                    mediaType: aiMediaType,
                  },
                ],
              },
            ],
          });

          // Extract enhanced image from response
          let enhancedImageBase64: string | undefined;
          let enhancedMimeType: string | undefined;

          for (const file of result.files) {
            if (file.mediaType.startsWith("image/")) {
              // Convert Uint8Array to base64
              enhancedImageBase64 = Buffer.from(file.uint8Array).toString(
                "base64",
              );
              enhancedMimeType = file.mediaType;
              break;
            }
          }

          if (!enhancedImageBase64 || !enhancedMimeType) {
            console.error("No enhanced image in AI response", {
              hasFiles: result.files.length > 0,
              fileCount: result.files.length,
              text: result.text.slice(0, 200),
            });
            return Response.json(
              {
                success: false,
                error: "AI did not return an enhanced image. Please try again.",
              } satisfies EnhanceResponse,
              { status: 500 },
            );
          }

          // Deduct 1 credit after successful enhancement (positive value = consume)
          await polar.events.ingest({
            events: [
              {
                customerId,
                name: METER_SLUG,
                metadata: { units: 1 },
              },
            ],
          });

          // Return the enhanced image
          return Response.json({
            success: true,
            enhancedImageBase64,
            mimeType: enhancedMimeType,
          } satisfies EnhanceResponse);
        } catch (error: unknown) {
          console.error("Enhancement failed:", {
            error,
            userId,
            mediaType: aiMediaType,
          });
          return Response.json(
            {
              success: false,
              error: "Enhancement failed. Please try again.",
            } satisfies EnhanceResponse,
            { status: 500 },
          );
        }
      },
    },
  },
});
