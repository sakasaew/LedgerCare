'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, ImageIcon, Bell, User, ChevronRight } from 'lucide-react';
import { getTransactions, formatAmount, formatDateShort } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';
import type { Transaction } from '@/lib/types';
import TransactionItem from '@/components/TransactionItem';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRecent(getTransactions().slice(0, 3));
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    try {
      const { base64, mimeType } = await compressImage(file);
      sessionStorage.setItem('lc_img', base64);
      sessionStorage.setItem('lc_mime', mimeType);
      router.push('/scan');
    } catch {
      alert('画像の読み込みに失敗しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  const name = session?.user?.name?.split(' ')[0] ?? '';
  const avatar = session?.user?.image;

  return (
    <div>
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-sage-600 tracking-tight">LedgerCare</h1>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm" aria-label="通知">
            <Bell size={20} className="text-gray-500" />
          </button>
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={40}
              height={40}
              className="rounded-full border-2 border-sage-100 cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/' })}
            />
          ) : (
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-sage-100"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <User size={20} className="text-sage-500" />
            </button>
          )}
        </div>
      </header>

      <div className="px-5 space-y-6">
        {/* タイトル */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 leading-tight">
            領収書の
            <br />
            読み取り
          </h2>
          <p className="text-base text-gray-500 mt-2">
            スキャンする方法を選んでください
          </p>
        </div>

        {/* スキャンボタン */}
        <div className="space-y-3">
          {/* カメラ起動 */}
          <label className="block cursor-pointer">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <div
              className={`bg-sage-500 rounded-3xl p-7 flex flex-col items-center gap-3 transition-transform active:scale-95 shadow-md shadow-sage-200 ${loading ? 'opacity-70' : ''}`}
            >
              <div className="w-14 h-14 bg-sage-400 rounded-2xl flex items-center justify-center">
                <Camera size={28} className="text-white" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold text-white">カメラ起動</span>
            </div>
          </label>

          {/* 写真を選ぶ */}
          <label className="block cursor-pointer">
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <div className="bg-sand-200 rounded-3xl p-7 flex flex-col items-center gap-3 transition-transform active:scale-95 shadow-sm">
              <div className="w-14 h-14 bg-sand-300 rounded-2xl flex items-center justify-center">
                <ImageIcon size={28} className="text-gray-500" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-bold text-gray-600">写真を選ぶ</span>
            </div>
          </label>
        </div>

        {/* 最近の履歴 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-gray-800">最近の履歴</span>
            <Link
              href="/history"
              className="flex items-center gap-1 text-sage-500 text-base font-medium"
            >
              すべて見る <ChevronRight size={16} />
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="divide-y divide-sand-100">
              {recent.map(t => (
                <TransactionItem key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-base">まだ記録がありません</p>
              <p className="text-gray-300 text-sm mt-1">
                上のボタンからスキャンしてみましょう
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ローディングオーバーレイ */}
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
