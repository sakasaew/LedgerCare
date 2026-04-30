'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, Clock, RefreshCw } from 'lucide-react';

const NAV = [
  { href: '/home',    label: 'ホーム',   Icon: Home },
  { href: '/scan',    label: 'スキャン', Icon: ScanLine },
  { href: '/history', label: '履歴',     Icon: Clock },
  { href: '/sync',    label: '同期',     Icon: RefreshCw },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sand-200 safe-bottom">
      <div className="max-w-[430px] mx-auto flex">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-sage-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span
                className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-colors ${
                  active ? 'bg-sage-50' : ''
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={`text-xs font-medium ${active ? 'text-sage-600' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
