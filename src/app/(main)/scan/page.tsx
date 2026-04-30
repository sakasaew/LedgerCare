'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, CheckCircle2, AlertTriangle, Pencil, Check,
  Calendar, Store, Coins, Tag, FileText, ChevronDown,
} from 'lucide-react';
import { CATEGORIES, type Category, type Transaction } from '@/lib/types';
import { addTransactions, formatAmount } from '@/lib/storage';
import CategoryBadge from '@/components/CategoryBadge';

interface Item {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: Category;
  notes: string;
  confidence: 'high' | 'medium' | 'low';
  editing: boolean;
}

type Step = 'preview' | 'analyzing' | 'review' | 'done';

export default function ScanPage() {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState('');
  const [step, setStep] = useState<Step>('preview');
  const [items, setItems] = useState<Item[]>([]);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const b64 = sessionStorage.getItem('lc_img');
    const mime = sessionStorage.getItem('lc_mime') || 'image/jpeg';
    if (!b64) { router.replace('/home'); return; }
    setImgSrc(`data:${mime};base64,${b64}`);
  }, [router]);

  const analyze = async () => {
    setStep('analyzing');
    setErrMsg('');
    try {
      const b64 = sessionStorage.getItem('lc_img');
      const mime = sessionStorage.getItem('lc_mime') || 'image/jpeg';
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: b64, mimeType: mime }),
      });
      if (!res.ok) throw new Error('failed');
      const { transactions } = await res.json();
      setItems(
        (transactions as Omit<Item, 'id' | 'editing'>[]).map((t, i) => ({
          ...t,
          id: `${Date.now()}-${i}`,
          editing: false,
        }))
      );
      setStep('review');
    } catch {
      setErrMsg('読み取りに失敗しました。もう一度お試しください。');
      setStep('preview');
    }
  };

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));

  const saveAll = () => {
    const txs: Transaction[] = items.map(it => ({
      id: it.id,
      date: it.date,
      merchant: it.merchant,
      amount: it.amount,
      category: it.category,
      notes: it.notes,
      confidence: it.confidence,
      createdAt: new Date().toISOString(),
      synced: false,
    }));
    addTransactions(txs);
    sessionStorage.removeItem('lc_img');
    sessionStorage.removeItem('lc_mime');
    setStep('done');
    setTimeout(() => router.replace('/home'), 1600);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-dvh bg-sand-100">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={() => router.replace('/home')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          aria-label="閉じる"
        >
          <X size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">確認</h1>
        <div className="w-10" />
      </header>

      <div className="px-5 pb-10 space-y-5">
        {/* 画像プレビュー */}
        {imgSrc && (
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt="スキャン画像" className="w-full h-full object-cover" />

            {step === 'review' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 shadow">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    スキャン成功（{items.length}件）
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* エラーメッセージ */}
        {errMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-base">{errMsg}</p>
          </div>
        )}

        {/* --- STEP: preview --- */}
        {step === 'preview' && (
          <button
            onClick={analyze}
            className="w-full bg-sage-500 text-white rounded-3xl py-5 text-xl font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform"
          >
            AIで読み取る
          </button>
        )}

        {/* --- STEP: analyzing --- */}
        {step === 'analyzing' && (
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-sm">
            <div className="w-12 h-12 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
            <p className="text-xl font-semibold text-gray-700">AIが読み取っています</p>
            <p className="text-base text-gray-400 text-center">
              しばらくお待ちください…
            </p>
          </div>
        )}

        {/* --- STEP: review --- */}
        {step === 'review' && (
          <>
            <p className="text-base text-gray-500 font-medium">抽出された取引データ</p>

            <div className="space-y-3">
              {items.map(it => (
                <div key={it.id} className="bg-white rounded-3xl p-4 shadow-sm">
                  {it.confidence === 'low' && (
                    <div className="flex items-center gap-2 mb-3 text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-medium">確認が必要です</span>
                    </div>
                  )}

                  {it.editing ? (
                    /* 編集フォーム */
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <Calendar size={18} className="text-sage-400 flex-shrink-0" />
                        <input
                          type="date"
                          value={it.date}
                          onChange={e => updateItem(it.id, { date: e.target.value })}
                          className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300"
                        />
                      </label>
                      <label className="flex items-center gap-3">
                        <Store size={18} className="text-sage-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={it.merchant}
                          placeholder="支払先・店名"
                          onChange={e => updateItem(it.id, { merchant: e.target.value })}
                          className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300"
                        />
                      </label>
                      <label className="flex items-center gap-3">
                        <Coins size={18} className="text-sage-400 flex-shrink-0" />
                        <div className="flex-1 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">¥</span>
                          <input
                            type="number"
                            value={it.amount}
                            onChange={e => updateItem(it.id, { amount: Number(e.target.value) })}
                            className="w-full border border-sand-300 rounded-xl pl-7 pr-3 py-2 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300"
                          />
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <Tag size={18} className="text-sage-400 flex-shrink-0" />
                        <div className="flex-1 relative">
                          <select
                            value={it.category}
                            onChange={e => updateItem(it.id, { category: e.target.value as Category })}
                            className="w-full appearance-none border border-sand-300 rounded-xl px-3 py-2 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <FileText size={18} className="text-sage-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={it.notes}
                          placeholder="備考（任意）"
                          onChange={e => updateItem(it.id, { notes: e.target.value })}
                          className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300"
                        />
                      </label>
                      <button
                        onClick={() => updateItem(it.id, { editing: false })}
                        className="w-full flex items-center justify-center gap-2 bg-sage-500 text-white rounded-2xl py-3 text-base font-bold active:scale-95 transition-transform"
                      >
                        <Check size={18} /> 確定
                      </button>
                    </div>
                  ) : (
                    /* 表示モード */
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Calendar size={14} />
                            <span>{it.date.replace(/-/g, '/')}</span>
                          </div>
                          <CategoryBadge category={it.category} />
                        </div>
                        <span className="text-2xl font-bold text-gray-800 tabular-nums">
                          {formatAmount(it.amount)}
                        </span>
                      </div>
                      {it.merchant && (
                        <p className="text-base text-gray-700 font-medium mb-1">{it.merchant}</p>
                      )}
                      {it.notes && (
                        <p className="text-sm text-gray-400">{it.notes}</p>
                      )}
                      <button
                        onClick={() => updateItem(it.id, { editing: true })}
                        className="mt-3 flex items-center gap-1.5 text-sm text-sage-500 font-medium border border-sage-200 rounded-xl px-3 py-1.5 hover:bg-sage-50 transition-colors"
                      >
                        <Pencil size={14} /> 修正
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveAll}
              className="w-full bg-sage-500 text-white rounded-3xl py-5 text-xl font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              すべて保存する
            </button>
          </>
        )}

        {/* --- STEP: done --- */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">保存しました</p>
            <p className="text-base text-gray-500">ホームに戻ります…</p>
          </div>
        )}
      </div>
    </div>
  );
}
