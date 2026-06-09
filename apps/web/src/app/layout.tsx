import type { ReactNode } from 'react';

export const metadata = {
  title: 'dd-cons',
  description: 'Umbrella shell for dev-division + consulting-agency.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
