import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { POWER_BI_SECTIONS, PowerBiSection } from "@/contexts/PowerBiContext";
import { fetchSidebarItemsForSector, updateSidebarItemLink, type SidebarMenuItem } from "@/lib/sidebarItems";
import { getBaseMenuItemsBySector, getSectorFromPath, sectorLabels } from "@/lib/sidebarMenu";
import { PowerBiPanel } from "@/lib/types";
import { upsertPowerBiLink } from "@/lib/powerBiRepository";

type SectionOption = {
  value: string;
  label: string;
  kind: "padrao" | "custom";
};

const CUSTOM_PREFIX = "custom:";

const PowerBiSettingsPage = () => {
  const location = useLocation();
  const locationState = location.state as { selectedItemId?: string; selectedItemTitle?: string } | null;
  const [selectedSection, setSelectedSection] = useState("");
  const [newLink, setNewLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [customItems, setCustomItems] = useState<SidebarMenuItem[]>([]);
  const [hiddenPaths, setHiddenPaths] = useState<string[]>([]);
  const [renamedTitles, setRenamedTitles] = useState<Map<string, string>>(new Map());
  const [itemsError, setItemsError] = useState("");
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  const currentSector = useMemo(() => getSectorFromPath(location.pathname), [location.pathname]);

  useEffect(() => {
    let isActive = true;

    const loadCustomItems = async () => {
      setIsItemsLoading(true);
      setItemsError("");
      try {
        const { customItems: fetchedCustomItems, hiddenPaths: hidden, renamedTitles: renamed } = await fetchSidebarItemsForSector(
          currentSector,
        );
        if (isActive) {
          setCustomItems(fetchedCustomItems);
          setHiddenPaths(Array.from(hidden));
          setRenamedTitles(renamed);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar itens da sidebar.";
        if (isActive) {
          setItemsError(message);
          setCustomItems([]);
          setHiddenPaths([]);
          setRenamedTitles(new Map());
        }
      } finally {
        if (isActive) {
          setIsItemsLoading(false);
        }
      }
    };

    loadCustomItems();

    return () => {
      isActive = false;
    };
  }, [currentSector]);

  const standardSections = useMemo<SectionOption[]>(() => {
    const hiddenSet = new Set(hiddenPaths);
    const items = getBaseMenuItemsBySector(currentSector).filter((item) => !hiddenSet.has(item.path));
    const keys = items
      .map((item) => item.powerBiKey)
      .filter((key): key is PowerBiSection => Boolean(key) && key in POWER_BI_SECTIONS);
    const uniqueKeys = Array.from(new Set(keys));
    return uniqueKeys.map((section) => {
      const item = items.find(i => i.powerBiKey === section);
      const title = item ? (renamedTitles.get(item.path) || item.title) : POWER_BI_SECTIONS[section].label;
      return {
        value: section,
        label: title,
        kind: "padrao",
      };
    });
  }, [currentSector, hiddenPaths, renamedTitles]);

  const customSections = useMemo<SectionOption[]>(
    () =>
      customItems.map((item) => ({
        value: `${CUSTOM_PREFIX}${item.id}`,
        label: item.title,
        kind: "custom",
      })),
    [customItems],
  );

  const availableSections = useMemo(
    () => [...standardSections, ...customSections],
    [standardSections, customSections],
  );

  useEffect(() => {
    if (!availableSections.some((item) => item.value === selectedSection)) {
      // Se veio de um item específico, tenta selecionar ele
      if (locationState?.selectedItemId) {
        const customValue = `${CUSTOM_PREFIX}${locationState.selectedItemId}`;
        const foundItem = availableSections.find(item => item.value === customValue);
        if (foundItem) {
          setSelectedSection(customValue);
          return;
        }
      }
      // Caso contrário, seleciona o primeiro disponível
      setSelectedSection(availableSections[0]?.value ?? "");
    }
  }, [availableSections, selectedSection, locationState]);

  const parseSection = (section: PowerBiSection): { sectorSlug: string; panel: PowerBiPanel } | null => {
    const panels: PowerBiPanel[] = ["comercial", "operacional", "financeiro", "principal"];
    const match = panels.find((panel) => section.endsWith(`-${panel}`));
    if (match) {
      const sectorSlug = section.slice(0, section.length - (match.length + 1));
      if (!sectorSlug) return null;
      return { sectorSlug, panel: match };
    }

    if (section === "avaliacao-ativos") {
      return { sectorSlug: "avaliacao-ativos", panel: "principal" };
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSection || !newLink.trim()) return;

    setIsSaving(true);
    try {
      const selectedOption = availableSections.find((item) => item.value === selectedSection);

      if (selectedSection.startsWith(CUSTOM_PREFIX)) {
        const itemId = selectedSection.slice(CUSTOM_PREFIX.length);
        if (!itemId) {
          toast({ title: "Erro", description: "Item personalizado inválido.", variant: "destructive" });
          return;
        }

        await updateSidebarItemLink(itemId, newLink);
        toast({
          title: "Power BI atualizado",
          description: `${selectedOption?.label ?? "Item personalizado"} agora usa o novo link.`,
        });
      } else {
        if (!(selectedSection in POWER_BI_SECTIONS)) {
          toast({ title: "Erro", description: "Seção inválida.", variant: "destructive" });
          return;
        }

        const parsed = parseSection(selectedSection as PowerBiSection);
        if (!parsed) {
          toast({
            title: "Erro",
            description: "Não foi possível identificar setor/painel para esta seção.",
            variant: "destructive",
          });
          return;
        }

        await upsertPowerBiLink({
          sectorSlug: parsed.sectorSlug,
          panel: parsed.panel,
          url: newLink,
          sectorName: sectorLabels[currentSector] ?? parsed.sectorSlug,
        });

        toast({
          title: "Power BI atualizado",
          description: `${POWER_BI_SECTIONS[selectedSection as PowerBiSection].label} agora usa o novo link.`,
        });
      }

      setNewLink("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar link do Power BI";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const hasSections = availableSections.length > 0;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Inserir Power BI</h1>
        <p className="text-muted-foreground">
          Selecione a seção do setor atual ({sectorLabels[currentSector] ?? "Setor"}) e atualize o link do painel.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="secaoPowerBi">Seção do setor atual</Label>
            <Select
              value={selectedSection}
              onValueChange={(value) => setSelectedSection(value)}
              disabled={!hasSections}
            >
              <SelectTrigger id="secaoPowerBi">
                <SelectValue
                  placeholder={
                    hasSections
                      ? "Escolha qual seção deseja trocar"
                      : isItemsLoading
                        ? "Carregando seções..."
                        : "Nenhuma seção disponível para este setor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {standardSections.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
                {customSections.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {itemsError && <p className="text-sm text-red-500">{itemsError}</p>}
          </div>

          {selectedSection && (
            <div className="space-y-2">
              <Label htmlFor="novoLink">Novo link do Power BI</Label>
              <Textarea
                id="novoLink"
                placeholder='Cole o link ou o iframe completo (ex: <iframe ... src="https://app.powerbi.com/..."></iframe>)'
                value={newLink}
                onChange={(event) => setNewLink(event.target.value)}
                required
                className="min-h-24"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={!selectedSection || !newLink.trim() || isSaving}>
              {isSaving ? "Salvando..." : "Salvar novo link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PowerBiSettingsPage;
