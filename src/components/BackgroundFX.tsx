import { useEffect, useRef } from 'react';
import { useSettings } from '../state/settings';

// ===========================================================
// Ambient background layers — animated grid pan, matrix rain,
// and a slow particle field. All toggleable via Settings.
// Respects reduced-motion / animation toggle.
// ===========================================================

export function BackgroundFX() {
  const { settings } = useSettings();
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* drifting grid */}
      <div
        className="absolute inset-0 bg-grid-faint bg-grid animate-grid-pan opacity-60"
        style={{ maskImage: 'radial-gradient(120% 100% at 50% 0%, black 40%, transparent 100%)' }}
      />
      {/* matrix rain */}
      {settings.matrix && <MatrixRain />}
      {/* particles */}
      {settings.particles && <Particles />}
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, transparent 50%, rgba(0,0,0,0.6) 100%)' }}
      />
    </div>
  );
}

function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.animations) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let cols = 0;
    let drops: number[] = [];
    const fontSize = 14;
    const glyphs = '01<>/\\|+=*-_{}[]#$%&アカサタナハマヤラワ0123456789ABCDEF'.split('');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / fontSize);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 70) return; // throttle ~14fps — subtle, not busy
      last = t;
      ctx.fillStyle = 'rgba(4,6,10,0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // leading glyph brighter
        ctx.fillStyle = Math.random() > 0.975 ? 'rgba(0,240,255,0.8)' : 'rgba(57,255,20,0.5)';
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [settings.animations]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden />;
}

function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.animations) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const count = 36;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(57,255,20,0.5)';
        ctx.fill();
      }
      // faint links
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.strokeStyle = `rgba(0,240,255,${0.08 * (1 - d / 140)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [settings.animations]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-70" aria-hidden />;
}
