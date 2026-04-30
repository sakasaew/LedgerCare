'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-sand-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-dvh bg-sand-100">
      <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col bg-sand-100">
        <main className="flex-1 overflow-y-auto pb-28">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
