import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import LayoutSelector from '@/components/layouts/LayoutSelector';
import NavigationLoaderHandler from '@/components/NavigationLoaderHandler';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden max-w-full">
      <body className={`${inter.className} overflow-x-hidden max-w-full min-w-0`}>
        <div className="min-w-0 max-w-full overflow-x-hidden">
          <Providers>
            <NavigationLoaderHandler />
            <LayoutSelector>{children}</LayoutSelector>
          </Providers>
        </div>
      </body>
    </html>
  );
}

