import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import LayoutSelector from '@/components/layouts/LayoutSelector';
import NavigationLoaderHandler from '@/components/NavigationLoaderHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SAUTER',
  description: 'Professional inventory management system',
  icons: {
    icon: [
      { url: '/logo/app_logo.svg', type: 'image/svg+xml' },
      { url: '/logo/app_logo.jpeg', type: 'image/jpeg' },
    ],
    apple: '/logo/app_logo.jpeg',
    shortcut: '/logo/app_logo.svg',
  },
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
          <NavigationLoaderHandler />
          <LayoutSelector>{children}</LayoutSelector>
        </Providers>
      </body>
    </html>
  );
}

