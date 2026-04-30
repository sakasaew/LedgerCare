'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  RefreshCw, CheckCircle2, AlertTriangle, ExternalLink,
  Sheet, CloudUpload, Info,
} from 'lucide-react';
import {
  getTransactions, getSettings, saveSettings, markSynced, formatAmount,
} from '@/lib/storage';
import type { Transaction } from '@/lib/types';

export default function SyncPage() {
  const { data: session } = useSession();
  const [sheetId, setSheetId] = useState('');
  const [unsynced, setUnsynced] = useState<Transaction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const { spreadsheetId } = getSettings();
    setSheetId(spreadsheetId);
    setUnsynced(getTransactions().filter(t => !t.synced));
  }, []);

  const handleSaveId = () => {
    saveSettings({ spreadsheetId: sheetId.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSync = async () => {
    if (!sheetId.trim()) {
      setResult({ ok: false, msg: 'スプレッドシートIDを設定してください' });
      return;
    }
    if (unsynced.length === 0) {
      setResult({ ok: true, msg: '同期待ちのデータはありません' });
      return;
    }
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: unsynced, spreadsheetId: sheetId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '同期に失敗しました');
      markSynced(unsynced.map(t => t.id));
      setUnsynced([]);
      setResult({ ok: true, msg: `${data.count}件のデータをスプレッドシートに保存しました` });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || '同期に失敗しました' });
    } finally {
      setSyncing(false);
    }
  };

  const sheetUrl = sheetId.trim()
    ? `https://docs.google.com/spreadsheets/d/${sheetId.trim()}/edit`
    : null;

  return (
    <div>
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">同期</h1>
        <p className="text-base text-gray-500 mt-1">
          Googleスプレッドシートに書き出します
        </p>
      </header>

      <div className="px-5 pb-10 space-y-5">
        {/* 同期ステータス */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${unsynced.length > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
            <span className="text-base font-semibold text-gray-700">
              {unsynced.length > 0
                ? `未同期のデータが ${unsynced.length} 件あります`
                : 'すべて同期済みです'}
            </span>
          </div>
          {unsynced.length > 0 && (
            <p className="text-sm text-gray-400 ml-6">
              合計金額：{formatAmount(unsynced.reduce((s, t) => s + t.amount, 0))}
            </p>
          )}
        </div>

        {/* スプレッドシートID設定 */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Sheet size={18} className="text-sage-500" />
            <span className="text-base font-bold text-gray-800">スプレッドシートID</span>
          </div>
          <div className="flex items-start gap-2 bg-sand-50 rounded-xl p-3 mb-4">
            <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 leading-relaxed">
              GoogleスプレッドシートのURLに含まれる英数字の部分を入力してください
              <br />
              <code className="bg-sand-200 px-1 rounded text-xs">
                /spreadsheets/d/<strong>ここの部分</strong>/edit
              </code>
            </p>
          </div>
          <input
            type="text"
            value={sheetId}
            onChange={e => setSheetId(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className="w-full border border-sand-300 rounded-2xl px-4 py-3 text-base text-gray-800 bg-sand-50 focus:outline-none focus:ring-2 focus:ring-sage-300 mb-3"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSaveId}
              className={`flex-1 rounded-2xl py-3 text-base font-bold transition-all active:scale-95 ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-sage-100 text-sage-700 hover:bg-sage-200'
              }`}
            >
              {saved ? '保存しました ✓' : '保存'}
            </button>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-sand-300 text-base text-gray-600 hover:bg-sand-50 transition-colors"
              >
                <ExternalLink size={16} /> 開く
              </a>
            )}
          </div>
        </div>

        {/* 結果メッセージ */}
        {result && (
          <div
            className={`rounded-2xl p-4 flex items-start gap-3 ${
              result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.ok
              ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              : <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />}
            <p className={`text-base ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.msg}
            </p>
          </div>
        )}

        {/* 同期ボタン */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full bg-sage-500 disabled:opacity-60 text-white rounded-3xl py-5 text-xl font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          {syncing ? (
            <>
              <RefreshCw size={22} className="animate-spin" />
              同期中...
            </>
          ) : (
            <>
              <CloudUpload size={22} />
              スプレッドシートに同期
            </>
          )}
        </button>

        {/* アカウント情報 */}
        {session?.user && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-400 mb-1">ログイン中のアカウント</p>
            <p className="text-base font-semibold text-gray-700">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}
