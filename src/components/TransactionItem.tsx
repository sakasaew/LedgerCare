import type { Transaction } from '@/lib/types';
import { CATEGORY_BADGE } from '@/lib/types';
import { formatAmount, formatDateShort } from '@/lib/storage';
import type { LucideIcon } from 'lucide-react';
import {
  UtensilsCrossed, Bus, ShoppingCart, Handshake,
  Lightbulb, Smartphone, MoreHorizontal,
} from 'lucide-react';
import type { Category } from '@/lib/types';

const ICON_MAP: Record<Category, LucideIcon> = {
  '飲食費':   UtensilsCrossed,
  '交通費':   Bus,
  '消耗品費': ShoppingCart,
  '交際費':   Handshake,
  '光熱費':   Lightbulb,
  '通信費':   Smartphone,
  'その他':   MoreHorizontal,
};

const ICON_BG: Record<Category, string> = {
  '飲食費':   'bg-amber-100',
  '交通費':   'bg-sage-100',
  '消耗品費': 'bg-stone-100',
  '交際費':   'bg-orange-100',
  '光熱費':   'bg-blue-100',
  '通信費':   'bg-purple-100',
  'その他':   'bg-gray-100',
};

export default function TransactionItem({ t }: { t: Transaction }) {
  const Icon = ICON_MAP[t.category] ?? MoreHorizontal;
  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${ICON_BG[t.category]}`}>
        <Icon size={20} className={CATEGORY_BADGE[t.category].split(' ')[1]} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{t.merchant || 'その他'}</p>
        <p className="text-sm text-gray-500">{formatDateShort(t.date)}</p>
      </div>
      <span className="font-bold text-gray-800 tabular-nums">{formatAmount(t.amount)}</span>
    </div>
  );
}
