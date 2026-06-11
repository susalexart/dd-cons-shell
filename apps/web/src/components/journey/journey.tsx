'use client';

/**
 * The dd-journey scroll cinema — hero → terrain → agents → core → arrival.
 * Pinned GSAP ScrollTrigger chapters scrubbed by Lenis smooth scroll;
 * the core chapter drives brainState.warp so the brain canvas pulses race.
 */
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  brainState,
  gsap,
  initMotion,
  prefersReducedMotion,
  ScrollTrigger,
  scrollToTarget,
} from '../motion/motion-core';

const SECTORS = ['ORBIT', 'TERRAIN', 'WORKFORCE', 'CORE', 'ARRIVAL'];
const SECTOR_TARGETS = ['#hero', '#terrain', '#agents', '#core', '#arrival'];

export function Journey() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initMotion();
    const reduced = prefersReducedMotion();

    const setSector = (i: number) => {
      document.querySelectorAll<HTMLElement>('.hud-nav button').forEach((b, idx) => {
        b.classList.toggle('active', idx === i);
        if (idx === i) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    };

    const ctx = gsap.context(() => {
      /* ---------- HUD + spine ---------- */
      ScrollTrigger.create({
        trigger: document.body,
        start: 0,
        end: () => document.body.scrollHeight - window.innerHeight,
        onUpdate(self) {
          const p = self.progress;
          const fill = document.getElementById('spineFill');
          if (fill) fill.style.height = `${p * 100}%`;
          const depth = document.getElementById('hudDepth');
          if (depth) depth.textContent = String(Math.round(p * 100)).padStart(3, '0');
          document.querySelectorAll<HTMLElement>('.spine-node').forEach((n) => {
            n.classList.toggle('lit', p * 100 >= ([12, 35, 58, 81][+(n.dataset.at ?? 0)] ?? 100));
          });
        },
      });

      /* ---------- HERO ---------- */
      gsap
        .timeline()
        .to('#hero .hero-title span span', { y: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay: 0.2 })
        .from('#hero .eyebrow', { opacity: 0, y: 14, duration: 0.6 }, '-=.7')
        .from('#hero .hero-sub', { opacity: 0, y: 14, duration: 0.6 }, '-=.4');
      gsap.fromTo('#hero .bg', { scale: 1.25 }, { scale: 1.05, duration: 2.2, ease: 'power2.out' });
      if (!reduced) {
        gsap.to('#hero .bg', {
          yPercent: 14,
          scale: 1.18,
          ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onLeaveBack: () => setSector(0), onLeave: () => setSector(1) },
        });
        gsap.to('#hero .inner', {
          yPercent: -30,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true },
        });
      }

      /* ---------- CH 01 : pinned horizontal pan + steps ---------- */
      if (!reduced) {
        const [s0, s1, s2] = gsap.utils.toArray<HTMLElement>('#terrain .step');
        if (s0 && s1 && s2) {
          gsap.set(s0, { opacity: 1, visibility: 'visible' });
          const tl = gsap.timeline({
            scrollTrigger: { trigger: '#terrain', start: 'top top', end: '+=2600', pin: true, scrub: 1, anticipatePin: 1, onEnter: () => setSector(1), onEnterBack: () => setSector(1) },
          });
          tl.to('#terrain .bg', { xPercent: -16, ease: 'none', duration: 3 }, 0)
            .to(s0, { opacity: 0, y: -26, visibility: 'hidden', duration: 0.6, ease: 'power1.in' }, 0.8)
            .fromTo(s1, { opacity: 0, y: 34, visibility: 'hidden' }, { opacity: 1, y: 0, visibility: 'visible', duration: 0.6, ease: 'power1.out' }, 1.25)
            .to(s1, { opacity: 0, y: -26, visibility: 'hidden', duration: 0.6, ease: 'power1.in' }, 1.95)
            .fromTo(s2, { opacity: 0, y: 34, visibility: 'hidden' }, { opacity: 1, y: 0, visibility: 'visible', duration: 0.6, ease: 'power1.out' }, 2.4);
        }
      }

      /* ---------- CH 02 : clip reveal + counters ---------- */
      if (!reduced) {
        gsap
          .timeline({
            scrollTrigger: { trigger: '#agents', start: 'top top', end: '+=1800', pin: true, scrub: 1, anticipatePin: 1, onEnter: () => setSector(2), onEnterBack: () => setSector(2) },
          })
          .to('#agents .bg', { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', ease: 'power2.inOut', duration: 1.4 }, 0)
          .from('#agents h2', { x: -60, opacity: 0, duration: 0.8 }, 0.2)
          .from('#agents .lede', { x: -40, opacity: 0, duration: 0.7 }, 0.5)
          .from('#agents .stat', { y: 40, opacity: 0, stagger: 0.2, duration: 0.6 }, 0.8)
          .to('#agents .bg', { scale: 1.08, ease: 'none', duration: 1.2 }, 1.4);
        ScrollTrigger.create({
          trigger: '#agents',
          start: 'top 40%',
          once: true,
          onEnter() {
            document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
              gsap.fromTo(el, { innerText: 0 }, { innerText: +el.dataset.count!, duration: 1.6, ease: 'power1.out', snap: { innerText: 1 } });
            });
          },
        });
      } else {
        document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
          el.textContent = el.dataset.count!;
        });
      }

      /* ---------- CH 03 : warp zoom through the core ---------- */
      if (!reduced) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '#core',
              start: 'top top',
              end: '+=2400',
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              onEnter: () => setSector(3),
              onEnterBack: () => setSector(3),
              onUpdate: (s) => {
                brainState.warp = gsap.utils.clamp(0, 1, (s.progress - 0.35) * 2);
              },
              onLeave: () => {
                brainState.warp = 0;
                setSector(4);
              },
              onLeaveBack: () => {
                brainState.warp = 0;
              },
            },
          })
          .fromTo('#core .bg', { scale: 1 }, { scale: 1.75, ease: 'power1.in', duration: 3 }, 0)
          .to('#coreDim', { opacity: 0, ease: 'power1.in', duration: 2.2 }, 0)
          .from('#core .inner > *', { y: 50, opacity: 0, stagger: 0.15, duration: 0.7 }, 0.1)
          .to('#core .warp-line', { opacity: 1, stagger: 0.3, duration: 0.4 }, 0.9)
          .to('#core .warp-line', { xPercent: (i: number) => (i % 2 ? -160 : 160), opacity: 0, stagger: 0.2, duration: 1, ease: 'power2.in' }, 1.6)
          .to('#core .inner', { scale: 1.15, opacity: 0, duration: 0.8 }, 2.2);
      }

      /* ---------- ARRIVAL ---------- */
      gsap.from('#arrival .inner > *', {
        y: 46,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: '#arrival', start: 'top 65%', onEnter: () => setSector(4) },
      });
    }, root);

    return () => {
      brainState.warp = 0;
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="journey">
      <div className="spine" aria-hidden="true">
        <div className="spine-fill" id="spineFill" />
        {[
          { at: 0, target: '#hero', label: 'ORBIT' },
          { at: 1, target: '#terrain', label: 'TERRAIN' },
          { at: 2, target: '#agents', label: 'WORKFORCE' },
          { at: 3, target: '#core', label: 'CORE' },
        ].map((n) => (
          <button
            key={n.at}
            type="button"
            className="spine-node"
            data-at={n.at}
            data-label={n.label}
            onClick={() => scrollToTarget(n.target)}
          />
        ))}
      </div>

      <div className="hud">
        <div aria-hidden="true">DD // MISSION CONSOLE</div>
        <nav className="hud-nav" aria-label="Journey sections">
          {SECTORS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={i === 0 ? 'active' : undefined}
              aria-current={i === 0 ? 'true' : undefined}
              onClick={() => scrollToTarget(SECTOR_TARGETS[i]!)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div aria-hidden="true">
          DEPTH <b id="hudDepth">000</b>%
        </div>
      </div>

      {/* 00 · HERO */}
      <section className="scene" id="hero">
        <div className="bg" />
        <div className="veil" />
        <div className="inner">
          <div className="eyebrow">DD Consulting · Agentic Systems</div>
          <h1 className="hero-title">
            <span className="word">
              <span>Dev</span>
            </span>{' '}
            <span className="word">
              <span>Division</span>
            </span>
          </h1>
          <p className="hero-sub">
            TWO AGENTIC PRODUCTS · ONE BRAIN — <span style={{ color: 'var(--color-accent)' }}>DEV DIVISION</span> BUILDS,{' '}
            <span style={{ color: 'var(--color-violet)' }}>CONSULTING</span> GUIDES.
          </p>
        </div>
        <div className="scroll-cue">
          <span>BEGIN DESCENT</span>
          <span className="line" />
        </div>
      </section>

      {/* 01 · TERRAIN */}
      <section className="scene" id="terrain">
        <div className="bg" />
        <div className="veil" />
        <div className="inner">
          <div className="eyebrow">Chapter 01 · Consulting</div>
          <h2>We map your terrain</h2>
          <div className="steps">
            <div className="step" data-step="0">
              <div className="idx">01 / DISCOVER</div>
              <p className="lede">
                Every engagement starts on the ground. We audit your stack, your workflows, and the friction your teams have learned to live with.
              </p>
            </div>
            <div className="step" data-step="1">
              <div className="idx">02 / DESIGN</div>
              <p className="lede">
                Then we draw the city that should exist — an architecture where autonomous agents own the repetitive work and humans own the judgment.
              </p>
            </div>
            <div className="step" data-step="2">
              <div className="idx">03 / DEPLOY</div>
              <p className="lede">
                No slideware. We deliver running systems into your environment, wired to your tools, measured against your numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 · AGENTS */}
      <section className="scene" id="agents">
        <div className="bg" />
        <div className="veil" />
        <div className="inner">
          <div className="eyebrow">Chapter 02 · The Workforce</div>
          <h2>Agents go to work</h2>
          <p className="lede">
            Inside your workspace, coding agents plan, write, test, and review — around the clock, under your policies, with every action logged.
          </p>
          <div className="statgrid">
            <div className="stat">
              <div className="num">
                <span data-count="24">0</span>
                <em>/7</em>
              </div>
              <div className="lab">Autonomous ops</div>
            </div>
            <div className="stat">
              <div className="num">
                <span data-count="312">0</span>
                <em>+</em>
              </div>
              <div className="lab">Tasks shipped / week</div>
            </div>
            <div className="stat">
              <div className="num">
                <span data-count="98">0</span>
                <em>%</em>
              </div>
              <div className="lab">CI pass on first run</div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 · CORE */}
      <section className="scene" id="core">
        <div className="bg" />
        <div className="dim-layer" id="coreDim" style={{ opacity: 0.6 }} />
        <div className="veil" />
        <span className="warp-line" style={{ top: '22%', left: '8%' }}>
          {'> orchestrator: routing 14 agents'}
        </span>
        <span className="warp-line" style={{ top: '64%', right: '10%' }}>
          {'> sandbox: build green · 41s'}
        </span>
        <span className="warp-line" style={{ top: '38%', right: '18%' }}>
          {'> review: 0 blocking findings'}
        </span>
        <div className="inner">
          <div className="eyebrow">Chapter 03 · The Core</div>
          <h2>One orchestrated brain</h2>
          <p className="lede">
            Every agent reports to a single mission core — scheduling, memory, guardrails — so the swarm moves like one engineer with a thousand hands.
          </p>
        </div>
      </section>

      {/* 04 · ARRIVAL */}
      <section id="arrival">
        <div className="inner">
          <div className="eyebrow">Arrival · Your Move</div>
          <h2>Step into the workspace</h2>
          <p className="lede">The journey you just scrolled is the platform we run every day. Open the workspace, or bring us a problem.</p>
          <div className="cta-row">
            <Link className="cta" href="/launch">
              Open Workspace
            </Link>
            <Link className="cta alt" href="/sign-up?dest=consulting">
              Book Consulting
            </Link>
          </div>
        </div>
      </section>

      <footer className="journey-footer">DD CONSULTING — DEV DIVISION · AGENTIC SOFTWARE, DELIVERED</footer>
    </div>
  );
}
