import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, StarsIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: string;
  pricePerCredit: string;
  popular?: boolean;
}

const CREDIT_PACKS: Array<CreditPack> = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: "$4.99",
    pricePerCredit: "$0.50",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 30,
    price: "$11.99",
    pricePerCredit: "$0.40",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 100,
    price: "$29.99",
    pricePerCredit: "$0.30",
  },
];

interface BuyCreditsButtonProps {
  size?: "default" | "sm" | "lg";
}

export function BuyCreditsButton({ size = "default" }: BuyCreditsButtonProps) {
  const handleBuyCredits = (packId: string) => {
    // Redirect to Polar checkout with the product ID
    const productId =
      packId === "starter"
        ? process.env.POLAR_PRODUCT_STARTER_ID
        : packId === "standard"
          ? process.env.POLAR_PRODUCT_STANDARD_ID
          : process.env.POLAR_PRODUCT_PRO_ID;

    window.location.href = `/api/polar/checkout?productId=${productId}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Choose a credit pack to enhance your images with AI:
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CREDIT_PACKS.map((pack) => (
          <Button
            key={pack.id}
            variant={pack.popular ? "default" : "outline"}
            size={size}
            onClick={() => handleBuyCredits(pack.id)}
            className="flex-col h-auto py-3"
          >
            <span className="font-semibold">{pack.name}</span>
            <span className="flex items-center gap-1 text-xs opacity-80">
              <HugeiconsIcon
                icon={StarsIcon}
                strokeWidth={2}
                className="size-3"
              />
              {pack.credits} credits
            </span>
            <span className="text-lg font-bold">{pack.price}</span>
            <span className="text-xs opacity-60">
              {pack.pricePerCredit}/credit
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function QuickBuyButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // Redirect to standard pack checkout (most popular)
        window.location.href = `/api/polar/checkout?productId=${process.env.POLAR_PRODUCT_STANDARD_ID}`;
      }}
    >
      <HugeiconsIcon
        icon={Add01Icon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      Buy Credits
    </Button>
  );
}
