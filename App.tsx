import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  Send,
  AtSign,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";

const SITE_URL = "https://www.ustatop360.uz/";
const BOT_URL = "https://t.me/UstTop_bot";

/* ---------------- hooks ---------------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function useFinePointer() {
  const [fine, setFine] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFine(mq.matches);
    const fn = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return fine;
}

function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ---------------- background ---------------- */

const PARTICLES = Array.from({ length: 18 }).map((_, i) => ({
  left: `${(i * 53 + 7) % 100}%`,
  top: `${(i * 37 + 11) % 100}%`,
  size: 2 + ((i * 7) % 3),
  dur: `${7 + ((i * 13) % 8)}s`,
  del: `${-((i * 1.7) % 8)}s`,
  dx: `${((i * 29) % 36) - 18}px`,
  dy: `${-((i * 23) % 40) - 8}px`,
  o1: 0.16 - (i % 3) * 0.04,
}));

function Background({
  mouseRef,
  scrollY,
  reduced,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number; sx: number; sy: number }>;
  scrollY: number;
  reduced: boolean;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const loop = () => {
      const m = mouseRef.current;
      m.sx += (m.x - m.sx) * 0.045;
      m.sy += (m.y - m.sy) * 0.045;
      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${m.sx * -18}px, ${m.sy * -14 + scrollY * 0.06}px, 0)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${m.sx * 34}px, ${m.sy * 26}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mouseRef, scrollY, reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* base */}
      <div className="absolute inset-0 bg-[#F6F3EF]" />
      {/* paper vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #FDFCFB 0%, #F6F3EF 42%, #EFE9E3 100%)",
        }}
      />
      {/* grid */}
      <div ref={gridRef} className="absolute -inset-[60px] will-change-transform">
        <div className="bg-grid absolute inset-0" />
      </div>
      {/* moving dark-red light */}
      <div ref={glowRef} className="absolute inset-0 will-change-transform">
        <div
          className="blob blob-a left-[8%] top-[6%] h-[420px] w-[560px]"
          style={{ background: "radial-gradient(circle, rgba(107,15,24,0.10), transparent 68%)" }}
        />
        <div
          className="blob blob-b right-[-6%] top-[30%] h-[520px] w-[520px]"
          style={{ background: "radial-gradient(circle, rgba(60,30,28,0.08), transparent 68%)" }}
        />
        <div
          className="absolute left-1/2 top-[22%] h-[300px] w-[720px] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(122,17,27,0.07), transparent 70%)",
            filter: "blur(70px)",
          }}
        />
      </div>
      {/* hairline center axis */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-[rgba(22,12,12,0.05)]" />
      {/* particles */}
      {!reduced &&
        PARTICLES.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                "--dur": p.dur,
                "--del": p.del,
                "--dx": p.dx,
                "--dy": p.dy,
                "--o1": p.o1,
              } as React.CSSProperties
            }
          />
        ))}
      {/* noise */}
      <div className="bg-noise absolute inset-0" />
      {/* top + bottom fade for depth */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#FDFCFB] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#ECE5DE] to-transparent opacity-70" />
    </div>
  );
}

/* ---------------- cinematic intro ---------------- */

function CinematicIntro({
  phase,
  sweep,
  count,
  onSkip,
}: {
  phase: "play" | "exiting" | "done";
  sweep: boolean;
  count: number;
  onSkip: () => void;
}) {
  if (phase === "done") return null;
  const usta = "USTA".split("");
  const top = "TOP".split("");
  return (
    <div
      onClick={onSkip}
      className={`fixed inset-0 z-[80] flex cursor-pointer flex-col justify-between overflow-hidden bg-[#F6F3EF] ${
        phase === "exiting" ? "intro-exit" : ""
      }`}
      role="presentation"
    >
      {/* converging lines */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="intro-line-h absolute left-[6%] right-[6%] h-px bg-[rgba(22,12,12,0.14)]" style={{ animationDelay: "0.05s" }} />
        <div className="intro-line-v absolute bottom-[8%] top-[8%] w-px bg-[rgba(22,12,12,0.14)]" style={{ animationDelay: "0.15s" }} />
        <div
          className="absolute h-[420px] w-[420px] rounded-full opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(107,15,24,0.10), transparent 66%)",
            filter: "blur(30px)",
          }}
        />
        {/* corner ticks */}
        <div className="absolute left-6 top-6 h-5 w-5 border-l border-t border-[rgba(22,12,12,0.3)]" />
        <div className="absolute right-6 top-6 h-5 w-5 border-r border-t border-[rgba(22,12,12,0.3)]" />
        <div className="absolute bottom-6 left-6 h-5 w-5 border-b border-l border-[rgba(22,12,12,0.3)]" />
        <div className="absolute bottom-6 right-6 h-5 w-5 border-b border-r border-[rgba(22,12,12,0.3)]" />
      </div>

      {/* top row */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10">
        <p className="intro-fade-late font-mono text-[10px] uppercase tracking-[0.28em] text-[#8B7F7C]" style={{ animationDelay: "0.5s" }}>
          Цифровой сервис поиска мастеров
        </p>
        <p className="intro-fade-late hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[#8B7F7C] sm:block" style={{ animationDelay: "0.65s" }}>
          Ташкент — 2026
        </p>
      </div>

      {/* center logo */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="intro-fade-late mb-5 flex items-center gap-3" style={{ animationDelay: "0.35s" }}>
          <span className="h-px w-10 bg-[#6B0F18]/50" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#6B0F18]">Запуск продукта</span>
          <span className="h-px w-10 bg-[#6B0F18]/50" />
        </div>

        <h1
          aria-label="USTA TOP"
          className={`sweep-wrap font-display font-extrabold leading-[0.95] tracking-[-0.02em] text-[#100B0B] ${
            sweep ? "sweep-run" : ""
          }`}
          style={{ fontSize: "clamp(2.1rem, 11vw, 8.5rem)", whiteSpace: "nowrap" }}
        >
          <span className="mr-[0.18em]">
            {usta.map((l, i) => (
              <span key={i} className="intro-mask">
                <span className="intro-letter" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
                  {l}
                </span>
              </span>
            ))}
          </span>
          <span className="text-[#6B0F18]">
            {top.map((l, i) => (
              <span key={i} className="intro-mask">
                <span className="intro-letter" style={{ animationDelay: `${0.62 + i * 0.1}s` }}>
                  {l}
                </span>
              </span>
            ))}
          </span>
        </h1>

        <p className="intro-fade-late mt-6 max-w-md text-[15px] leading-relaxed text-[#5b5250]" style={{ animationDelay: "1.25s" }}>
          Есть проблема? Расскажите нам —<br className="hidden sm:block" /> мы найдём вам мастера.
        </p>
      </div>

      {/* bottom row */}
      <div className="relative z-10 px-6 pb-7 sm:px-10">
        <div className="mb-4 h-px w-full overflow-hidden bg-[rgba(22,12,12,0.1)]">
          <div className="intro-progress h-full w-full bg-[#6B0F18]" />
        </div>
        <div className="flex items-end justify-between">
          <p className="intro-fade-late font-mono text-[10px] uppercase tracking-[0.28em] text-[#8B7F7C]" style={{ animationDelay: "0.8s" }}>
            Загрузка — {String(count).padStart(3, "0")}
          </p>
          <p className="intro-fade-late font-mono text-[10px] uppercase tracking-[0.28em] text-[#8B7F7C]" style={{ animationDelay: "0.9s" }}>
            Нажмите, чтобы пропустить
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- premium card ---------------- */

function PremiumCard({
  variant,
  index,
  kicker,
  title,
  desc,
  cta,
  domain,
  href,
  icon,
  foot,
  delay,
  onGo,
  fine,
}: {
  variant: "light" | "dark";
  index: string;
  kicker: string;
  title: string;
  desc: string;
  cta: string;
  domain: string;
  href: string;
  icon: React.ReactNode;
  foot: string;
  delay: string;
  onGo: (url: string, label: string) => void;
  fine: boolean;
}) {
  const shellRef = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const target = useRef({ rx: 0, ry: 0, ax: 0, ay: 0, gx: 50, gy: 30 });
  const cur = useRef({ rx: 0, ry: 0, ax: 0, ay: 0, gx: 50, gy: 30 });
  const raf = useRef(0);
  const dark = variant === "dark";

  const loop = useCallback(() => {
    const c = cur.current;
    const t = target.current;
    c.rx += (t.rx - c.rx) * 0.12;
    c.ry += (t.ry - c.ry) * 0.12;
    c.ax += (t.ax - c.ax) * 0.18;
    c.ay += (t.ay - c.ay) * 0.18;
    c.gx += (t.gx - c.gx) * 0.15;
    c.gy += (t.gy - c.gy) * 0.15;
    if (shellRef.current) {
      shellRef.current.style.transform = `perspective(1100px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) translateY(${dark ? 0 : 0}px)`;
      shellRef.current.style.setProperty("--gx", `${c.gx.toFixed(2)}%`);
      shellRef.current.style.setProperty("--gy", `${c.gy.toFixed(2)}%`);
    }
    if (innerRef.current) {
      innerRef.current.style.transform = `translate3d(${(c.ry * 1.1).toFixed(2)}px, ${(c.rx * -1.1).toFixed(2)}px, 0)`;
    }
    if (arrowRef.current) {
      arrowRef.current.style.transform = `translate3d(${c.ax.toFixed(2)}px, ${c.ay.toFixed(2)}px, 0)`;
    }
    raf.current = requestAnimationFrame(loop);
  }, [dark]);

  useEffect(() => {
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [loop]);

  const handleMove = (e: React.MouseEvent) => {
    if (!fine || !shellRef.current) return;
    const r = shellRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = dark ? 5 : 4;
    target.current.rx = (-py * max).toFixed(3) as unknown as number;
    target.current.ry = (px * (max + 2)).toFixed(3) as unknown as number;
    target.current.gx = ((e.clientX - r.left) / r.width) * 100;
    target.current.gy = ((e.clientY - r.top) / r.height) * 100;
    // magnetic arrow
    if (arrowRef.current) {
      const ar = arrowRef.current.getBoundingClientRect();
      const acx = ar.left + ar.width / 2;
      const acy = ar.top + ar.height / 2;
      const vx = e.clientX - acx;
      const vy = e.clientY - acy;
      const len = Math.hypot(vx, vy) || 1;
      const pull = Math.min(len / 90, 1) * 9;
      target.current.ax = (vx / len) * pull + 3;
      target.current.ay = (vy / len) * pull;
    }
  };

  const handleLeave = () => {
    target.current = { rx: 0, ry: 0, ax: 0, ay: 0, gx: 50, gy: 30 };
  };

  const handleRipple = (e: React.PointerEvent) => {
    const el = shellRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 1.1;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = `${d}px`;
    s.style.left = `${e.clientX - r.left - d / 2}px`;
    s.style.top = `${e.clientY - r.top - d / 2}px`;
    s.style.background = dark ? "rgba(255,255,255,0.14)" : "rgba(107,15,24,0.10)";
    el.appendChild(s);
    setTimeout(() => s.remove(), 700);
  };

  return (
    <a
      ref={shellRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="ОТКРЫТЬ"
      onClick={(e) => {
        e.preventDefault();
        onGo(href, domain);
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onPointerDown={handleRipple}
      className={`card-enter card-shell group relative block overflow-hidden rounded-[26px] text-left outline-none transition-shadow duration-500 focus-visible:ring-2 focus-visible:ring-[#6B0F18] active:scale-[0.985] ${
        dark
          ? "card-dark bg-[#140909] text-white shadow-[0_30px_70px_-24px_rgba(20,9,9,0.55)] hover:shadow-[0_36px_90px_-20px_rgba(90,11,18,0.55)]"
          : "bg-[#FDFCFB]/90 text-[#100B0B] shadow-[0_24px_60px_-28px_rgba(22,12,12,0.35)] backdrop-blur-xl hover:shadow-[0_30px_80px_-24px_rgba(107,15,24,0.28)]"
      } ${dark ? "border border-white/[0.08]" : "border border-[rgba(22,12,12,0.1)]"}`}
      style={{ ["--d" as string]: delay }}
    >
      {/* traveling border light */}
      <span className="card-border-beam" aria-hidden />
      {/* cursor-follow glow */}
      <span className="card-glow-follow" aria-hidden />
      {/* top draw line */}
      <span
        className="card-frame-draw absolute left-0 top-0 h-[2px] w-full"
        style={{ ["--d" as string]: delay, background: dark ? "linear-gradient(90deg,#7A111B,#ff9d9d,#7A111B)" : "linear-gradient(90deg,#5A0B12,#7A111B,#5A0B12)" }}
        aria-hidden
      />

      {/* watermark number */}
      <span
        aria-hidden
        className={`font-display pointer-events-none absolute -right-3 -top-7 select-none text-[7.5rem] font-extrabold leading-none ${
          dark ? "text-white/[0.06]" : "text-[#100B0B]/[0.055]"
        }`}
      >
        {index}
      </span>

      <div ref={innerRef} className="relative z-10 flex h-full flex-col p-7 will-change-transform sm:p-9">
        {/* head */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                dark ? "bg-white/[0.07] text-white ring-1 ring-white/10" : "bg-[#100B0B] text-white"
              }`}
            >
              {icon}
            </span>
            <div>
              <p className={`font-mono text-[10px] uppercase tracking-[0.24em] ${dark ? "text-white/50" : "text-[#8B7F7C]"}`}>{kicker}</p>
              <p className={`mt-1 font-mono text-[10px] uppercase tracking-[0.24em] ${dark ? "text-[#ffb4b4]" : "text-[#6B0F18]"}`}>{index} — шаг</p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
              dark ? "bg-white/[0.07] text-white/70 ring-1 ring-white/10" : "bg-[#100B0B]/[0.05] text-[#100B0B]/70 ring-1 ring-black/5"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-emerald-300" : "bg-[#6B0F18]"} live-dot`} />
            Онлайн
          </span>
        </div>

        {/* title */}
        <h3 className="font-display text-[1.65rem] font-bold leading-[1.05] tracking-tight sm:text-[2rem]">
          {title}
        </h3>
        <p className={`mt-3 max-w-[30ch] text-[15px] leading-relaxed ${dark ? "text-white/60" : "text-[#5b5250]"}`}>{desc}</p>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <span className={`text-[15px] font-semibold tracking-tight ${dark ? "text-white" : "text-[#100B0B]"}`}>
            {cta}
            <span className={`mt-1 block h-px w-full origin-left scale-x-100 transition-transform duration-500 group-hover:scale-x-0 ${dark ? "bg-white/25" : "bg-black/15"}`} aria-hidden />
            <span className="mt-1 block h-px w-full origin-right scale-x-0 bg-[#7A111B] transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
          </span>
          <span
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-500 group-hover:scale-105 ${
              dark ? "bg-white text-[#140909]" : "bg-[#6B0F18] text-white"
            }`}
          >
            <span ref={arrowRef} className="arrow-mag flex items-center justify-center">
              <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-[3px]" strokeWidth={2.2} />
            </span>
          </span>
        </div>

        {/* foot */}
        <div className={`mt-8 flex items-center justify-between border-t pt-5 font-mono text-[11px] tracking-wide ${dark ? "border-white/10 text-white/45" : "border-black/10 text-[#8B7F7C]"}`}>
          <span className="truncate">{domain}</span>
          <span className="flex items-center gap-1.5">
            {foot}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

/* ---------------- main ---------------- */

export default function App() {
  const reduced = useReducedMotion();
  const fine = useFinePointer();

  const [introPhase, setIntroPhase] = useState<"play" | "exiting" | "done">("play");
  const [sweep, setSweep] = useState(false);
  const [count, setCount] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [leaving, setLeaving] = useState<{ url: string; label: string } | null>(null);

  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInner = useRef({ x: 0, y: 0 });

  const { ref: footRef, visible: footVisible } = useInView<HTMLDivElement>(0.2);
  const { ref: stripRef, visible: stripVisible } = useInView<HTMLDivElement>(0.3);

  /* intro timeline */
  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => {
        setIntroPhase("done");
      }, 450);
      setCount(100);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setSweep(true), 1350));
    timers.push(setTimeout(() => setIntroPhase("exiting"), 2320));
    timers.push(setTimeout(() => setIntroPhase("done"), 3180));

    const start = performance.now();
    const dur = 2250;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const skipIntro = useCallback(() => {
    if (reduced) {
      setIntroPhase("done");
      return;
    }
    setIntroPhase((ph) => (ph === "play" ? "exiting" : ph));
    setTimeout(() => setIntroPhase("done"), 850);
  }, [reduced]);

  /* scroll + global mouse */
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduced || !fine) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth - 0.5;
      mouse.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const loop = () => {
      const t = heroInner.current;
      t.x += (mouse.current.x * 14 - t.x) * 0.06;
      t.y += (mouse.current.y * 10 - t.y) * 0.06;
      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(${t.x.toFixed(2)}px, ${(t.y * 0.7 + scrollY * -0.04).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, fine, scrollY]);

  /* custom cursor ring + glow */
  const glowRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [cursorMode, setCursorMode] = useState<"default" | "link" | "card">("default");

  useEffect(() => {
    if (!fine || reduced) return;
    const glow = { x: innerWidth / 2, y: 200, tx: innerWidth / 2, ty: 200 };
    const ring = { x: innerWidth / 2, y: 200, tx: innerWidth / 2, ty: 200 };
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      glow.tx = e.clientX;
      glow.ty = e.clientY;
      ring.tx = e.clientX;
      ring.ty = e.clientY;
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const card = t.closest?.("[data-cursor]");
      const link = t.closest?.("a,button");
      if (card) {
        setCursorMode("card");
        setCursorLabel(card.getAttribute("data-cursor") || "→");
      } else if (link) {
        setCursorMode("link");
        setCursorLabel("→");
      } else {
        setCursorMode("default");
        setCursorLabel(null);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    const loop = () => {
      glow.x += (glow.tx - glow.x) * 0.08;
      glow.y += (glow.ty - glow.y) * 0.08;
      ring.x += (ring.tx - ring.x) * 0.22;
      ring.y += (ring.ty - ring.y) * 0.22;
      if (glowRef.current) glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduced]);

  const go = useCallback(
    (url: string, label: string) => {
      if (reduced) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }
      setLeaving({ url, label });
      setTimeout(() => {
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => setLeaving(null), 450);
      }, 720);
    },
    [reduced]
  );

  const ready = introPhase !== "play";

  return (
    <div className={`relative min-h-dvh ${ready ? "reveal-on" : ""}`}>
      <Background mouseRef={mouse} scrollY={scrollY} reduced={reduced} />

      <CinematicIntro phase={introPhase} sweep={sweep} count={count} onSkip={skipIntro} />

      {/* cursor layers */}
      {fine && !reduced && (
        <>
          <div id="cursor-glow" ref={glowRef} aria-hidden />
          <div id="cursor-ring" ref={ringRef} aria-hidden>
            <div className="relative">
              <div className="cursor-dot absolute left-0 top-0" style={{ opacity: cursorMode === "default" ? 1 : 0 }} />
              <div
                className="cursor-circle absolute left-0 top-0"
                style={{
                  width: cursorMode === "card" ? 76 : cursorMode === "link" ? 44 : 26,
                  height: cursorMode === "card" ? 76 : cursorMode === "link" ? 44 : 26,
                  opacity: cursorMode === "default" ? 0.9 : 1,
                  background: cursorMode === "card" ? "#100B0B" : "rgba(255,255,255,0.65)",
                  color: cursorMode === "card" ? "#fff" : "#100B0B",
                  borderColor: cursorMode === "card" ? "#100B0B" : "rgba(16,11,11,0.22)",
                }}
              >
                <span style={{ opacity: cursorMode === "default" ? 0 : 1, fontSize: cursorMode === "card" ? 9 : 15 }}>
                  {cursorMode === "card" ? cursorLabel : "→"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ CONTENT ============ */}
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 sm:px-8">
        {/* nav */}
        <header className="fade-rise flex items-center justify-between py-6" style={{ ["--d" as string]: "0.1s" }}>
          <div className="flex items-center gap-3">
            <span className="font-display flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#140909] text-[13px] font-extrabold tracking-tight text-white">
              UT
            </span>
            <span className="leading-none">
              <span className="font-display block text-[13px] font-bold tracking-[0.08em]">USTA TOP</span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.26em] text-[#8B7F7C]">Вход из Instagram</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-black/10 bg-white/60 py-2 pl-3 pr-4 backdrop-blur-md">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#6B0F18]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#2A2323]">Ташкент • онлайн</span>
          </div>
        </header>

        {/* hero */}
        <main className="flex flex-1 flex-col items-center">
          <div ref={heroRef} className="flex w-full flex-col items-center will-change-transform">
            {/* eyebrow */}
            <div className="fade-rise mt-6 flex items-center gap-3 sm:mt-10" style={{ ["--d" as string]: "0.18s" }}>
              <span className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-[#6B0F18]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#2A2323]">Сервис поиска мастеров</span>
              </span>
            </div>

            {/* giant logo */}
            <div className="fade-rise relative mt-7 text-center sm:mt-9" style={{ ["--d" as string]: "0.28s" }}>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-[#8B7F7C]">— Представляем —</p>
              <h1
                className="font-display whitespace-nowrap font-extrabold leading-[0.9] tracking-[-0.03em] text-[#100B0B]"
                style={{ fontSize: "clamp(2.1rem, 11.5vw, 9rem)" }}
              >
                USTA&nbsp;<span className="text-[#6B0F18]">TOP</span>
                <span className="text-[#6B0F18]">.</span>
              </h1>
              {/* underline hairlines */}
              <div className="mx-auto mt-6 flex max-w-xl items-center gap-4 px-6">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(22,12,12,0.2)] to-[rgba(22,12,12,0.2)]" />
                <span className="h-[5px] w-[5px] rotate-45 bg-[#6B0F18]" />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[rgba(22,12,12,0.2)] to-[rgba(22,12,12,0.2)]" />
              </div>
            </div>

            {/* slogan staggered */}
            <div className="mt-8 max-w-3xl px-2 text-center sm:mt-10">
              <p className="reveal-line text-[clamp(1.55rem,5.2vw,2.9rem)] font-light leading-[1.08] tracking-tight text-[#100B0B]">
                <span style={{ ["--d" as string]: "0.42s" }}>Есть проблема?</span>
              </p>
              <p className="reveal-line mt-1 text-[clamp(1.55rem,5.2vw,2.9rem)] font-medium leading-[1.08] tracking-tight text-[#100B0B]">
                <span style={{ ["--d" as string]: "0.56s" }}>Расскажите нам —</span>
              </p>
              <p className="reveal-line mt-1 text-[clamp(1.55rem,5.2vw,2.9rem)] font-bold leading-[1.08] tracking-tight">
                <span style={{ ["--d" as string]: "0.7s" }}>
                  мы найдём <span className="italic text-[#6B0F18]">вам мастера.</span>
                </span>
              </p>
              <p className="fade-rise mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[#5b5250]" style={{ ["--d" as string]: "0.9s" }}>
                Выберите удобный способ — сайт или Telegram-бот. Это займёт меньше минуты.
              </p>
            </div>

            {/* micro trust */}
            <div className="fade-rise mt-7 flex flex-wrap items-center justify-center gap-2.5" style={{ ["--d" as string]: "1s" }}>
              <span className="flex items-center gap-2 rounded-full bg-[#100B0B] px-4 py-2 text-[12.5px] font-medium text-white">
                <ShieldCheck className="h-3.5 w-3.5" /> Проверенные мастера
              </span>
              <span className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[12.5px] font-medium text-[#2A2323] backdrop-blur-md">
                Без лишних звонков
              </span>
            </div>
          </div>

          {/* cards */}
          <div className="mt-12 grid w-full gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2" style={{ perspective: "1200px" }}>
            <PremiumCard
              variant="light"
              index="01"
              kicker="Сайт • каталог"
              title="НАЙТИ МАСТЕРА"
              desc="Найдите подходящего мастера для вашей задачи"
              cta="Перейти на сайт"
              domain="ustatop360.uz"
              foot="новая вкладка"
              href={SITE_URL}
              icon={<Globe className="h-5 w-5" strokeWidth={1.8} />}
              delay="0.95s"
              onGo={go}
              fine={fine}
            />
            <PremiumCard
              variant="dark"
              index="02"
              kicker="Telegram • бот"
              title="TELEGRAM-БОТ"
              desc="Найдите мастера прямо в Telegram"
              cta="Открыть бота"
              domain="t.me/UstTop_bot"
              foot="открыть в Telegram"
              href={BOT_URL}
              icon={<Send className="h-5 w-5" strokeWidth={1.8} />}
              delay="1.08s"
              onGo={go}
              fine={fine}
            />
          </div>

          <p className="fade-rise mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#8B7F7C]" style={{ ["--d" as string]: "1.25s" }}>
            Нажмите, чтобы перейти <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
          </p>

          {/* marquee */}
          <div
            ref={stripRef}
            className={`mt-12 w-full overflow-hidden rounded-2xl border border-black/10 bg-white/50 py-3.5 backdrop-blur-md transition-all duration-700 ${
              stripVisible ? "io-visible" : "io-hidden"
            }`}
          >
            <div className="marquee-track gap-0 font-mono text-[11px] uppercase tracking-[0.28em] text-[#5b5250]">
              {[0, 1].map((k) => (
                <span key={k} className="flex shrink-0 items-center">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="flex items-center">
                      <span className="px-6">Есть проблема? — Расскажите нам — Мы найдём вам мастера</span>
                      <span className="h-1.5 w-1.5 rotate-45 bg-[#6B0F18]/70" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </main>

        {/* footer / socials */}
        <footer
          ref={footRef}
          className={`mt-12 pb-8 transition-all duration-700 ${footVisible ? "io-visible" : "io-hidden"}`}
        >
          <div className="flex flex-col items-center gap-6 border-t border-black/10 pt-7 sm:flex-row sm:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#8B7F7C]">© 2026 USTA TOP • Ташкент</p>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8B7F7C]">
                <AtSign className="h-3.5 w-3.5" />
                Вы здесь — из Instagram
              </span>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  go(BOT_URL, "t.me/UstTop_bot");
                }}
                className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-[#100B0B] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
              >
                <Send className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Telegram
                <span className="absolute bottom-1.5 left-5 right-5 h-px origin-left scale-x-0 bg-white/60 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            </div>

            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                go(SITE_URL, "ustatop360.uz");
              }}
              className="group relative flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#2A2323] transition-colors hover:text-[#6B0F18]"
            >
              <span className="relative">
                ustatop360.uz
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[#6B0F18] transition-transform duration-300 group-hover:scale-x-100" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
          <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-[#b3a8a4]">
            Есть проблема? Мы рядом
          </p>
        </footer>
      </div>

      {/* page transition */}
      {leaving && (
        <div className="transition-veil fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#100B0B]/80 backdrop-blur-[6px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Переход</p>
          <p className="font-display mt-3 text-xl font-bold text-white">{leaving.label}</p>
          <div className="mt-6 h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
            <div className="transition-line h-full w-full bg-gradient-to-r from-[#5A0B12] via-[#ff8f8f] to-[#5A0B12]" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-white/60">
            <ArrowRight className="h-4 w-4 animate-pulse" /> Открываем в новой вкладке…
          </p>
        </div>
      )}
    </div>
  );
}
