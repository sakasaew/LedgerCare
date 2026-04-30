import type { Metadata, Viewport } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'らくらくよみとり',
  description: 'レシートや領収書、紙の帳簿を読み取ってテキストデータに変換。スプレッドシートに書き出すことができます。',
  appleWebApp: { capable: true, title: 'らくらくよみとり', statusBarStyle: 'default' },
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
