import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { notifyReportsUpdated, uploadReport } from "@/lib/reports";
import { getSectorFromPath, sectorLabels } from "@/lib/sidebarMenu";

const PerfilPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const currentSector = useMemo(() => getSectorFromPath(location.pathname), [location.pathname]);
  const sectorLabel = sectorLabels[currentSector] ?? "Setor";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location.hash === "#relatorios" && reportsRef.current) {
      reportsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({ title: "Selecione um PDF", description: "Escolha um arquivo para enviar.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      await uploadReport(currentSector, selectedFile);
      notifyReportsUpdated();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({ title: "PDF enviado", description: "O relatório já está disponível para download." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar o PDF.";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Gerenciar Cadastro</h1>
        <p className="text-muted-foreground">Gerencie suas informações de perfil.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Nome</label>
          <p className="text-lg text-foreground">
            {user?.firstName} {user?.lastName}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">E-mail</label>
          <p className="text-lg text-foreground">{user?.email}</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Recuperar senha</p>
              <p className="text-sm text-muted-foreground">
                Envie um e-mail para redefinir sua senha e recuperar o acesso.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate("/recuperar-senha")}>
              Ir para recuperar senha
            </Button>
          </div>
        </div>
      </div>

      <div id="relatorios" ref={reportsRef} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Setor atual: {sectorLabel}. Envie PDFs para ficarem disponíveis para download.
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reportFile">Arquivo PDF</Label>
            <Input
              id="reportFile"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </div>
          {selectedFile && (
            <p className="text-xs text-muted-foreground">Selecionado: {selectedFile.name}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? "Enviando..." : "Enviar PDF"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerfilPage;
