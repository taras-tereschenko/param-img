import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CREDIT_PRODUCTS, polar } from "@/lib/polar";

/** Schema to safely extract priceAmount from Polar's price union type */
const FixedPriceSchema = z.object({
  priceAmount: z.number(),
});

// Cost per AI enhancement in dollars (Gemini 2.0 Flash / Nanobanana Pro)
const COST_PER_CREDIT = 0.25;

export interface CreditTier {
  id: string;
  name: string;
  credits: number;
  price: string;
  priceAmount: number;
  originalPrice: string;
  originalPriceAmount: number;
  discountPercent: number;
  description: string;
}

export const Route = createFileRoute("/api/polar/products")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const productIds = [
            { key: "starter", id: CREDIT_PRODUCTS.starter },
            { key: "standard", id: CREDIT_PRODUCTS.standard },
            { key: "pro", id: CREDIT_PRODUCTS.pro },
          ].filter((p) => p.id);

          const products = await Promise.all(
            productIds.map(async ({ key, id }) => {
              const product = await polar.products.get({ id: id! });
              // Validate price has priceAmount - skip product if not
              const parsedPrice = FixedPriceSchema.safeParse(product.prices[0]);
              if (!parsedPrice.success) {
                console.warn(
                  `Product ${product.name} (${key}) has no valid price, skipping`,
                );
                return null;
              }
              const priceAmount = parsedPrice.data.priceAmount / 100;

              // Extract credits from meter_credit benefit
              const meterCreditBenefit = product.benefits.find(
                (b) => b.type === "meter_credit",
              );
              const credits =
                meterCreditBenefit?.type === "meter_credit"
                  ? meterCreditBenefit.properties.units
                  : 0;

              // Calculate original price at 50% margin (for strikethrough display)
              const costBasis = credits * COST_PER_CREDIT;
              const originalPriceAmount = Math.ceil(costBasis * 2 * 100) / 100; // 50% margin, round up to cents

              // Calculate discount percentage
              const discountPercent =
                originalPriceAmount > 0
                  ? Math.round(
                      ((originalPriceAmount - priceAmount) /
                        originalPriceAmount) *
                        100,
                    )
                  : 0;

              return {
                id: key,
                name: product.name,
                credits,
                price: `$${priceAmount.toFixed(2)}`,
                priceAmount,
                originalPrice: `$${originalPriceAmount.toFixed(2)}`,
                originalPriceAmount,
                discountPercent,
                description: product.description ?? "",
              } satisfies CreditTier;
            }),
          );

          // Filter out products that failed validation
          const validProducts = products.filter(
            (p): p is CreditTier => p !== null,
          );

          return Response.json({ products: validProducts });
        } catch (error: unknown) {
          console.error("Failed to fetch products:", error);
          return Response.json(
            { error: "Failed to fetch products" },
            { status: 500 },
          );
        }
      },
    },
  },
});
