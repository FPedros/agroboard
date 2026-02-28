import { useState } from "react";
import { House, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/mockProducts";

const mainMenuItems = [
  {
    id: "home",
    title: "Início",
    path: "/app/inicio",
    icon: House,
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex h-screen shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
        <Link
          to="/app/inicio"
          className={cn(
            "flex flex-1 items-center gap-3 text-sidebar-foreground transition-all duration-200",
            isCollapsed && "justify-center",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Leaf className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <h2 className="text-lg font-bold text-sidebar-foreground">Agroboard</h2>
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

      <nav className={cn("flex-1 overflow-y-auto p-4", isCollapsed && "px-2")}>
        <div className="space-y-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-3",
                )}
                activeClassName="bg-sidebar-accent text-primary font-medium shadow-sm"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="text-sm">{item.title}</span>}
              </NavLink>
            );
          })}
        </div>

        <div className={cn("mt-6", isCollapsed && "mt-4")}>
          {!isCollapsed && (
            <p className="px-4 pb-2 text-xs uppercase tracking-wide text-sidebar-foreground/55">Produtos</p>
          )}

          <div className="space-y-2">
            {PRODUCTS.map((product) => (
              <NavLink
                key={product.id}
                to={`/app/produtos/${product.id}`}
                title={isCollapsed ? product.name : undefined}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent",
                  isCollapsed && "justify-center px-3",
                )}
                activeClassName="bg-sidebar-accent text-primary font-medium shadow-sm"
              >
                {isCollapsed ? (
                  <span className="text-xs font-semibold text-sidebar-foreground/80">
                    {product.name.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-sm">{product.name}</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-4 flex flex-col gap-3",
          isCollapsed ? "items-center" : "items-stretch",
        )}
      >
        <ThemeToggle />
        <UserMenu collapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;
