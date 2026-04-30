'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';

const DEMO_KEY = 'lc_demo_mode';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const demo = localStorage.getItem(DEMO_KEY) === '1';
    setIsDemo(demo);
    if (!demo && status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  if (status === 'loading' && !isDemo) {
    return (
      <div className="min-h-dvh bg-sand-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated' && !isDemo) return null;

  return (
    <div className="min-h-dvh bg-sand-100">
      {/* PC: 左サイドバー */}
      <SideNav />

      {/* コンテンツエリア */}
      <div className="lg:pl-52 min-h-dvh flex flex-col">
        {/* モバイル: 430px中央寄せ / PC: 幅制限なし */}
        <div className="max-w-[430px] lg:max-w-none mx-auto lg:mx-0 w-full flex flex-col flex-1">
          <main className="flex-1 pb-28 lg:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
