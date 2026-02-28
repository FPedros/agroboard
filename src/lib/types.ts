export type PowerBiPanel = "comercial" | "operacional" | "financeiro" | "principal";

export interface Sector {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface PowerBiLink {
  id: string;
  sectorId: string;
  panel: PowerBiPanel;
  url: string;
  createdAt: string;
  updatedAt: string;
}
