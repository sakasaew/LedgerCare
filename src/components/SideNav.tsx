'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, Clock, RefreshCw, BookOpen } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'ダッシュボード', Icon: LayoutDashboard },
  { href: '/scan',      label: '読み込み',         Icon: ScanLine },
  { href: '/history',   label: '履歴',             Icon: Clock },
  { href: '/sync',      label: '同期',             Icon: RefreshCw },
] as const;

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 min-h-screen bg-white border-r border-sand-200 px-4 py-6 fixed left-0 top-0 z-40">
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-8 h-8 bg-sage-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={16} className="text-white" strokeWidth={1.5} />
        </div>
        <span className="text-sm font-bold text-sage-600 leading-tight">らくらくよみとり</span>
      </div>

      <nav className="space-y-0.5 flex-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-sage-50 text-sage-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
