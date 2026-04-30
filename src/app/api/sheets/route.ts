import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';
import type { Transaction } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { transactions, spreadsheetId } = await req.json() as {
      transactions: Transaction[];
      spreadsheetId: string;
    };

    if (!spreadsheetId?.trim()) {
      return NextResponse.json({ error: 'スプレッドシートIDが未設定です' }, { status: 400 });
    }
    if (!transactions?.length) {
      return NextResponse.json({ error: '同期するデータがありません' }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const sheets = google.sheets({ version: 'v4', auth });

    // ヘッダー行の確認・追加
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId.trim(),
      range: 'A1:G1',
    });

    if (!check.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId.trim(),
        range: 'A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['ID', '日付', '支払先', '金額（円）', 'カテゴリ', '備考', '登録日時']],
        },
      });
    }

    const values = transactions.map(t => [
      t.id,
      t.date,
      t.merchant,
      t.amount,
      t.category,
      t.notes,
      new Date(t.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId.trim(),
      range: 'A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '同期に失敗しました';
    console.error('[sheets]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
