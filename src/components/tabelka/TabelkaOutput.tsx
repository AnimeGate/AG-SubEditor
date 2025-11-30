import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Copy, FileText } from "lucide-react";

interface TabelkaOutputProps {
  output: string;
}

export function TabelkaOutput({ output }: TabelkaOutputProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [output]);

  return (
    <Card className="flex min-h-[200px] flex-1 flex-col">
      <CardHeader className="flex-shrink-0 flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {t("tabelka.output")}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!output}
          className="h-8 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              {t("tabelka.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t("tabelka.copy")}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-full rounded-md border bg-muted/30">
          {output ? (
            <pre className="whitespace-pre-wrap break-all p-3 font-mono text-xs">
              {output}
            </pre>
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground">
              {t("tabelka.noOutput")}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
