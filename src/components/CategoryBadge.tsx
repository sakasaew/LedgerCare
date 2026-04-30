import type { Category } from '@/lib/types';
import { CATEGORY_BADGE } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import {
  UtensilsCrossed, Bus, ShoppingCart, Handshake,
  Lightbulb, Smartphone, MoreHorizontal,
} from 'lucide-react';

const ICONS: Record<Category, LucideIcon> = {
  '飲食費':   UtensilsCrossed,
  '交通費':   Bus,
  '消耗品費': ShoppingCart,
  '交際費':   Handshake,
  '光熱費':   Lightbulb,
  '通信費':   Smartphone,
  'その他':   MoreHorizontal,
};

export default function CategoryBadge({ category }: { category: Category }) {
  const Icon = ICONS[category] ?? MoreHorizontal;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_BADGE[category]}`}
    >
      <Icon size={13} strokeWidth={2} />
      {category}
    </span>
  );
}
