import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  deleteReport,
  getReportUrl,
  listReports,
  notifyReportsUpdated,
  REPORTS_UPDATED_EVENT,
  type ReportFile,
} from "@/lib/reports";
import { getSectorFromPath, sectorLabels } from "@/lib/sidebarMenu";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
};

const formatSize = (size?: number) => {
  if (!size) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let remaining = size;
  let unitIndex = 0;

  while (remaining >= 1024 && unitIndex < units.length - 1) {
    remaining /= 1024;
    unitIndex += 1;
  }

  return `${remaining.toFixed(remaining < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

const formatName = (name: string) => name.replace(/^\d+-/, "").replace(/_/g, " ");

const RelatoriosPage = () => {
  const location = useLocation();
  const currentSector = useMemo(() => getSectorFromPath(location.pathname), [location.pathname]);
  const sectorLabel = sectorLabels[currentSector] ?? "Setor";
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [openingName, setOpeningName] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await listReports(currentSector);
      setReports(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar relatórios.";
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();

    const handleUpdated = () => {
      loadReports();
    };

    window.addEventListener(REPORTS_UPDATED_EVENT, handleUpdated);
    return () => {
      window.removeEventListener(REPORTS_UPDATED_EVENT, handleUpdated);
    };
  }, [currentSector]);

  const handleOpen = async (report: ReportFile) => {
    setOpeningName(report.name);
    try {
      const url = await getReportUrl(report.path);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        toast({
          title: "Permita pop-ups",
          description: "Habilite pop-ups para abrir o relatório em nova guia.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao abrir relatório.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setOpeningName(null);
    }
  };

  const handleDelete = async (report: ReportFile) => {
    const confirmation = window.confirm(`Deseja excluir o relatório "${formatName(report.name)}"?`);
    if (!confirmation) return;

    setDeletingName(report.name);
    try {
      await deleteReport(report.path);
      notifyReportsUpdated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir relatório.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">
          Abra os PDFs disponíveis para o setor atual ({sectorLabel}).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos disponíveis</CardTitle>
          <CardDescription>Selecione um relatório para abrir em nova guia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadError && <p className="text-sm text-red-500">{loadError}</p>}
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Carregando relatórios...
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum relatório disponível para este setor.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.name}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card/70 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{formatName(report.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {formatDate(report.updatedAt ?? report.createdAt)} • {formatSize(report.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpen(report)}
                    disabled={openingName === report.name || deletingName === report.name}
                  >
                    {openingName === report.name ? "Abrindo..." : "Abrir"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(report)}
                    disabled={deletingName === report.name || openingName === report.name}
                  >
                    {deletingName === report.name ? "Excluindo..." : "Excluir"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosPage;
