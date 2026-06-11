'use client';

/**
 * Agentic brain background — two hemispheres:
 *   LEFT  = DEV DIVISION (cyan)   — coding agents
 *   RIGHT = CONSULTING   (orange) — advisory agents
 * Each has an orchestrator hub + agent rings; a 3-fiber bridge links the
 * hubs and pulses cross in both directions. Fibers are deterministic bezier
 * trajectories pre-rendered once offscreen; only pulses redraw per frame.
 * `brainState.warp` (driven by the journey's core chapter) accelerates pulses.
 */
import { useEffect, useRef } from 'react';
import { brainState, prefersReducedMotion } from './motion-core';

const CYAN = '45,226,230';
const ORANGE = '255,122,41';
const GHOST = '143,184,255';

type Pt = { x: number; y: number };
type Node = Pt & { r: number; glow: number; col: string; hub?: boolean; label?: string };
type Fiber = { a: Node; b: Node; col: string; c: Pt; bridge?: boolean };
type Pulse = { f: Fiber; t: number; speed: number; dir: 1 | -1; c: string };

function bez(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function mkFiber(a: Node, b: Node, col: string): Fiber {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = len * 0.18 * ((((a.x + b.y) | 0) % 2) ? 1 : -1);
  return { a, b, col, c: { x: mx - (dy / len) * bow, y: my + (dx / len) * bow } };
}

export function BrainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const reduced = prefersReducedMotion();
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;
    let nodes: Node[] = [];
    let fibers: Fiber[] = [];
    let pulses: Pulse[] = [];
    let staticLayer: HTMLCanvasElement | null = null;
    let rafOn = true;
    let rafId = 0;

    function buildRing(hub: Node, col: string, phase: number, count: number, rad: number, ri: number): Node[] {
      const arr: Node[] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + phase + ri * 0.4;
        const n: Node = {
          x: hub.x + Math.cos(a) * rad * (1 + ((i * (ri + 1)) % 3) * 0.07),
          y: hub.y + Math.sin(a) * rad * 0.82 * (1 + ((i + ri) % 2) * 0.06),
          r: ri === 0 ? 2.4 : 1.6,
          glow: 0,
          col,
        };
        arr.push(n);
        nodes.push(n);
      }
      return arr;
    }

    function buildHemisphere(hub: Node, col: string, phase: number) {
      nodes.push(hub);
      const inner = buildRing(hub, col, phase, 6, Math.min(W, H) * 0.14, 0);
      const outer = buildRing(hub, col, phase, 9, Math.min(W, H) * 0.26, 1);
      inner.forEach((n) => fibers.push(mkFiber(n, hub, col)));
      outer.forEach((n, i) => {
        const target = inner[i % inner.length];
        if (target) fibers.push(mkFiber(n, target, col));
      });
      outer.forEach((n, i) => {
        const next = outer[(i + 1) % outer.length];
        if (i % 3 === 0 && next) fibers.push(mkFiber(n, next, col));
      });
    }

    function buildNetwork() {
      W = window.innerWidth;
      H = window.innerHeight;
      cv!.width = W * DPR;
      cv!.height = H * DPR;
      cv!.style.width = `${W}px`;
      cv!.style.height = `${H}px`;
      cx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      nodes = [];
      fibers = [];
      pulses = [];

      const narrow = W < 760;
      const hubDev: Node = { x: W * (narrow ? 0.5 : 0.3), y: H * (narrow ? 0.3 : 0.46), r: 5, hub: true, glow: 0, col: CYAN, label: 'DEV DIVISION' };
      const hubCon: Node = { x: W * (narrow ? 0.5 : 0.7), y: H * (narrow ? 0.72 : 0.46), r: 5, hub: true, glow: 0, col: ORANGE, label: 'CONSULTING' };
      buildHemisphere(hubDev, CYAN, 0.2);
      buildHemisphere(hubCon, ORANGE, 0.75);

      for (let k = 0; k < 3; k++) {
        const f = mkFiber(hubDev, hubCon, GHOST);
        f.c.y += (k - 1) * Math.min(W, H) * 0.12;
        f.bridge = true;
        fibers.push(f);
      }

      staticLayer = document.createElement('canvas');
      staticLayer.width = W * DPR;
      staticLayer.height = H * DPR;
      const sx = staticLayer.getContext('2d')!;
      sx.setTransform(DPR, 0, 0, DPR, 0, 0);
      fibers.forEach((f) => {
        sx.lineWidth = f.bridge ? 1 : 0.7;
        const g = sx.createLinearGradient(f.a.x, f.a.y, f.b.x, f.b.y);
        g.addColorStop(0, `rgba(${f.a.col || f.col},0.06)`);
        g.addColorStop(0.5, `rgba(${GHOST},${f.bridge ? 0.22 : 0.12})`);
        g.addColorStop(1, `rgba(${f.b.col || f.col},0.06)`);
        sx.strokeStyle = g;
        sx.beginPath();
        sx.moveTo(f.a.x, f.a.y);
        sx.quadraticCurveTo(f.c.x, f.c.y, f.b.x, f.b.y);
        sx.stroke();
      });
      nodes.forEach((n) => {
        sx.fillStyle = `rgba(${n.col},${n.hub ? 0.6 : 0.35})`;
        sx.beginPath();
        sx.arc(n.x, n.y, n.r, 0, 7);
        sx.fill();
      });
      sx.font = '10px "JetBrains Mono",monospace';
      sx.textAlign = 'center';
      [hubDev, hubCon].forEach((h) => {
        sx.fillStyle = `rgba(${h.col},.55)`;
        sx.fillText(h.label!, h.x, h.y + 22);
        sx.strokeStyle = `rgba(${h.col},.4)`;
        sx.lineWidth = 1;
        sx.beginPath();
        sx.arc(h.x, h.y, h.r + 5, 0, 7);
        sx.stroke();
      });

      fibers.forEach((f, i) => {
        if (f.bridge) {
          pulses.push({ f, t: 0, speed: 0.0022, dir: 1, c: CYAN });
          pulses.push({ f, t: 0.5, speed: 0.0022, dir: -1, c: ORANGE });
        } else {
          pulses.push({
            f,
            t: (i * 0.13) % 1,
            speed: 0.0016 + (i % 5) * 0.0004,
            dir: i % 4 === 0 ? -1 : 1,
            c: f.col,
          });
        }
      });

      // Reduced motion: draw the static mesh once, no pulse loop.
      if (reduced) {
        cx!.clearRect(0, 0, W, H);
        cx!.drawImage(staticLayer, 0, 0, W, H);
      }
    }

    function loop() {
      if (!rafOn) return;
      cx!.clearRect(0, 0, W, H);
      if (staticLayer) cx!.drawImage(staticLayer, 0, 0, W, H);

      for (const p of pulses) {
        p.t += p.speed * p.dir * (1 + brainState.warp * 9);
        if (p.t > 1 || p.t < 0) {
          p.t = p.dir > 0 ? 0 : 1;
          const end = p.dir > 0 ? p.f.b : p.f.a;
          end.glow = 1;
        }
        const pos = bez(p.f.a, p.f.c, p.f.b, p.t);
        const tail = bez(p.f.a, p.f.c, p.f.b, Math.max(0, Math.min(1, p.t - 0.05 * p.dir)));
        const g = cx!.createLinearGradient(tail.x, tail.y, pos.x, pos.y);
        g.addColorStop(0, `rgba(${p.c},0)`);
        g.addColorStop(1, `rgba(${p.c},.85)`);
        cx!.strokeStyle = g;
        cx!.lineWidth = p.f.bridge ? 1.8 : 1.4;
        cx!.beginPath();
        cx!.moveTo(tail.x, tail.y);
        cx!.lineTo(pos.x, pos.y);
        cx!.stroke();
        cx!.fillStyle = `rgba(${p.c},.95)`;
        cx!.beginPath();
        cx!.arc(pos.x, pos.y, p.f.bridge ? 2 : 1.6, 0, 7);
        cx!.fill();
      }
      for (const n of nodes) {
        if (n.glow > 0.01) {
          cx!.fillStyle = `rgba(${n.col},${n.glow * 0.5})`;
          cx!.beginPath();
          cx!.arc(n.x, n.y, n.r + 4 * n.glow, 0, 7);
          cx!.fill();
          n.glow *= 0.92;
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    buildNetwork();
    let rsz: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rsz);
      rsz = setTimeout(buildNetwork, 200);
    };
    const onVisibility = () => {
      rafOn = !document.hidden;
      if (rafOn && !reduced) loop();
    };
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!reduced) loop();

    return () => {
      rafOn = false;
      cancelAnimationFrame(rafId);
      clearTimeout(rsz);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas id="stars" ref={ref} aria-hidden="true" />;
}
