import { useParams } from "react-router-dom";
import { sectorLabels } from "@/lib/sidebarMenu";

const formatSector = (sectorId?: string) => {
  if (!sectorId) return "Setor";
  const knownLabel = sectorLabels[sectorId];
  if (knownLabel) return knownLabel;
  return sectorId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const SectorPage = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const sectorLabel = formatSector(sectorId);

  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-border bg-card/80 text-center shadow-lg">
      <div className="max-w-xl space-y-3 px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground">{sectorLabel}</h1>
        <p className="text-muted-foreground">
          Os dashboards deste setor serão exibidos aqui. Selecione uma opção no menu lateral para navegar ou adicione o
          BI correspondente quando estiver disponível.
        </p>
      </div>
    </div>
  );
};

export default SectorPage;
