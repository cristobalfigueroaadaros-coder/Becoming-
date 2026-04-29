import { useEffect, useRef } from "react";

interface FloatingDotsProps {
  count?: number;
  className?: string;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export function FloatingDots({
  count = 40,
  className = "",
  color = "167,139,250",
  minSize = 1,
  maxSize = 3,
  speed = 1,
}: FloatingDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    type Dot = {
      x: number; y: number; r: number;
      vx: number; vy: number;
      alpha: number; alphaDir: number;
    };

    const dots: Dot[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: minSize + Math.random() * (maxSize - minSize),
      vx: (Math.random() - 0.5) * 0.4 * speed,
      vy: (Math.random() - 0.5) * 0.4 * speed,
      alpha: Math.random(),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        d.alpha += d.alphaDir * 0.005;
        if (d.alpha >= 1 || d.alpha <= 0.1) d.alphaDir *= -1;

        if (d.x < 0) d.x = width;
        if (d.x > width) d.x = 0;
        if (d.y < 0) d.y = height;
        if (d.y > height) d.y = 0;

        const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
        grd.addColorStop(0, `rgba(${color},${d.alpha})`);
        grd.addColorStop(1, `rgba(${color},0)`);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${d.alpha})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [count, color, minSize, maxSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
