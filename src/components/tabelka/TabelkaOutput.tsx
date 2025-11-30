import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Check, Copy, FileText, ImageIcon, ChevronDown } from "lucide-react";
import { cn } from "@/utils/tailwind";

interface TabelkaOutputProps {
  output: string;
  logoOutput: string;
}

export function TabelkaOutput({ output, logoOutput }: TabelkaOutputProps) {
  const { t } = useTranslation();
  const [copiedTable, setCopiedTable] = useState(false);
  const [copiedLogo, setCopiedLogo] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);

  const handleCopyTable = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopiedTable(true);
      setTimeout(() => setCopiedTable(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [output]);

  const handleCopyLogo = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!logoOutput) return;

    try {
      await navigator.clipboard.writeText(logoOutput);
      setCopiedLogo(true);
      setTimeout(() => setCopiedLogo(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [logoOutput]);

  return (
    <Card className="flex shrink-0 flex-col">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          {t("tabelka.output")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {/* Table Output - Collapsible */}
        <Collapsible open={tableOpen} onOpenChange={setTableOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between rounded-md border bg-muted/30 px-3 py-2 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("h-4 w-4 transition-transform", tableOpen && "rotate-180")} />
                <span className="text-sm font-medium">{t("tabelka.tableOutput")}</span>
                {output && (
                  <span className="text-xs text-muted-foreground">
                    ({output.split("\n").length} {t("lines")})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTable}
                disabled={!output}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                {copiedTable ? (
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
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 max-h-[150px] overflow-auto rounded-md border bg-muted/20 p-2">
              {output ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                  {output}
                </pre>
              ) : (
                <div className="flex h-[60px] items-center justify-center text-sm text-muted-foreground">
                  {t("tabelka.noOutput")}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Logo Output - Collapsible */}
        <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between rounded-md border bg-muted/30 px-3 py-2 hover:bg-muted/50">
              <div className="flex items-center gap-2">
                <ChevronDown className={cn("h-4 w-4 transition-transform", logoOpen && "rotate-180")} />
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{t("tabelka.logoOutput")}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLogo}
                disabled={!logoOutput}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                {copiedLogo ? (
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
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 max-h-[80px] overflow-auto rounded-md border bg-muted/20 p-2">
              {logoOutput ? (
                <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                  {logoOutput}
                </pre>
              ) : (
                <div className="flex h-[40px] items-center justify-center text-xs text-muted-foreground">
                  {t("tabelka.noLogoOutput")}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
