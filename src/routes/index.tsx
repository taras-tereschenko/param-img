import { createFileRoute } from "@tanstack/react-router";
import { StoryResizer } from "@/components/story-resizer/story-resizer";

type PanelType = "blur" | "ambient" | "color" | "resize";

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>): { panel?: PanelType } => {
    const panel = search.panel;
    if (
      panel === "blur" ||
      panel === "ambient" ||
      panel === "color" ||
      panel === "resize"
    ) {
      return { panel };
    }
    return {};
  },
});

function App() {
  return <StoryResizer />;
}
