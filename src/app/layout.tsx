import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import LayoutSelector from '@/components/layouts/LayoutSelector';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestion de Stock Pro',
  description: 'Professional inventory management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <LayoutSelector>{children}</LayoutSelector>
        </Providers>
      </body>
    </html>
  );
}

