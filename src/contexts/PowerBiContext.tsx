/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type PanelSlug = "comercial" | "operacional" | "financeiro";
type SectorSlug =
  | "consultoria"
  | "financeiro"
  | "avaliacao-ativos"
  | "comunicacao"
  | "levantamento-safra"
  | "projetos"
  | "desenvolvimento-inovacao"
  | "agroeconomics";

export type PowerBiSection =
  | `${SectorSlug}-${PanelSlug}`
  | "financeiro-principal"
  | "avaliacao-ativos";

type PowerBiLinkMap = Record<PowerBiSection, string>;

const decodeBase64 = (encoded: string) => {
  try {
    if (typeof atob === "function") return atob(encoded);
    // Node/SSR fallback
    return Buffer.from(encoded, "base64").toString("utf-8");
  } catch (error) {
    console.error("Erro ao decodificar link do Power BI", error);
    return "";
  }
};

const fromEncodedSegments = (segments: string[]) => {
  if (!segments.length) return "";
  return decodeBase64(segments.join(""));
};

const sanitizePowerBiValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  return trimmed;
};

const ENCODED_DEFAULT_LINKS: Record<PowerBiSection, string[]> = {
  "consultoria-comercial": [
    "aHR0cHM6Ly9hcHAucG93ZXJiaS5jb20vdmlldz9yPWV5SnJJam9pT0RneU0yTTFObUl0TmprMFl5TTFMVE0xTVRNek9XSTNMbE5rWVp6WXpNMU9ORkws",
    "aWdpdCI6IjRmYWUwODcwLTIwYWEtNGNhMy1iMzE2LTM0N2E1N2IyZWQxMCJ9",
  ],
  "consultoria-operacional": [
    "aHR0cHM6Ly9hcHAucG93ZXJiaS5jb20vdmlldz9yPWV5SnJJam9pWXpZMk1EVXpaamt0WWpGbU1EVmtMV0ZqWldFeU1USXdZV05pWm1Wa0lpdDZaVzFoYVd3aU9qUTBNQ0lz",
    "SW1KNUlqb2libVYwZFdKbGJuUXRZV2xzSWl3aVlYTjBJbDE5",
  ],
  "consultoria-financeiro": [
    "aHR0cHM6Ly9hcHAucG93ZXJiaS5jb20vdmlldz9yPWV5SnJJam9pT0RneU0yTTFObUl0TmprMFl5TTFMVE0xTVRNek9XSTNMbE5rWVp6WXpNMU9ORkws",
    "aWdpdCI6IjRmYWUwODcwLTIwYWEtNGNhMy1iMzE2LTM0N2E1N2IyZWQxMCJ9",
  ],
  "financeiro-principal": [
    "aHR0cHM6Ly9hcHAucG93ZXJiaS5jb20vdmlldz9yPWV5SnJJam9pTW1Jek5EZzBOakEyTFdGbVpHVXROMk01WVRoa01tSTROemd4SWl3aWRISnZhMlZ5WlhNaU9p",
    "SjRmYWUwODcwLTIwYWEtNGNhMy1iMzE2LTM0N2E1N2IyZWQxMCJ9",
  ],
  "avaliacao-ativos": [
    "aHR0cHM6Ly9hcHAucG93ZXJiaS5jb20vdmlldz9yPWV5SnJJam9pTldNeU1EVXpNVGMwTkRZd0xPVXlOMlV0WW1FNE1TMWxNRFV6TVRZME16bGtPRFFpTENKemFXUWlPaUo0",
    "ZmFjZjA4NzAtMjBhYS00Y2EzLWIzMTYtMzQ3YTU3YjJlZDEwQ0p5TWlMQ0pqWkNJNkltTTlMQ0p1YjI1bElqb2k=",
  ],
  "financeiro-comercial": [],
  "financeiro-operacional": [],
  "financeiro-financeiro": [],
  "avaliacao-ativos-comercial": [],
  "avaliacao-ativos-operacional": [],
  "avaliacao-ativos-financeiro": [],
  "comunicacao-comercial": [],
  "comunicacao-operacional": [],
  "comunicacao-financeiro": [],
  "levantamento-safra-comercial": [],
  "levantamento-safra-operacional": [],
  "levantamento-safra-financeiro": [],
  "projetos-comercial": [],
  "projetos-operacional": [],
  "projetos-financeiro": [],
  "desenvolvimento-inovacao-comercial": [],
  "desenvolvimento-inovacao-operacional": [],
  "desenvolvimento-inovacao-financeiro": [],
  "agroeconomics-comercial": [],
  "agroeconomics-operacional": [],
  "agroeconomics-financeiro": [],
};

const DEFAULT_POWER_BI_LINKS: PowerBiLinkMap = {
  "consultoria-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["consultoria-comercial"]),
  "consultoria-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["consultoria-operacional"]),
  "consultoria-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["consultoria-financeiro"]),
  "financeiro-principal": fromEncodedSegments(ENCODED_DEFAULT_LINKS["financeiro-principal"]),
  "avaliacao-ativos": fromEncodedSegments(ENCODED_DEFAULT_LINKS["avaliacao-ativos"]),
  "financeiro-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["financeiro-comercial"]),
  "financeiro-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["financeiro-operacional"]),
  "financeiro-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["financeiro-financeiro"]),
  "avaliacao-ativos-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["avaliacao-ativos-comercial"]),
  "avaliacao-ativos-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["avaliacao-ativos-operacional"]),
  "avaliacao-ativos-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["avaliacao-ativos-financeiro"]),
  "comunicacao-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["comunicacao-comercial"]),
  "comunicacao-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["comunicacao-operacional"]),
  "comunicacao-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["comunicacao-financeiro"]),
  "levantamento-safra-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["levantamento-safra-comercial"]),
  "levantamento-safra-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["levantamento-safra-operacional"]),
  "levantamento-safra-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["levantamento-safra-financeiro"]),
  "projetos-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["projetos-comercial"]),
  "projetos-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["projetos-operacional"]),
  "projetos-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["projetos-financeiro"]),
  "desenvolvimento-inovacao-comercial": fromEncodedSegments(
    ENCODED_DEFAULT_LINKS["desenvolvimento-inovacao-comercial"],
  ),
  "desenvolvimento-inovacao-operacional": fromEncodedSegments(
    ENCODED_DEFAULT_LINKS["desenvolvimento-inovacao-operacional"],
  ),
  "desenvolvimento-inovacao-financeiro": fromEncodedSegments(
    ENCODED_DEFAULT_LINKS["desenvolvimento-inovacao-financeiro"],
  ),
  "agroeconomics-comercial": fromEncodedSegments(ENCODED_DEFAULT_LINKS["agroeconomics-comercial"]),
  "agroeconomics-operacional": fromEncodedSegments(ENCODED_DEFAULT_LINKS["agroeconomics-operacional"]),
  "agroeconomics-financeiro": fromEncodedSegments(ENCODED_DEFAULT_LINKS["agroeconomics-financeiro"]),
};

const POWER_BI_SECTIONS: Record<
  PowerBiSection,
  {
    label: string;
    team: string;
  }
> = {
  "consultoria-comercial": { label: "Painel Comercial", team: "Consultoria" },
  "consultoria-operacional": { label: "Painel Operacional", team: "Consultoria" },
  "consultoria-financeiro": { label: "Painel Financeiro", team: "Consultoria" },
  "financeiro-principal": { label: "Painel Financeiro", team: "Financeiro" },
  "avaliacao-ativos": { label: "Avaliação de Ativos", team: "Avaliação de Ativos" },
  "financeiro-comercial": { label: "Painel Comercial", team: "Financeiro" },
  "financeiro-operacional": { label: "Painel Operacional", team: "Financeiro" },
  "financeiro-financeiro": { label: "Painel Financeiro", team: "Financeiro" },
  "avaliacao-ativos-comercial": { label: "Painel Comercial", team: "Avaliação de Ativos" },
  "avaliacao-ativos-operacional": { label: "Painel Operacional", team: "Avaliação de Ativos" },
  "avaliacao-ativos-financeiro": { label: "Painel Financeiro", team: "Avaliação de Ativos" },
  "comunicacao-comercial": { label: "Painel Comercial", team: "Comunicação" },
  "comunicacao-operacional": { label: "Painel Operacional", team: "Comunicação" },
  "comunicacao-financeiro": { label: "Painel Financeiro", team: "Comunicação" },
  "levantamento-safra-comercial": { label: "Painel Comercial", team: "Levantamento de Safra" },
  "levantamento-safra-operacional": { label: "Painel Operacional", team: "Levantamento de Safra" },
  "levantamento-safra-financeiro": { label: "Painel Financeiro", team: "Levantamento de Safra" },
  "projetos-comercial": { label: "Painel Comercial", team: "Projetos" },
  "projetos-operacional": { label: "Painel Operacional", team: "Projetos" },
  "projetos-financeiro": { label: "Painel Financeiro", team: "Projetos" },
  "desenvolvimento-inovacao-comercial": { label: "Painel Comercial", team: "Desenvolvimento e Inovação" },
  "desenvolvimento-inovacao-operacional": { label: "Painel Operacional", team: "Desenvolvimento e Inovação" },
  "desenvolvimento-inovacao-financeiro": { label: "Painel Financeiro", team: "Desenvolvimento e Inovação" },
  "agroeconomics-comercial": { label: "Painel Comercial", team: "AgroEconomics" },
  "agroeconomics-operacional": { label: "Painel Operacional", team: "AgroEconomics" },
  "agroeconomics-financeiro": { label: "Painel Financeiro", team: "AgroEconomics" },
};

const STORAGE_KEY = "powerbi-links";

interface PowerBiContextValue {
  links: PowerBiLinkMap;
  updateLink: (section: PowerBiSection, url: string) => void;
}

const PowerBiContext = createContext<PowerBiContextValue | null>(null);

export const PowerBiProvider = ({ children }: { children: ReactNode }) => {
  const [links, setLinks] = useState<PowerBiLinkMap>(() => {
    if (typeof window === "undefined") return DEFAULT_POWER_BI_LINKS;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PowerBiLinkMap>;
        return { ...DEFAULT_POWER_BI_LINKS, ...parsed };
      }
    } catch (error) {
      console.error("Erro ao carregar links do Power BI salvos:", error);
    }

    return DEFAULT_POWER_BI_LINKS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    } catch (error) {
      console.error("Erro ao salvar links do Power BI:", error);
    }
  }, [links]);

  const updateLink = (section: PowerBiSection, url: string) => {
    const nextUrl = sanitizePowerBiValue(url);
    setLinks((prev) => ({ ...prev, [section]: nextUrl }));
  };

  return <PowerBiContext.Provider value={{ links, updateLink }}>{children}</PowerBiContext.Provider>;
};

export const usePowerBi = () => {
  const ctx = useContext(PowerBiContext);
  if (!ctx) {
    throw new Error("usePowerBi deve ser usado dentro de um PowerBiProvider");
  }
  return ctx;
};

export { DEFAULT_POWER_BI_LINKS, POWER_BI_SECTIONS };
