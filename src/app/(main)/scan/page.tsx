'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X, CheckCircle2, AlertTriangle, Pencil, Check,
  Calendar, Store, Coins, Tag, FileText, ChevronDown,
  Camera, ImageIcon, Bell, User, ChevronRight,
} from 'lucide-react';
import { CATEGORIES, type Category, type Transaction } from '@/lib/types';
import { addTransactions, formatAmount, getTransactions, formatDateShort } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';
import CategoryBadge from '@/components/CategoryBadge';
import TransactionItem from '@/components/TransactionItem';

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

type Step = 'home' | 'preview' | 'analyzing' | 'review' | 'done';

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'd1', date: '2024-10-24', merchant: 'タクシー代', amount: 3500, category: '交通費', notes: '', confidence: 'high', createdAt: '', synced: false },
  { id: 'd2', date: '2024-10-23', merchant: '接待費', amount: 12000, category: '交際費', notes: '', confidence: 'high', createdAt: '', synced: false },
];

export default function ScanPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [step, setStep] = useState<Step>('home');
  const [items, setItems] = useState<Item[]>([]);
  const [transcription, setTranscription] = useState('');
  const [showTranscription, setShowTranscription] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const b64 = sessionStorage.getItem('lc_img');
    const mime = sessionStorage.getItem('lc_mime') || 'image/jpeg';
    if (b64) {
      setImgSrc(`data:${mime};base64,${b64}`);
      setStep('preview');
    }
    const txs = getTransactions();
    setRecent(txs.length > 0 ? txs.slice(0, 3) : DEMO_TRANSACTIONS);
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      sessionStorage.setItem('lc_img', base64);
      sessionStorage.setItem('lc_mime', mimeType);
      setImgSrc(`data:${mimeType};base64,${base64}`);
      setStep('preview');
    } catch {
      alert('画像の読み込みに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

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
      const data = await res.json();
      setTranscription(data.transcription ?? '');
      setItems(
        ((data.transactions ?? []) as Omit<Item, 'id' | 'editing'>[]).map((t, i) => ({
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
    setTimeout(() => {
      setImgSrc('');
      setStep('home');
    }, 1600);
  };

  /* ── ホーム画面 ── */
  if (step === 'home') {
    return (
      <div>
        <header className="flex items-center justify-between px-5 pt-8 pb-4 lg:px-8 lg:max-w-4xl lg:mx-auto">
          <h1 className="text-xl font-bold text-sage-600 tracking-tight">らくらくよみとり</h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm" aria-label="通知">
              <Bell size={20} className="text-gray-500" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-sage-100">
              <User size={20} className="text-sage-500" />
            </button>
          </div>
        </header>

        <div className="px-5 space-y-5 lg:px-8 lg:max-w-4xl lg:mx-auto">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
              領収書の読み取り
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              レシートや領収書、紙の帳簿を読み取って
              テキストデータに変換。
              スプレッドシートに書き出すことができます。
            </p>
          </div>

          {/* スキャンボタン: PC は横並び */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <label className="block cursor-pointer">
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={e => handleFile(e.target.files?.[0])}
              />
              <div className={`bg-sage-500 rounded-2xl p-5 lg:p-6 flex items-center lg:flex-col lg:items-center gap-4 transition-transform active:scale-95 shadow-md shadow-sage-200 ${loading ? 'opacity-70' : ''}`}>
                <div className="w-12 h-12 bg-sage-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Camera size={24} className="text-white" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-bold text-white">カメラ起動</span>
              </div>
            </label>

            <label className="block cursor-pointer">
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => handleFile(e.target.files?.[0])}
              />
              <div className="bg-sand-200 rounded-2xl p-5 lg:p-6 flex items-center lg:flex-col lg:items-center gap-4 transition-transform active:scale-95 shadow-sm">
                <div className="w-12 h-12 bg-sand-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={24} className="text-gray-500" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-bold text-gray-600">写真を選ぶ</span>
              </div>
            </label>
          </div>

          {/* 最近の履歴 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-base font-bold text-gray-800">最近の履歴</span>
              <Link href="/history" className="flex items-center gap-1 text-sage-500 text-sm font-medium">
                すべて見る <ChevronRight size={14} />
              </Link>
            </div>
            {recent.length > 0 ? (
              <div className="divide-y divide-sand-100">
                {recent.map(t => (
                  <TransactionItem key={t.id} t={t} />
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-gray-400 text-base">まだ記録がありません</p>
                <p className="text-gray-300 text-sm mt-1">上のボタンからスキャンしてみましょう</p>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl px-8 py-6 flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
              <p className="text-base font-medium text-gray-700">準備中...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── スキャン・レビュー画面 ── */
  return (
    <div className="min-h-dvh bg-sand-100">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4 lg:px-8 lg:max-w-6xl lg:mx-auto">
        <button
          onClick={() => {
            sessionStorage.removeItem('lc_img');
            sessionStorage.removeItem('lc_mime');
            setStep('home');
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
          aria-label="閉じる"
        >
          <X size={20} className="text-gray-600" />
        </button>
        <h1 className="text-base font-bold text-gray-800">確認</h1>
        <div className="w-10" />
      </header>

      {/* PC: 2カラム / モバイル: 縦積み */}
      <div className="lg:max-w-6xl lg:mx-auto lg:px-8 lg:pb-10 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* 左列: 画像 + 操作 */}
        <div className="px-5 lg:px-0 space-y-4">
          {imgSrc && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="スキャン画像" className="w-full h-full object-cover" />
              {step === 'review' && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2 shadow">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      スキャン成功（{items.length}件）
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {errMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-base">{errMsg}</p>
            </div>
          )}

          {step === 'preview' && (
            <button
              onClick={analyze}
              className="w-full bg-sage-500 text-white rounded-2xl py-4 text-lg font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform"
            >
              AIで読み取る
            </button>
          )}

          {step === 'analyzing' && (
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-sm">
              <div className="w-10 h-10 border-4 border-sage-200 border-t-sage-500 rounded-full animate-spin" />
              <p className="text-lg font-semibold text-gray-700">AIが読み取っています</p>
              <p className="text-sm text-gray-400">しばらくお待ちください…</p>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="text-xl font-bold text-gray-800">保存しました</p>
              <p className="text-sm text-gray-500">ホームに戻ります…</p>
            </div>
          )}
        </div>

        {/* 右列: レビュー内容 */}
        <div className="px-5 lg:px-0 pb-10 lg:pb-0 space-y-4">
          {step === 'review' && (
            <>
              {/* 全文書き起こし */}
              {transcription && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowTranscription(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-bold text-gray-700">全文書き起こし</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${showTranscription ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showTranscription && (
                    <div className="px-4 pb-4">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-sans bg-sand-50 rounded-xl p-3 max-h-48 overflow-y-auto">
                        {transcription}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* 取引なし */}
              {items.length === 0 ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center space-y-3">
                  <p className="text-base font-semibold text-gray-700">金額のある取引が見つかりませんでした</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    全文書き起こしは上に保存されています。<br />手動で取引を追加することもできます。
                  </p>
                  <button
                    onClick={() => {
                      const id = `${Date.now()}-0`;
                      setItems([{ id, date: new Date().toISOString().split('T')[0], merchant: '', amount: 0, category: 'その他', notes: transcription.slice(0, 100), confidence: 'low', editing: true }]);
                    }}
                    className="w-full py-3 rounded-xl border-2 border-sage-200 text-sage-600 font-bold text-sm active:scale-95 transition-transform"
                  >
                    手動で取引を追加
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-medium">抽出された取引データ（{items.length}件）</p>
              )}

              <div className="space-y-3">
                {items.map(it => (
                  <div key={it.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    {it.confidence === 'low' && (
                      <div className="flex items-center gap-2 mb-3 text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                        <AlertTriangle size={14} />
                        <span className="text-xs font-medium">確認が必要です</span>
                      </div>
                    )}
                    {it.editing ? (
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <Calendar size={16} className="text-sage-400 flex-shrink-0" />
                          <input type="date" value={it.date}
                            onChange={e => updateItem(it.id, { date: e.target.value })}
                            className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-sm text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300" />
                        </label>
                        <label className="flex items-center gap-3">
                          <Store size={16} className="text-sage-400 flex-shrink-0" />
                          <input type="text" value={it.merchant} placeholder="支払先・店名"
                            onChange={e => updateItem(it.id, { merchant: e.target.value })}
                            className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-sm text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300" />
                        </label>
                        <label className="flex items-center gap-3">
                          <Coins size={16} className="text-sage-400 flex-shrink-0" />
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                            <input type="number" value={it.amount}
                              onChange={e => updateItem(it.id, { amount: Number(e.target.value) })}
                              className="w-full border border-sand-300 rounded-xl pl-7 pr-3 py-2 text-sm text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300" />
                          </div>
                        </label>
                        <label className="flex items-center gap-3">
                          <Tag size={16} className="text-sage-400 flex-shrink-0" />
                          <div className="flex-1 relative">
                            <select value={it.category}
                              onChange={e => updateItem(it.id, { category: e.target.value as Category })}
                              className="w-full appearance-none border border-sand-300 rounded-xl px-3 py-2 text-sm text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </label>
                        <label className="flex items-center gap-3">
                          <FileText size={16} className="text-sage-400 flex-shrink-0" />
                          <input type="text" value={it.notes} placeholder="備考（任意）"
                            onChange={e => updateItem(it.id, { notes: e.target.value })}
                            className="flex-1 border border-sand-300 rounded-xl px-3 py-2 text-sm text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300" />
                        </label>
                        <button
                          onClick={() => updateItem(it.id, { editing: false })}
                          className="w-full flex items-center justify-center gap-2 bg-sage-500 text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform"
                        >
                          <Check size={16} /> 確定
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <Calendar size={12} />
                              <span>{it.date.replace(/-/g, '/')}</span>
                            </div>
                            <CategoryBadge category={it.category} />
                          </div>
                          <span className="text-xl font-bold text-gray-800 tabular-nums">
                            {formatAmount(it.amount)}
                          </span>
                        </div>
                        {it.merchant && <p className="text-sm text-gray-700 font-medium mb-1">{it.merchant}</p>}
                        {it.notes && <p className="text-xs text-gray-400">{it.notes}</p>}
                        <button
                          onClick={() => updateItem(it.id, { editing: true })}
                          className="mt-2 flex items-center gap-1 text-xs text-sage-500 font-medium border border-sage-200 rounded-lg px-2.5 py-1 hover:bg-sage-50 transition-colors"
                        >
                          <Pencil size={12} /> 修正
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {items.length > 0 && (
                <button
                  onClick={saveAll}
                  className="w-full bg-sage-500 text-white rounded-2xl py-4 text-lg font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  すべて保存する
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
