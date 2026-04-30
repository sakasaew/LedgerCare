import type { Transaction } from './types';

const KEY = 'lc_transactions';
const SETTINGS_KEY = 'lc_settings';

export interface AppSettings {
  spreadsheetId: string;
  spreadsheetTitle?: string;
}

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(KEY);
    return data ? (JSON.parse(data) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function addTransactions(items: Transaction[]): void {
  const existing = getTransactions();
  const ids = new Set(existing.map(t => t.id));
  const merged = [...items.filter(t => !ids.has(t.id)), ...existing];
  localStorage.setItem(KEY, JSON.stringify(merged));
}

export function deleteTransaction(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getTransactions().filter(t => t.id !== id)));
}

export function clearAllTransactions(): void {
  localStorage.removeItem(KEY);
}

export function markSynced(ids: string[]): void {
  const idSet = new Set(ids);
  const updated = getTransactions().map(t =>
    idSet.has(t.id) ? { ...t, synced: true } : t
  );
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { spreadsheetId: '' };
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { spreadsheetId: '' };
  } catch {
    return { spreadsheetId: '' };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function formatAmount(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}/${m}/${d}`;
}

export function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}月${parseInt(d)}日`;
}
