import { useEffect, useMemo, useState } from "react";
import { NavLink } from "@/components/NavLink";
import { Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  fetchSidebarItemsForSector,
  SIDEBAR_ITEMS_EVENT,
  type SidebarMenuItem,
} from "@/lib/sidebarItems";
import { getBaseMenuItemsBySector, getSectorFromPath, sectorIcons, sectorLabels } from "@/lib/sidebarMenu";

const REPORTS_PATH = "/app/relatorios";
const PROTECTED_PATHS = new Set([REPORTS_PATH]);

const isProtectedPath = (path: string) => PROTECTED_PATHS.has(path);

const ensureReportsLast = (items: SidebarMenuItem[]) => {
  const reports = items.filter((item) => item.path === REPORTS_PATH);
  const rest = items.filter((item) => item.path !== REPORTS_PATH);
  return [...rest, ...reports];
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>([]);

  const currentSector = useMemo(() => getSectorFromPath(location.pathname), [location.pathname]);
  const sectorLabel = sectorLabels[currentSector] ?? "Setor";
  const SectorIcon = sectorIcons[currentSector] ?? Leaf;

  useEffect(() => {
    let isActive = true;

    const loadMenuItems = async () => {
      const baseItems = getBaseMenuItemsBySector(currentSector);
      const fallbackItems = baseItems.map((item) => ({
        ...item,
        id: item.path,
        isCustom: false,
      }));

      if (isActive) {
        setMenuItems(ensureReportsLast(fallbackItems));
      }

      try {
        const { customItems, hiddenPaths, renamedTitles } = await fetchSidebarItemsForSector(currentSector);
        const visibleBase = baseItems
          .filter((item) => !hiddenPaths.has(item.path) || isProtectedPath(item.path))
          .map((item) => ({
            ...item,
            id: item.path,
            title: renamedTitles.get(item.path) || item.title,
            isCustom: false,
          }));

        if (isActive) {
          setMenuItems(ensureReportsLast([...visibleBase, ...customItems]));
        }
      } catch (error) {
        console.error("Erro ao carregar itens da sidebar", error);
      }
    };

    loadMenuItems();

    const handleUpdate = () => {
      loadMenuItems();
    };

    window.addEventListener(SIDEBAR_ITEMS_EVENT, handleUpdate);

    return () => {
      isActive = false;
      window.removeEventListener(SIDEBAR_ITEMS_EVENT, handleUpdate);
    };
  }, [currentSector]);

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
        <Link
          to="/app"
          className={cn(
            "flex flex-1 items-center gap-3 text-sidebar-foreground transition-all duration-200",
            isCollapsed && "justify-center",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <SectorIcon className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <h2 className="text-lg font-bold text-sidebar-foreground">{sectorLabel}</h2>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className={cn("flex-1 p-4", isCollapsed && "px-2")}>
        <div className="space-y-2">
          {menuItems.map((item) => {
            const collapsedLabel = item.title
              .split(" ")
              .filter(Boolean)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-3",
                )}
                activeClassName={cn(
                  "bg-sidebar-accent text-primary font-medium shadow-sm",
                  isCollapsed && "text-primary",
                )}
              >
                {isCollapsed ? (
                  <span className="text-xs font-semibold text-sidebar-foreground/80">{collapsedLabel}</span>
                ) : (
                  <span className="text-sm">{item.title}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-4 flex flex-col gap-3",
          isCollapsed ? "items-center" : "items-stretch",
        )}
      >
        <ThemeToggle />
        <Button
          variant="ghost"
          onClick={() => navigate("/app")}
          className={cn(
            "flex items-center gap-2 px-2 text-sidebar-foreground hover:bg-sidebar-accent",
            isCollapsed ? "justify-center" : "justify-start",
          )}
          aria-label={isCollapsed ? "Selecionar outro setor" : undefined}
        >
          <ChevronLeft className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm font-medium">Escolher outro setor</span>}
        </Button>
        <UserMenu collapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;
