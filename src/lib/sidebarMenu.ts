import {
  type LucideIcon,
  ClipboardList,
  FlaskConical,
  Globe2,
  Building2,
  PiggyBank,
  Sprout,
  FolderKanban,
  Megaphone,
} from "lucide-react";
import { type PowerBiSection } from "@/contexts/PowerBiContext";

export type BaseMenuItem = {
  title: string;
  path: string;
  powerBiKey?: PowerBiSection;
};

const sharedMenuItems: BaseMenuItem[] = [{ title: "Relatórios", path: "/app/relatorios" }];

const sectorMenus: Record<string, BaseMenuItem[]> = {
  consultoria: [
    { title: "Painel Comercial", path: "/app/comercial", powerBiKey: "consultoria-comercial" },
    { title: "Painel Operacional", path: "/app/operacional", powerBiKey: "consultoria-operacional" },
    {
      title: "Painel Financeiro",
      path: "/app/consultoria/financeiro",
      powerBiKey: "consultoria-financeiro",
    },
  ],
  financeiro: [{ title: "Painel Financeiro", path: "/app/financeiro", powerBiKey: "financeiro-principal" }],
  "avaliacao-ativos": [
    {
      title: "Avaliação de Ativos",
      path: "/app/setor/avaliacao-ativos",
      powerBiKey: "avaliacao-ativos",
    },
  ],
  comunicacao: [{ title: "Comunicação", path: "/app/setor/comunicacao" }],
  "levantamento-safra": [{ title: "Levantamento de Safra", path: "/app/setor/levantamento-safra" }],
  projetos: [{ title: "Projetos", path: "/app/setor/projetos" }],
  "desenvolvimento-inovacao": [{ title: "Desenvolvimento e Inovação", path: "/app/setor/desenvolvimento-inovacao" }],
  agroeconomics: [{ title: "AgroEconomics", path: "/app/setor/agroeconomics" }],
};

export const sectorLabels: Record<string, string> = {
  consultoria: "Consultoria",
  financeiro: "Financeiro",
  "avaliacao-ativos": "Avaliação de Ativos",
  comunicacao: "Comunicação",
  "levantamento-safra": "Levantamento de Safra",
  projetos: "Projetos",
  "desenvolvimento-inovacao": "Desenvolvimento e Inovação",
  agroeconomics: "AgroEconomics",
};

export const sectorIcons: Record<string, LucideIcon> = {
  consultoria: Building2,
  financeiro: PiggyBank,
  "avaliacao-ativos": ClipboardList,
  comunicacao: Megaphone,
  "levantamento-safra": Sprout,
  projetos: FolderKanban,
  "desenvolvimento-inovacao": FlaskConical,
  agroeconomics: Globe2,
};

const LAST_SECTOR_STORAGE_KEY = "current-sector";

const readStoredSector = () => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(LAST_SECTOR_STORAGE_KEY);
    return value && sectorMenus[value] ? value : null;
  } catch (error) {
    console.error("Erro ao ler setor salvo", error);
    return null;
  }
};

const persistSector = (sector: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SECTOR_STORAGE_KEY, sector);
  } catch (error) {
    console.error("Erro ao salvar setor", error);
  }
};

export const getSectorFromPath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "app") return "consultoria";
  const first = parts[1];
  if (first === "setor") {
    const sector = parts[2] || "consultoria";
    if (sectorMenus[sector]) persistSector(sector);
    return sectorMenus[sector] ? sector : readStoredSector() || "consultoria";
  }
  if (first === "comercial" || first === "operacional") {
    persistSector("consultoria");
    return "consultoria";
  }
  if (first === "financeiro") {
    persistSector("financeiro");
    return "financeiro";
  }
  if (sectorMenus[first]) {
    persistSector(first);
    return first;
  }

  return readStoredSector() || "consultoria";
};

const standardPanelsForSector = (sector: string): BaseMenuItem[] => [
  {
    title: "Painel Comercial",
    path: `/app/setor/${sector}/comercial`,
    powerBiKey: `${sector}-comercial` as PowerBiSection,
  },
  {
    title: "Painel Operacional",
    path: `/app/setor/${sector}/operacional`,
    powerBiKey: `${sector}-operacional` as PowerBiSection,
  },
  {
    title: "Painel Financeiro",
    path: `/app/setor/${sector}/financeiro`,
    powerBiKey: `${sector}-financeiro` as PowerBiSection,
  },
];

export const getBaseMenuItemsBySector = (sector: string): BaseMenuItem[] => {
  const existingItems = sectorMenus[sector] ?? sectorMenus.consultoria;
  const sectorLabel = sectorLabels[sector]?.toLowerCase();
  const filteredExisting = sectorLabel
    ? existingItems.filter((item) => item.title.toLowerCase() !== sectorLabel)
    : existingItems;

  const existingTitles = new Set(filteredExisting.map((item) => item.title.toLowerCase()));
  const extras = standardPanelsForSector(sector).filter((panel) => !existingTitles.has(panel.title.toLowerCase()));

  const merged = [...filteredExisting, ...extras, ...sharedMenuItems];
  const seenPaths = new Set<string>();
  return merged.filter((item) => {
    if (seenPaths.has(item.path)) return false;
    seenPaths.add(item.path);
    return true;
  });
};

export { sectorMenus };
