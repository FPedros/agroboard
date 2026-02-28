import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import LandingPage from "./pages/LandingPage";
import AppLayout from "./pages/AppLayout";
import NotFound from "./pages/NotFound";
import StarterHomePage from "./pages/StarterHomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import { useTheme } from "./contexts/ThemeContext";

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
  <UserProvider>
    <BrowserRouter>
      <ThemeApplier />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ProtectedAppLayout />}>
          <Route index element={<StarterHomePage />} />
          <Route path="inicio" element={<StarterHomePage />} />
          <Route path="produtos/:productId" element={<ProductDetailPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </UserProvider>
);

export default App;
