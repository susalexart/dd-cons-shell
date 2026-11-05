import type { ReactNode } from 'react';
import { BrainCanvas } from '../components/motion/brain-canvas';
import { Grain } from '../components/motion/grain';
import { MotionProvider } from '../components/motion/motion-provider';
import './globals.css';

export const metadata = {
  title: 'dd-cons — code-shipping + deliverable-shipping AI, audited',
  description:
    'Two self-hosted AI products sharing one sign-in: dev-division ships running code, consulting-agency ships cited deliverables. Every step audited.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Browser extensions (wallet extensions especially) inject attributes
    // onto <html> before React hydrates. Suppress only this element's
    // attribute mismatch; it is not an app bug.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&family=Space+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MotionProvider>
          <BrainCanvas />
          <Grain />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
