'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, CheckCircle2, AlertTriangle, ExternalLink,
  CloudUpload, Sparkles, FolderOpen, Pencil,
} from 'lucide-react';
import {
  getTransactions, getSettings, saveSettings, markSynced, formatAmount,
} from '@/lib/storage';
import type { Transaction } from '@/lib/types';

export default function SyncPage() {
  const { data: session } = useSession();
  const [sheetId, setSheetId]     = useState('');
  const [sheetTitle, setSheetTitle] = useState('');
  const [unsynced, setUnsynced]   = useState<Transaction[]>([]);
  const [creating, setCreating]   = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [result, setResult]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [editing, setEditing]     = useState(false);

  useEffect(() => {
    const s = getSettings();
    setSheetId(s.spreadsheetId);
    setSheetTitle(s.spreadsheetTitle ?? '');
    setUnsynced(getTransactions().filter(t => !t.synced));
  }, []);

  // A: 自動作成
  const handleCreate = async () => {
    setCreating(true);
    setResult(null);
    try {
      const res = await fetch('/api/sheets/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSheetId(data.spreadsheetId);
      setSheetTitle(data.title);
      saveSettings({ spreadsheetId: data.spreadsheetId, spreadsheetTitle: data.title });
      setResult({ ok: true, msg: `「${data.title}」を作成しました` });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || '作成に失敗しました' });
    } finally {
      setCreating(false);
    }
  };

  // B: Google ドライブ ピッカー
  const openPicker = useCallback(() => {
    if (!session?.accessToken) {
      setResult({ ok: false, msg: 'ログインが必要です' });
      return;
    }
    const token = session.accessToken;

    const launch = () => {
      // @ts-expect-error gapi types not bundled
      const gp = window.google?.picker;
      if (!gp) return;
      new gp.PickerBuilder()
        .addView(new gp.DocsView(gp.ViewId.SPREADSHEETS))
        .setOAuthToken(token)
        .setCallback((data: { action: string; docs: { id: string; name: string }[] }) => {
          if (data.action === gp.Action.PICKED) {
            const { id, name } = data.docs[0];
            setSheetId(id);
            setSheetTitle(name);
            saveSettings({ spreadsheetId: id, spreadsheetTitle: name });
            setEditing(false);
          }
        })
        .build()
        .setVisible(true);
    };

    // @ts-expect-error gapi types not bundled
    if (window.gapi?.load) {
      // @ts-expect-error gapi types not bundled
      window.gapi.load('picker', launch);
    } else {
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = () => {
        // @ts-expect-error gapi types not bundled
        window.gapi.load('picker', launch);
      };
      document.body.appendChild(s);
    }
  }, [session?.accessToken]);

  // 同期
  const handleSync = async () => {
    if (!sheetId) {
      setResult({ ok: false, msg: '先にスプレッドシートを設定してください' });
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
        body: JSON.stringify({ transactions: unsynced, spreadsheetId: sheetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      markSynced(unsynced.map(t => t.id));
      setUnsynced([]);
      setResult({ ok: true, msg: `${data.count}件を保存しました` });
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || '同期に失敗しました' });
    } finally {
      setSyncing(false);
    }
  };

  const sheetUrl = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null;

  return (
    <div>
      <header className="px-5 pt-8 pb-4 lg:px-8 lg:max-w-2xl lg:mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">同期</h1>
        <p className="text-sm text-gray-500 mt-1">
          Googleスプレッドシートに書き出します
        </p>
      </header>

      <div className="px-5 pb-10 space-y-4 lg:px-8 lg:max-w-2xl lg:mx-auto">

        {/* ── 保存先設定 ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="text-base font-bold text-gray-800 mb-4">保存先のスプレッドシート</p>

          {sheetId && !editing ? (
            /* 設定済み表示 */
            <div>
              <div className="flex items-center gap-3 bg-sage-50 rounded-2xl px-4 py-3 mb-3">
                <CheckCircle2 size={20} className="text-sage-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {sheetTitle || 'スプレッドシート'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{sheetId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-sand-300 text-base text-gray-600 hover:bg-sand-50 transition-colors"
                  >
                    <ExternalLink size={16} /> ドライブで開く
                  </a>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-sand-300 text-base text-gray-500 hover:bg-sand-50 transition-colors"
                >
                  <Pencil size={16} /> 変更
                </button>
              </div>
            </div>
          ) : (
            /* 未設定 or 編集中 */
            <div className="space-y-3">
              <p className="text-sm text-gray-500 leading-relaxed">
                どちらかの方法でスプレッドシートを選んでください
              </p>

              {/* A: 自動作成 */}
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-4 bg-sage-500 disabled:opacity-60 text-white rounded-2xl px-5 py-4 active:scale-95 transition-transform"
              >
                <span className="w-10 h-10 bg-sage-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  {creating
                    ? <RefreshCw size={20} className="animate-spin" />
                    : <Sparkles size={20} />}
                </span>
                <div className="text-left">
                  <p className="font-bold text-base">新しい帳簿を自動作成</p>
                  <p className="text-sage-200 text-sm">ドライブに自動で作成します</p>
                </div>
              </button>

              {/* B: ピッカー */}
              <button
                onClick={openPicker}
                className="w-full flex items-center gap-4 bg-white border-2 border-sand-300 rounded-2xl px-5 py-4 active:scale-95 transition-transform"
              >
                <span className="w-10 h-10 bg-sand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={20} className="text-gray-500" />
                </span>
                <div className="text-left">
                  <p className="font-bold text-base text-gray-700">ドライブから選ぶ</p>
                  <p className="text-gray-400 text-sm">既存のシートを使う</p>
                </div>
              </button>

              {editing && (
                <button
                  onClick={() => setEditing(false)}
                  className="w-full py-3 text-sm text-gray-400 hover:text-gray-600"
                >
                  キャンセル
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 同期ステータス ── */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${unsynced.length > 0 ? 'bg-amber-400' : 'bg-green-400'}`} />
            <span className="text-base font-semibold text-gray-700">
              {unsynced.length > 0
                ? `未同期のデータが ${unsynced.length} 件あります`
                : 'すべて同期済みです'}
            </span>
          </div>
          {unsynced.length > 0 && (
            <p className="text-sm text-gray-400 ml-6">
              合計：{formatAmount(unsynced.reduce((s, t) => s + t.amount, 0))}
            </p>
          )}
        </div>

        {/* ── 結果メッセージ ── */}
        {result && (
          <div className={`rounded-2xl p-4 flex items-start gap-3 ${
            result.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.ok
              ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              : <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />}
            <p className={`text-base ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.msg}
            </p>
          </div>
        )}

        {/* ── 同期ボタン ── */}
        <button
          onClick={handleSync}
          disabled={syncing || !sheetId}
          className="w-full bg-sage-500 disabled:opacity-40 text-white rounded-3xl py-5 text-xl font-bold shadow-md shadow-sage-200 active:scale-95 transition-transform flex items-center justify-center gap-3"
        >
          {syncing ? (
            <><RefreshCw size={22} className="animate-spin" />同期中...</>
          ) : (
            <><CloudUpload size={22} />スプレッドシートに同期</>
          )}
        </button>

        {/* アカウント情報 */}
        {session?.user && (
          <div className="bg-white rounded-3xl p-4 shadow-sm flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {session.user.image && <img src={session.user.image} alt="" className="w-9 h-9 rounded-full" />}
            <div>
              <p className="text-sm font-semibold text-gray-700">{session.user.name}</p>
              <p className="text-xs text-gray-400">{session.user.email}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
