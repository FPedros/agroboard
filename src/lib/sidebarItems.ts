import { supabase } from "@/lib/supabaseClient";
import { type PowerBiSection } from "@/contexts/PowerBiContext";

export type SidebarCustomItem = {
  id: string;
  title: string;
  path: string;
  sector: string;
  powerBiUrl?: string;
};

export type SidebarMenuItem = {
  id: string;
  title: string;
  path: string;
  powerBiKey?: PowerBiSection;
  isCustom: boolean;
  isProtected?: boolean;
};

type SidebarDbItem = {
  id: string;
  title: string;
  path: string;
  sector: string;
  is_custom: boolean;
  is_hidden: boolean;
  powerbi_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

const nowIso = () => new Date().toISOString();

const sanitizePowerBiValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  
  // Extrai URL do iframe se for um iframe completo
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  const url = match?.[1] || trimmed;
  
  // Valida se é um link do Power BI
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('powerbi.com')) {
      throw new Error('O link deve ser do Power BI (app.powerbi.com)');
    }
    return url;
  } catch (error) {
    if (error instanceof Error && error.message.includes('powerbi.com')) {
      throw error;
    }
    throw new Error('Link inválido. Cole a URL completa ou o iframe do Power BI.');
  }
};

export const SIDEBAR_ITEMS_EVENT = "sidebar-items-updated";

export const notifySidebarItemsUpdated = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIDEBAR_ITEMS_EVENT));
};

export const createSidebarItemId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const buildCustomItemPath = (sector: string, id: string) => `/app/setor/${sector}/custom/${id}`;

export const buildHiddenItemId = (sector: string, path: string) => `hidden:${sector}:${path}`;

const mapToCustomItem = (item: SidebarDbItem): SidebarCustomItem => ({
  id: item.id,
  title: item.title,
  path: item.path,
  sector: item.sector,
  powerBiUrl: item.powerbi_url ?? "",
});

export const fetchSidebarItemsBySector = async (sector: string): Promise<SidebarDbItem[]> => {
  const { data, error } = await supabase
    .from<SidebarDbItem>("sidebar_items")
    .select("*")
    .eq("sector", sector)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
};

export const fetchSidebarItemById = async (id: string, sector?: string): Promise<SidebarCustomItem | null> => {
  let query = supabase
    .from<SidebarDbItem>("sidebar_items")
    .select("*")
    .eq("id", id)
    .eq("is_custom", true)
    .eq("is_hidden", false);

  if (sector) {
    query = query.eq("sector", sector);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapToCustomItem(data) : null;
};

export const fetchSidebarItemsForSector = async (sector: string): Promise<{
  customItems: SidebarMenuItem[];
  hiddenPaths: Set<string>;
  renamedTitles: Map<string, string>;
}> => {
  const items = await fetchSidebarItemsBySector(sector);
  const hiddenPaths = new Set(
    items.filter((item) => !item.is_custom && item.is_hidden).map((item) => item.path),
  );
  
  const renamedTitles = new Map(
    items
      .filter((item) => !item.is_custom && !item.is_hidden && item.id.startsWith("renamed:"))
      .map((item) => [item.path, item.title])
  );
  
  const customItems = items
    .filter((item) => item.is_custom && !item.is_hidden)
    .map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
      isCustom: true,
    }));

  return { customItems, hiddenPaths, renamedTitles };
};

export const insertCustomSidebarItem = async (params: { sector: string; title: string }): Promise<SidebarCustomItem> => {
  const id = createSidebarItemId();
  const now = nowIso();
  const payload: SidebarDbItem = {
    id,
    sector: params.sector,
    title: params.title.trim(),
    path: buildCustomItemPath(params.sector, id),
    is_custom: true,
    is_hidden: false,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from<SidebarDbItem>("sidebar_items")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Não foi possível salvar o item da sidebar.");
  }

  return mapToCustomItem(data);
};

export const deleteSidebarItem = async (id: string) => {
  const { error } = await supabase.from("sidebar_items").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
};

export const updateSidebarItemLink = async (id: string, url: string) => {
  const safeUrl = sanitizePowerBiValue(url);
  const { error } = await supabase
    .from<SidebarDbItem>("sidebar_items")
    .update({ powerbi_url: safeUrl, updated_at: nowIso() })
    .eq("id", id)
    .eq("is_custom", true);

  if (error) {
    throw new Error(error.message);
  }

  return safeUrl;
};

export const updateSidebarItemTitle = async (id: string, title: string) => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("O título não pode estar vazio.");
  }

  const { error } = await supabase
    .from<SidebarDbItem>("sidebar_items")
    .update({ title: trimmedTitle, updated_at: nowIso() })
    .eq("id", id)
    .eq("is_custom", true);

  if (error) {
    throw new Error(error.message);
  }

  return trimmedTitle;
};

export const updateBaseItemTitle = async (params: { sector: string; path: string; newTitle: string }) => {
  const now = nowIso();
  const id = `renamed:${params.sector}:${params.path}`;
  
  const payload: SidebarDbItem = {
    id,
    sector: params.sector,
    title: params.newTitle.trim(),
    path: params.path,
    is_custom: false,
    is_hidden: false,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from<SidebarDbItem>("sidebar_items").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }

  return params.newTitle.trim();
};

export const hideBuiltInSidebarItem = async (params: { sector: string; title: string; path: string }) => {
  const now = nowIso();
  const payload: SidebarDbItem = {
    id: buildHiddenItemId(params.sector, params.path),
    sector: params.sector,
    title: params.title,
    path: params.path,
    is_custom: false,
    is_hidden: true,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase.from<SidebarDbItem>("sidebar_items").upsert(payload, { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }
};
