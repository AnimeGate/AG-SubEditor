import { createFileRoute } from "@tanstack/react-router";
import Wypalarka from "@/components/wypalarka/Wypalarka";

export const Route = createFileRoute("/wypalarka")({
  component: Wypalarka,
});
