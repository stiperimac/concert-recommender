import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import AppShell from '@/components/AppShell';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Concert Recommender',
  description: 'Personalizirane preporuke koncerata na temelju društvenih podataka',
  keywords: ['koncerti', 'glazba', 'preporuke', 'izvođači', 'ticketmaster'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className={inter.variable}>
      <body className={inter.className}>
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
