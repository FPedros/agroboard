import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Sector } from "@/lib/types";

type NeuralNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

const TestPage = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ data?: Sector[]; error?: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.from<Sector>("sectors").select("*").limit(5);
      if (error) {
        setResult({ error: error.message });
      } else {
        setResult({ data });
      }
      setLoading(false);
    };

    run();
  }, []);

  useEffect(() => {
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

      const count = Math.min(110, Math.max(45, Math.floor((width * height) / 14000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: randomBetween(-0.35, 0.35),
        vy: randomBetween(-0.35, 0.35),
        radius: randomBetween(1, 2.4),
      }));
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

      const maxDistance = Math.min(200, Math.max(120, Math.min(width, height) * 0.18));
      context.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDistance) {
            const alpha = 1 - dist / maxDistance;
            context.strokeStyle = `rgba(0, 255, 210, ${alpha * 0.35})`;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        context.fillStyle = "rgba(0, 255, 210, 0.85)";
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
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
  }, []);

  const consolePayload = loading
    ? "Testando conexão..."
    : JSON.stringify(result ?? { error: "Sem dados" }, null, 2);

  return (
    <div className="bi-scene">
      <canvas ref={canvasRef} className="bi-canvas" aria-hidden="true" />
      <div className="bi-content">
        <span className="bi-eyebrow">rede neural ativa</span>
        <h1 className="bi-title">BI</h1>
        <p className="bi-subtitle">
          feito com <span className="bi-js">JS fluorescente</span>
        </p>
      </div>
      <pre className="bi-console" aria-live="polite">
        {consolePayload}
      </pre>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Rajdhani:wght@400;600&display=swap");

        .bi-scene {
          --neon: 0 255 210;
          --neon-strong: 20 255 170;
          --bg: 4 5 7;
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          background: radial-gradient(120% 80% at 50% 10%, rgba(var(--neon), 0.18), rgba(var(--bg), 0.95) 60%),
            radial-gradient(60% 60% at 15% 85%, rgba(0, 150, 120, 0.15), transparent 70%),
            #000;
          color: rgb(230, 255, 248);
          font-family: "Rajdhani", sans-serif;
        }

        .bi-scene::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 20%, rgba(var(--neon), 0.18), transparent 55%),
            radial-gradient(circle at 85% 30%, rgba(0, 200, 150, 0.12), transparent 60%),
            radial-gradient(circle at 60% 80%, rgba(0, 120, 110, 0.18), transparent 70%);
          opacity: 0.7;
          pointer-events: none;
          z-index: 1;
        }

        .bi-scene::after {
          content: "";
          position: absolute;
          inset: -40%;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.04) 0px,
            transparent 1px,
            transparent 5px
          );
          opacity: 0.2;
          mix-blend-mode: screen;
          animation: scan 10s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .bi-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .bi-content {
          position: relative;
          z-index: 2;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(2rem, 6vw, 6rem) 1.5rem;
          gap: 1rem;
        }

        .bi-eyebrow {
          font-size: clamp(0.85rem, 2.6vw, 1.1rem);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(180, 255, 230, 0.8);
        }

        .bi-title {
          font-family: "Orbitron", sans-serif;
          font-size: clamp(4rem, 18vw, 12rem);
          letter-spacing: 0.2em;
          margin: 0;
          color: rgb(235, 255, 248);
          text-shadow:
            0 0 12px rgba(var(--neon), 0.7),
            0 0 30px rgba(var(--neon), 0.45),
            0 0 60px rgba(var(--neon), 0.35);
          animation: pulse 6s ease-in-out infinite;
        }

        .bi-subtitle {
          font-size: clamp(1rem, 3vw, 1.5rem);
          color: rgba(210, 255, 240, 0.8);
          margin: 0;
        }

        .bi-js {
          color: rgb(235, 255, 250);
          text-shadow:
            0 0 8px rgba(var(--neon-strong), 0.8),
            0 0 20px rgba(var(--neon-strong), 0.6),
            0 0 50px rgba(var(--neon-strong), 0.4);
          font-weight: 600;
        }

        .bi-console {
          position: absolute;
          right: clamp(1rem, 4vw, 2.5rem);
          bottom: clamp(1rem, 4vw, 2.5rem);
          max-width: min(360px, 90vw);
          max-height: 40vh;
          overflow: auto;
          padding: 1rem 1.25rem;
          background: rgba(3, 5, 6, 0.7);
          border: 1px solid rgba(var(--neon), 0.3);
          border-radius: 16px;
          font-size: 0.8rem;
          line-height: 1.4;
          color: rgba(214, 255, 245, 0.9);
          box-shadow:
            0 0 20px rgba(var(--neon), 0.15),
            inset 0 0 20px rgba(0, 0, 0, 0.6);
          z-index: 2;
          white-space: pre-wrap;
        }

        @keyframes pulse {
          0%,
          100% {
            text-shadow:
              0 0 10px rgba(var(--neon), 0.65),
              0 0 26px rgba(var(--neon), 0.45),
              0 0 60px rgba(var(--neon), 0.3);
          }
          50% {
            text-shadow:
              0 0 18px rgba(var(--neon), 0.9),
              0 0 40px rgba(var(--neon), 0.6),
              0 0 80px rgba(var(--neon), 0.45);
          }
        }

        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(20%);
          }
        }

        @media (max-width: 640px) {
          .bi-content {
            min-height: auto;
            padding-top: 5rem;
          }

          .bi-console {
            position: relative;
            right: auto;
            bottom: auto;
            margin: 1.5rem auto 0;
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bi-title,
          .bi-scene::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TestPage;
