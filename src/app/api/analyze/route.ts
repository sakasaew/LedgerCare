import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const VALID_CATEGORIES = ['飲食費', '交通費', '消耗品費', '交際費', '光熱費', '通信費', 'その他'] as const;

const PROMPT = `あなたは日本の帳簿付けの専門家です。
添付された画像（レシート・領収書・手書き帳簿・印字帳簿など）を解析し、記載されているすべての取引データを抽出してください。

以下のJSON配列形式のみで返答してください（説明文や前置きは一切不要）：

[
  {
    "date": "YYYY-MM-DD",
    "merchant": "支払先・店名（不明な場合は空文字）",
    "amount": 金額（整数・円単位）,
    "category": "飲食費" | "交通費" | "消耗品費" | "交際費" | "光熱費" | "通信費" | "その他",
    "notes": "品目や備考（任意）",
    "confidence": "high" | "medium" | "low"
  }
]

ルール：
- 日付が不明な場合は今日の日付（${new Date().toISOString().split('T')[0]}）を使用
- 金額は必ず整数（小数不可）
- 手書き帳簿の場合、各行を個別の取引として抽出
- 複数の明細がある場合は合計行ではなく個別明細を抽出
- 読み取りが不確かな項目はconfidenceを"low"に
- 金額が0以下のものは除外`;

export async function POST(req: NextRequest) {
  try {
    const { imageData, mimeType } = await req.json() as { imageData: string; mimeType: string };

    if (!imageData || !mimeType) {
      return NextResponse.json({ error: '画像データが不正です' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { mimeType, data: imageData } },
    ]);

    const raw = result.response.text();

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSONが見つかりません');

    const parsed = JSON.parse(match[0]) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed)) throw new Error('不正なレスポンス');

    const transactions = parsed
      .filter(t => Number(t.amount) > 0)
      .map(t => ({
        date:       typeof t.date === 'string' ? t.date : new Date().toISOString().split('T')[0],
        merchant:   String(t.merchant ?? ''),
        amount:     Math.round(Number(t.amount)),
        category:   VALID_CATEGORIES.includes(t.category as (typeof VALID_CATEGORIES)[number])
                      ? t.category
                      : 'その他',
        notes:      String(t.notes ?? ''),
        confidence: ['high', 'medium', 'low'].includes(t.confidence as string)
                      ? t.confidence
                      : 'medium',
      }));

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: '読み取りに失敗しました' }, { status: 500 });
  }
}
