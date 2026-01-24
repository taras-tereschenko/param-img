import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { CreditTier } from "@/routes/api/polar/products";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Zod schema for validating products API response */
const ProductsResponseSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      credits: z.number(),
      price: z.string(),
      priceAmount: z.number(),
      originalPrice: z.string(),
      originalPriceAmount: z.number(),
      discountPercent: z.number(),
      description: z.string(),
    }),
  ),
});

async function fetchProducts(): Promise<Array<CreditTier>> {
  const response = await fetch("/api/polar/products");
  if (!response.ok) throw new Error("Failed to fetch products");
  const json: unknown = await response.json();
  const result = ProductsResponseSchema.safeParse(json);
  if (!result.success) {
    throw new Error("Invalid products response");
  }
  return result.data.products;
}

interface BuyCreditsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyCreditsDrawer({
  open,
  onOpenChange,
}: BuyCreditsDrawerProps) {
  const [selectedTier, setSelectedTier] = useState<string>("standard");

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["polar-products"],
    queryFn: fetchProducts,
    staleTime: 60 * 60 * 1000,
  });

  // Base UI's RadioGroup passes `unknown` value - validate before updating state
  const handleTierChange = (value: unknown) => {
    if (typeof value === "string") {
      setSelectedTier(value);
    }
  };

  const handleConfirm = () => {
    window.location.href = `/api/polar/checkout?tier=${selectedTier}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Buy AI Enhancement Credits</DrawerTitle>
            <DrawerDescription>
              Choose a credit pack to enhance your photos
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-2 p-4 pt-0">
            {isLoading || !tiers ? (
              <>
                <Skeleton className="h-[72px] w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
              </>
            ) : tiers.length > 0 ? (
              <RadioGroup value={selectedTier} onValueChange={handleTierChange}>
                {tiers.map((tier) => (
                  <FieldLabel key={tier.id} htmlFor={`tier-${tier.id}`}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={tier.id} id={`tier-${tier.id}`} />
                      <FieldContent>
                        <FieldTitle>
                          {tier.name}{" "}
                          <span className="font-normal text-muted-foreground">
                            · {tier.credits} credits
                          </span>
                        </FieldTitle>
                        <FieldDescription>{tier.description}</FieldDescription>
                      </FieldContent>
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-2">
                          {tier.discountPercent > 0 && (
                            <span className="text-sm text-muted-foreground line-through">
                              {tier.originalPrice}
                            </span>
                          )}
                          <span className="text-lg font-bold">
                            {tier.price}
                          </span>
                        </div>
                        {tier.discountPercent > 0 && (
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                            {tier.discountPercent}% off
                          </Badge>
                        )}
                      </div>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Unable to load pricing. Please try again.
              </p>
            )}
          </div>
          <DrawerFooter>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !tiers?.length || !selectedTier}
              className="w-full"
            >
              Continue to checkout
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-3"
              />
              <span>Secure payment via Polar • Credits never expire</span>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
