import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: session.accessToken });
  const sheets = google.sheets({ version: 'v4', auth });

  const year = new Date().getFullYear();
  const title = `LedgerCare帳簿_${year}`;

  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: '帳簿', sheetId: 0 } }],
    },
  });

  const spreadsheetId = created.data.spreadsheetId!;

  // ヘッダー行を追加
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: '帳簿!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['ID', '日付', '支払先', '金額（円）', 'カテゴリ', '備考', '登録日時']],
    },
  });

  return NextResponse.json({
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title,
  });
}
