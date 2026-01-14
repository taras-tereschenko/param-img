import { Button } from "@/components/ui/button";

interface PanelLayoutProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function PanelLayout({ title, onBack, children }: PanelLayoutProps) {
  return (
    <div className="p-4">
      <div className="mb-3">
        <span className="font-medium">{title}</span>
      </div>

      <div className="space-y-4">
        {children}

        <Button onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}
