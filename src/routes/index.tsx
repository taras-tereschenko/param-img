import { createFileRoute } from "@tanstack/react-router";
import { StoryResizer } from "@/components/story-resizer/story-resizer";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return <StoryResizer />;
}
