'use client';
import { useEffect, useState } from 'react';
import { getTransactions, formatAmount, formatDate } from '@/lib/storage';
import type { Transaction } from '@/lib/types';
import TransactionItem from '@/components/TransactionItem';
import { TrendingDown } from 'lucide-react';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  // 今月の支出合計
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyTotal = transactions
    .filter(t => t.date.startsWith(ym))
    .reduce((sum, t) => sum + t.amount, 0);

  // 月ごとにグルーピング
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const [y, m] = t.date.split('-');
    const key = `${y}年${parseInt(m)}月`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <div>
      {/* ヘッダー */}
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">取引履歴</h1>
        <p className="text-base text-gray-500 mt-1">過去の記録を確認できます</p>
      </header>

      <div className="px-5 space-y-5 pb-10">
        {/* 今月の支出カード */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-400 mb-1">今月の支出</p>
          <p className="text-4xl font-bold text-gray-800 tabular-nums">
            {formatAmount(monthlyTotal)}
          </p>
        </div>

        {/* 履歴リスト */}
        {groups.size === 0 ? (
          <div className="bg-white rounded-3xl p-10 flex flex-col items-center gap-3 shadow-sm">
            <div className="w-16 h-16 bg-sand-200 rounded-full flex items-center justify-center">
              <TrendingDown size={28} className="text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-gray-500">記録がありません</p>
            <p className="text-base text-gray-400 text-center">
              ホームからレシートをスキャンして記録しましょう
            </p>
          </div>
        ) : (
          Array.from(groups.entries()).map(([label, txs]) => {
            const groupTotal = txs.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={label} className="bg-white rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-bold text-gray-700">{label}</span>
                  <span className="text-base font-bold text-sage-600 tabular-nums">
                    {formatAmount(groupTotal)}
                  </span>
                </div>
                <div className="divide-y divide-sand-100">
                  {txs.map(t => (
                    <TransactionItem key={t.id} t={t} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
