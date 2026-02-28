import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { PowerBiProvider } from "./contexts/PowerBiContext";
import LandingPage from "./pages/LandingPage";
import AppLayout from "./pages/AppLayout";
import ComercialPage from "./pages/ComercialPage";
import OperacionalPage from "./pages/OperacionalPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import AvaliacaoAtivosPage from "./pages/AvaliacaoAtivosPage";
import ConsultoriaFinanceiroPage from "./pages/ConsultoriaFinanceiroPage";
import PerfilPage from "./pages/PerfilPage";
import PowerBiSettingsPage from "./pages/PowerBiSettingsPage";
import RecuperarSenhaPage from "./pages/RecuperarSenhaPage";
import NotFound from "./pages/NotFound";
import SectorPage from "./pages/SectorPage";
import SectorPanelPage from "./pages/SectorPanelPage";
import SidebarItemsPage from "./pages/SidebarItemsPage";
import SidebarItemDetailPage from "./pages/SidebarItemDetailPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import { useTheme } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const ThemeApplier = () => {
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    const inApp = location.pathname.startsWith("/app");
    const appliedTheme = inApp ? theme : "dark";
    root.classList.add(appliedTheme);
  }, [theme, location.pathname]);

  return null;
};

const ProtectedAppLayout = () => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <PowerBiProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ThemeApplier />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
              <Route path="/app" element={<ProtectedAppLayout />}>
                <Route path="comercial" element={<ComercialPage />} />
                <Route path="operacional" element={<OperacionalPage />} />
              <Route path="consultoria/financeiro" element={<ConsultoriaFinanceiroPage />} />
              <Route path="financeiro" element={<FinanceiroPage />} />
              <Route path="setor/:sectorId/custom/:itemId" element={<SidebarItemDetailPage />} />
              <Route path="setor/:sectorId/:panelId" element={<SectorPanelPage />} />
              <Route path="setor/avaliacao-ativos" element={<AvaliacaoAtivosPage />} />
              <Route path="setor/:sectorId" element={<SectorPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="powerbi" element={<PowerBiSettingsPage />} />
              <Route path="itens-sidebar" element={<SidebarItemsPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PowerBiProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
