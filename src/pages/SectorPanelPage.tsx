import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePowerBiLink } from "@/hooks/usePowerBiLink";
import { sectorLabels } from "@/lib/sidebarMenu";
import { cn } from "@/lib/utils";
import { PowerBiPanel } from "@/lib/types";

const isValidPanel = (panel?: string): panel is PowerBiPanel =>
  panel === "comercial" || panel === "operacional" || panel === "financeiro" || panel === "principal";

const formatSector = (sectorId?: string) => {
  if (!sectorId) return "Setor";
  const knownLabel = sectorLabels[sectorId];
  if (knownLabel) return knownLabel;
  return sectorId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const SectorPanelPage = () => {
  const { sectorId, panelId } = useParams<{ sectorId: string; panelId: string }>();

  const panel = useMemo(() => (isValidPanel(panelId) ? panelId : null), [panelId]);
  const slug = sectorId ?? "";

  const { data, loading, error } = usePowerBiLink({
    sectorSlug: slug,
    panel: panel ?? "comercial",
  });

  const sectorLabel = formatSector(slug);
  const panelLabel = panel ? `Painel ${panel.charAt(0).toUpperCase() + panel.slice(1)}` : "Painel";
  const showFrame = slug && panel && !loading && !error && !!data;

  return (
    <div className="flex h-full w-full min-h-0">
      <div className="flex h-full w-full flex-col rounded-xl border border-border bg-card/80 shadow-lg">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {sectorLabel} - {panelLabel}
          </p>
        </div>
        <div className={cn("flex-1", showFrame ? "overflow-hidden" : "flex items-center justify-center p-8 text-center")}>
          {!slug || !panel ? (
            <p className="text-sm text-foreground">Setor ou painel inválido.</p>
          ) : loading ? (
            <p>Carregando painel...</p>
          ) : error ? (
            <p style={{ color: "red" }}>Erro: {error}</p>
          ) : !data ? (
            <p>Nenhum link configurado.</p>
          ) : (
            <iframe
              src={data.url}
              className="h-full w-full"
              title={`${sectorLabel}-${panelLabel}`}
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SectorPanelPage;
