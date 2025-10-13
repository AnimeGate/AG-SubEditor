import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Flame, Sparkles, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function WypalarkaPage() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Flame className="h-24 w-24 text-orange-500 animate-pulse" />
              <Sparkles className="h-8 w-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold">
            {t("wypalarkaTitle")}
          </CardTitle>
          <CardDescription className="text-lg">
            {t("wypalarkaComingSoon")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
            <p className="text-muted-foreground">
              {t("wypalarkaDescription")}
            </p>
          </div>

          <div className="pt-4 space-y-3 text-sm text-muted-foreground border-t">
            <p className="font-semibold text-foreground">
              Planowane funkcje:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Wypalanie napisów bezpośrednio na video</li>
              <li>Obsługa wielu formatów wideo</li>
              <li>Zaawansowane opcje stylizacji</li>
              <li>Podgląd w czasie rzeczywistym</li>
              <li>Wsadowe przetwarzanie plików</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/wypalarka")({
  component: WypalarkaPage,
});
