import { supabase } from "@/lib/supabaseClient";

export const REPORTS_BUCKET = "reports";
export const REPORTS_UPDATED_EVENT = "reports-updated";

export type ReportFile = {
  name: string;
  path: string;
  createdAt?: string;
  updatedAt?: string;
  size?: number;
};

const normalizeSector = (sector: string) => {
  const trimmed = sector.trim();
  return trimmed || "consultoria";
};

const sanitizeFileName = (name: string) => {
  const trimmed = name.trim();
  const safeName = trimmed
    .replace(/\s+/g, "_")
    .replace(/[\\/#?%*:|"<>]/g, "")
    .replace(/_{2,}/g, "_");
  if (!safeName) return `relatorio-${Date.now()}.pdf`;
  return safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
};

export const notifyReportsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REPORTS_UPDATED_EVENT));
};

export const listReports = async (sector: string): Promise<ReportFile[]> => {
  const sectorPath = normalizeSector(sector);
  const { data, error } = await supabase.storage.from(REPORTS_BUCKET).list(sectorPath, {
    limit: 200,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => {
      const rawSize = item.metadata?.size;
      const parsedSize = typeof rawSize === "number" ? rawSize : Number(rawSize);
      return {
        name: item.name,
        path: `${sectorPath}/${item.name}`,
        createdAt: item.created_at ?? undefined,
        updatedAt: item.updated_at ?? undefined,
        size: Number.isFinite(parsedSize) ? parsedSize : undefined,
      };
    });
};

export const uploadReport = async (sector: string, file: File): Promise<string> => {
  const isPdfType = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfType) {
    throw new Error("Selecione um arquivo PDF válido.");
  }

  const sectorPath = normalizeSector(sector);
  const fileName = sanitizeFileName(file.name);
  const path = `${sectorPath}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage.from(REPORTS_BUCKET).upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
};

export const downloadReport = async (path: string): Promise<Blob> => {
  const { data, error } = await supabase.storage.from(REPORTS_BUCKET).download(path);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getReportUrl = async (path: string): Promise<string> => {
  const { data: signedData, error: signedError } = await supabase.storage
    .from(REPORTS_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data: publicData } = supabase.storage.from(REPORTS_BUCKET).getPublicUrl(path);
  if (!publicData?.publicUrl) {
    throw new Error("Não foi possível gerar o link do relatório.");
  }

  return publicData.publicUrl;
};

export const deleteReport = async (path: string) => {
  const { error } = await supabase.storage.from(REPORTS_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
};
