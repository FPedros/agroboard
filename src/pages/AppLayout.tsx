import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  Building2,
  ClipboardList,
  Sprout,
  FolderKanban,
  PiggyBank,
  FlaskConical,
  Globe2,
  Megaphone,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

type NeuralNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulseOffset: number;
  pulseSpeed: number;
};

const sectors = [
  {
    name: "AgroEconomics",
    description: "Análises macro, mercado e competitividade.",
    path: "/app/setor/agroeconomics",
    icon: Globe2,
  },
  {
    name: "Avaliação de Ativos",
    description: "Valuation, análise patrimonial e ativos estratégicos.",
    path: "/app/setor/avaliacao-ativos",
    icon: ClipboardList,
  },
  {
    name: "Consultoria",
    description: "Dashboards de inteligência de mercado e performance comercial.",
    path: "/app/setor/consultoria",
    icon: Building2,
  },
  {
    name: "Comunicação",
    description: "Campanhas, branding e comunicação institucional.",
    path: "/app/setor/comunicacao",
    icon: Megaphone,
  },
  {
    name: "Desenvolvimento e Inovação",
    description: "Iniciativas, experimentação e P&D.",
    path: "/app/setor/desenvolvimento-inovacao",
    icon: FlaskConical,
  },
  {
    name: "Financeiro",
    description: "Visão financeira, margens, custos e KPIs.",
    path: "/app/financeiro",
    icon: PiggyBank,
  },
  {
    name: "Levantamento de Safra",
    description: "Produção, produtividade e estimativas de safra.",
    path: "/app/setor/levantamento-safra",
    icon: Sprout,
  },
  {
    name: "Projetos",
    description: "Portfólio, pipeline e execução de projetos.",
    path: "/app/setor/projetos",
    icon: FolderKanban,
  },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isBasePath = location.pathname === "/app" || location.pathname === "/app/";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isBasePath) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let nodes: NeuralNode[] = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = 60;
      nodes = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomBetween(0.50, 1.25);
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: randomBetween(1, 3),
          pulseOffset: Math.random() * Math.PI * 2,
          pulseSpeed: randomBetween(0.6, 1.2),
        };
      });
    };

    const draw = () => {
      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;
      }

      const time = performance.now() / 1000;
      const maxDistance = Math.min(200, Math.max(140, Math.min(width, height) * 0.25));
      context.lineWidth = 1;
      context.globalCompositeOperation = "lighter";

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.55;
            context.strokeStyle = `rgba(120, 255, 210, ${alpha})`;
            context.shadowBlur = 0;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(time * node.pulseSpeed + node.pulseOffset);
        const glowAlpha = 0.55 + pulse * 0.35;
        const radius = node.radius * (0.9 + pulse * 0.2);
        context.shadowBlur = 14;
        context.shadowColor = "rgba(120, 255, 210, 0.7)";
        context.fillStyle = `rgba(120, 255, 210, ${glowAlpha})`;
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, Math.PI * 2);
        context.fill();
      }

      if (!reduceMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isBasePath]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {!isBasePath && <Sidebar />}
      <main className={`flex-1 min-h-0 overflow-hidden ${!isBasePath ? 'p-4 md:p-6 bg-background/40' : ''}`}>
        {isBasePath ? (
          <div 
            className="relative flex h-full items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #202956 0%, #1A445F 50%, #008747 100%)",
            }}
          >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full z-0 pointer-events-none" aria-hidden="true" />
            
            <div className="relative z-20 w-full max-w-6xl px-4">
              <div className="mb-8 space-y-3 text-center text-white">
                <h1 className="text-4xl font-bold">Escolha o setor para continuar</h1>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sectors.map((sector) => {
                  const Icon = sector.icon;
                  return (
                    <button
                      key={sector.path}
                      onClick={() => navigate(sector.path)}
                      style={{
                        background: "linear-gradient(140deg, rgba(32, 41, 86, 0.45) 0%, rgba(26, 68, 95, 0.38) 45%, rgba(0, 135, 71, 0.2) 100%)",
                        borderColor: "rgba(120, 255, 210, 0.18)",
                        boxShadow: "0 25px 80px rgba(6, 14, 32, 0.6)"
                      }}
                      className="group relative w-full rounded-xl border backdrop-blur-xl p-6 text-left transition-all hover:-translate-y-1 hover:border-[#78FFD2]/40 hover:shadow-[0_8px_32px_rgba(120,255,210,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78FFD2]/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#78FFD2]/15 text-[#78FFD2] group-hover:bg-[#78FFD2]/25 transition-colors">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-white mb-1">{sector.name}</p>
                          <p className="text-sm text-[#D7FFF1]/70">{sector.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 w-full overflow-hidden">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
};

export default AppLayout;
