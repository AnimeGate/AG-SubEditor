import SubtitleEditor from "@/components/subtitle-editor/SubtitleEditor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: SubtitleEditor,
});
