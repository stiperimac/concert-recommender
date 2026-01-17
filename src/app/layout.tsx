import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Concert Recommender',
  description: 'Personalizirane preporuke koncerata',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>
        <a href="#main" className="skip-link">Preskoči na sadržaj</a>
        <Providers>
          <AppShell>
            <main id="main" className="mx-auto max-w-5xl px-4 py-8">
              {children}
            </main>
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
