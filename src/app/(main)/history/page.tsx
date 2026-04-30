'use client';
import { useEffect, useState } from 'react';
import { getTransactions, formatAmount, deleteTransaction, clearAllTransactions } from '@/lib/storage';
import type { Transaction } from '@/lib/types';
import TransactionItem from '@/components/TransactionItem';
import { TrendingDown, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(getTransactions());
  }, []);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleClearAll = () => {
    if (!confirm('すべての取引データを削除しますか？')) return;
    clearAllTransactions();
    setTransactions([]);
  };

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
      <header className="px-5 pt-8 pb-4 lg:px-8 lg:max-w-4xl lg:mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">取引履歴</h1>
          <p className="text-sm text-gray-500 mt-1">過去の記録を確認できます</p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 rounded-xl px-3 py-2 transition-colors mt-1"
          >
            <Trash2 size={13} /> 全件削除
          </button>
        )}
      </header>

      <div className="px-5 space-y-4 pb-10 lg:px-8 lg:max-w-4xl lg:mx-auto">
        {/* 今月の支出カード */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-400 mb-1">今月の支出</p>
          <p className="text-3xl font-bold text-gray-800 tabular-nums">
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
                    <TransactionItem key={t.id} t={t} onDelete={handleDelete} />
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
