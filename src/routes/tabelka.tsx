import { createFileRoute } from "@tanstack/react-router";
import Tabelka from "@/components/tabelka/Tabelka";

export const Route = createFileRoute("/tabelka")({
  component: Tabelka,
});
