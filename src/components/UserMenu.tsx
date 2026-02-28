import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { User, Settings, LogOut, BarChart3, ListPlus, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  collapsed?: boolean;
}

const UserMenu = ({ collapsed = false }: UserMenuProps) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center gap-2 px-2 hover:bg-sidebar-accent",
            collapsed ? "justify-center" : "justify-start",
          )}
          aria-label={collapsed ? "Abrir menu do usuário" : undefined}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/app/perfil")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Gerenciar cadastro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/app/perfil#relatorios")}
          className="cursor-pointer"
        >
          <FileUp className="mr-2 h-4 w-4" />
          <span>Inserir relatório</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/app/powerbi")}
          className="cursor-pointer"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          <span>Inserir Power BI</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/app/itens-sidebar")}
          className="cursor-pointer"
        >
          <ListPlus className="mr-2 h-4 w-4" />
          <span>Gerenciar itens da sidebar</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
