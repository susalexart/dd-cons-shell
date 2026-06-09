import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'dd-cons — code-shipping + deliverable-shipping AI, audited',
  description:
    'Two self-hosted AI products sharing one sign-in: dev-division ships running code, consulting-agency ships cited deliverables. Every step audited.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
