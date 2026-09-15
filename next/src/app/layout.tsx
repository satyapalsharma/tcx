import type { Metadata } from 'next';
import { Providers } from './providers';
import '../tx.css';
import '../pages.css';

export const metadata: Metadata = {
  title: 'Transform.cx',
  description: 'EXL Transform.cx prototype',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
