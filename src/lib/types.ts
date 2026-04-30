export type Category =
  | '飲食費'
  | '交通費'
  | '消耗品費'
  | '交際費'
  | '光熱費'
  | '通信費'
  | 'その他';

export const CATEGORIES: Category[] = [
  '飲食費', '交通費', '消耗品費', '交際費', '光熱費', '通信費', 'その他',
];

export const CATEGORY_BADGE: Record<Category, string> = {
  '飲食費':   'bg-amber-100 text-amber-800',
  '交通費':   'bg-sage-100 text-sage-700',
  '消耗品費': 'bg-stone-100 text-stone-700',
  '交際費':   'bg-orange-100 text-orange-800',
  '光熱費':   'bg-blue-100 text-blue-700',
  '通信費':   'bg-purple-100 text-purple-700',
  'その他':   'bg-gray-100 text-gray-700',
};

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  notes: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: string;
  synced: boolean;
}
