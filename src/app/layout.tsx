import type { Metadata, Viewport } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LedgerCare',
  description: '写真から帳簿を自動作成 — らくらくスキャン、ひっそりDX',
  appleWebApp: { capable: true, title: 'LedgerCare', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3D5A4C',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ja">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
