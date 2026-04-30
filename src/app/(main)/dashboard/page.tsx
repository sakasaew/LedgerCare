'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, ScanLine } from 'lucide-react';
import { getTransactions, formatAmount } from '@/lib/storage';
import { CATEGORIES, CATEGORY_BADGE, type Category, type Transaction } from '@/lib/types';
import CategoryBadge from '@/components/CategoryBadge';

const DEMO: Transaction[] = [
  { id: 'd1', date: '2026-04-28', merchant: 'コーヒーショップ',  amount: 850,  category: '飲食費',   notes: '打ち合わせ', confidence: 'high', createdAt: '', synced: false },
  { id: 'd2', date: '2026-04-25', merchant: 'JR東日本',          amount: 1240, category: '交通費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd3', date: '2026-04-22', merchant: 'コクヨ',            amount: 3200, category: '消耗品費', notes: 'ノート・ペン', confidence: 'high', createdAt: '', synced: false },
  { id: 'd4', date: '2026-04-18', merchant: '居酒屋 花月',       amount: 8500, category: '交際費',   notes: '取引先接待', confidence: 'high', createdAt: '', synced: false },
  { id: 'd5', date: '2026-04-10', merchant: 'NTT東日本',         amount: 5800, category: '通信費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd6', date: '2026-03-25', merchant: 'スーパー',          amount: 1200, category: '飲食費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd7', date: '2026-03-18', merchant: '東京ガス',          amount: 4800, category: '光熱費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd8', date: '2026-03-10', merchant: '文具店',            amount: 2400, category: '消耗品費', notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd9', date: '2026-02-20', merchant: 'タクシー',          amount: 2100, category: '交通費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd10', date: '2026-02-14', merchant: 'レストラン',       amount: 6200, category: '交際費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd11', date: '2026-01-28', merchant: 'Amazon',           amount: 4500, category: '消耗品費', notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd12', date: '2025-12-15', merchant: '電車代',           amount: 980,  category: '交通費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
  { id: 'd13', date: '2025-11-20', merchant: 'カフェ',           amount: 1500, category: '飲食費',   notes: '',           confidence: 'high', createdAt: '', synced: false },
];

function getMonthlyTotals(txs: Transaction[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const total = txs
      .filter(t => { const [ty, tm] = t.date.split('-').map(Number); return ty === y && tm === m; })
      .reduce((s, t) => s + t.amount, 0);
    return { label: `${m}月`, total };
  });
}

function getCurrentMonthStats(txs: Transaction[]) {
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const current = txs.filter(t => {
    const [y, m] = t.date.split('-').map(Number);
    return y === cy && m === cm;
  });
  const total = current.reduce((s, t) => s + t.amount, 0);
  const count = current.length;

  const catTotals: Partial<Record<Category, number>> = {};
  for (const t of current) {
    catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount;
  }
  const sorted = (Object.entries(catTotals) as [Category, number][]).sort((a, b) => b[1] - a[1]);

  return { total, count, catTotals: sorted };
}

const CATEGORY_BAR_COLOR: Record<Category, string> = {
  '飲食費':   'bg-amber-400',
  '交通費':   'bg-sage-400',
  '消耗品費': 'bg-stone-400',
  '交際費':   'bg-orange-400',
  '光熱費':   'bg-blue-400',
  '通信費':   'bg-purple-400',
  'その他':   'bg-gray-400',
};

export default function DashboardPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = getTransactions();
    setTxs(stored.length > 0 ? stored : DEMO);
  }, []);

  const monthly = getMonthlyTotals(txs);
  const { total, count, catTotals } = getCurrentMonthStats(txs);
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);
  const totalAllMonths = monthly.reduce((s, m) => s + m.total, 0);
  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const topCategory = catTotals[0];
  const now = new Date();

  return (
    <div className="min-h-dvh bg-sand-50 p-6 lg:p-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">
            {now.getFullYear()}年{now.getMonth() + 1}月の財務サマリー
          </p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 bg-sage-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-sage-600 transition-colors"
        >
          <ScanLine size={16} />
          読み込む
        </Link>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 今月の支出 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">今月の支出</span>
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown size={16} className="text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 tabular-nums">{formatAmount(total)}</p>
          <p className="text-xs text-gray-400 mt-1">{count}件の取引</p>
        </div>

        {/* 最多カテゴリ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">最多カテゴリ</span>
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-400" />
            </div>
          </div>
          {topCategory ? (
            <>
              <p className="text-2xl font-bold text-gray-800">{topCategory[0]}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatAmount(topCategory[1])}
                {total > 0 && ` · ${Math.round(topCategory[1] / total * 100)}%`}
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-400">—</p>
          )}
        </div>

        {/* 6ヶ月合計 */}
        <div className="bg-sage-500 rounded-2xl p-5 shadow-sm shadow-sage-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-sage-200">過去6ヶ月の合計</span>
            <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatAmount(totalAllMonths)}</p>
          <p className="text-xs text-sage-200 mt-1">{txs.length}件の取引</p>
        </div>
      </div>

      {/* グラフ + カテゴリ内訳 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 月次棒グラフ */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">月次支出推移（過去6ヶ月）</h2>
          <div className="flex items-end gap-3 h-36">
            {monthly.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-500 tabular-nums">
                  {m.total > 0 ? `¥${(m.total / 1000).toFixed(0)}k` : ''}
                </span>
                <div className="w-full relative flex items-end" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t-lg bg-sage-400 transition-all duration-500"
                    style={{ height: `${maxMonthly > 0 ? Math.max((m.total / maxMonthly) * 96, m.total > 0 ? 4 : 0) : 0}px` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* カテゴリ別内訳 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4">今月のカテゴリ別</h2>
          {catTotals.length > 0 ? (
            <div className="space-y-3">
              {catTotals.slice(0, 5).map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{cat}</span>
                    <span className="text-xs font-medium text-gray-700 tabular-nums">{formatAmount(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${CATEGORY_BAR_COLOR[cat as Category] ?? 'bg-gray-400'}`}
                      style={{ width: `${total > 0 ? (amt / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">今月の取引がありません</p>
          )}
        </div>
      </div>

      {/* 最近の取引テーブル */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-100">
          <h2 className="text-sm font-bold text-gray-700">最近の取引</h2>
          <Link href="/history" className="flex items-center gap-1 text-xs text-sage-500 font-medium hover:underline">
            すべて見る <ChevronRight size={14} />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-sand-100">
              <th className="text-left px-5 py-3 font-medium">日付</th>
              <th className="text-left px-5 py-3 font-medium">支払先</th>
              <th className="text-left px-5 py-3 font-medium">カテゴリ</th>
              <th className="text-right px-5 py-3 font-medium">金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-50">
            {recent.map(t => (
              <tr key={t.id} className="hover:bg-sand-50 transition-colors">
                <td className="px-5 py-3 text-sm text-gray-500 tabular-nums whitespace-nowrap">
                  {t.date.replace(/-/g, '/')}
                </td>
                <td className="px-5 py-3 text-sm text-gray-700 font-medium">
                  {t.merchant || '—'}
                </td>
                <td className="px-5 py-3">
                  <CategoryBadge category={t.category} />
                </td>
                <td className="px-5 py-3 text-sm font-bold text-gray-800 tabular-nums text-right">
                  {formatAmount(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
