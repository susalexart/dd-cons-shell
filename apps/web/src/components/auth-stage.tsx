/**
 * <AuthStage> — P26.6 visual dressing for /sign-in and /sign-up.
 *
 * Wraps the <AuthForm> in a centered glassmorphism card over a softly-blurred
 * `dataviz.mp4` background video (aria-hidden, autoplay, muted, loop, playsinline,
 * preload=metadata, poster=dataviz-poster.jpg). A dark vignette guarantees text
 * contrast >= 4.5:1 over the moving image — the glass card sits at 75% opacity so
 * the form text stays AA-legible.
 *
 * Server component on purpose: <video> autoplay works without client JS, and we
 * want the chrome to render before hydration.
 */
import type { ReactNode } from 'react';

export function AuthStage({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background video — purely decorative. */}
      <video
        src="/hero/dataviz.mp4"
        poster="/hero/dataviz-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
        style={{ opacity: 0.4, filter: 'blur(2px)' }}
        data-testid="auth-video"
      />
      {/* Deep vignette: keeps card text contrast at AA over the moving image. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 40%, color-mix(in oklch, #0b0d10 55%, transparent) 0%, color-mix(in oklch, #0b0d10 80%, transparent) 60%, var(--color-bg) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center px-6 py-16">
        {/* Glass card — opacity raised to 78% to maintain 4.5:1 over the video. */}
        <div
          className="glass w-full p-2 shadow-2xl"
          style={{
            background:
              'color-mix(in oklch, var(--color-bg) 78%, transparent)',
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
