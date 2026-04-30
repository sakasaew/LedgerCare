import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const VALID_CATEGORIES = ['飲食費', '交通費', '消耗品費', '交際費', '光熱費', '通信費', 'その他'] as const;

const today = () => new Date().toISOString().split('T')[0];

const PROMPT = `あなたは日本語文書の読み取り専門家です。
添付画像（レシート・領収書・手書き帳簿・印刷帳簿・メモなど、形式は問いません）を解析してください。

【ステップ1: 全文書き起こし】
画像内に見えるすべての文字を忠実に書き起こしてください。
- 手書き・印刷・スタンプ・どんな形式でも対象
- 表や箇条書きはそのままの構造で
- 読み取れない文字は「■」で表記
- 文字が一切ない場合は「（文字なし）」

【ステップ2: 取引データの抽出】
書き起こした内容から、金額のある取引・支出・収入を抽出してください。
金額が見当たらない場合は transactions を空配列にしてください。

以下のJSONオブジェクト形式のみで返してください（説明文・コードブロック不要）：

{
  "transcription": "ステップ1で書き起こした全文をそのまま",
  "transactions": [
    {
      "date": "YYYY-MM-DD（不明なら${today()}）",
      "merchant": "支払先・店名（不明なら空文字）",
      "amount": 金額の整数（円単位）,
      "category": "飲食費" または "交通費" または "消耗品費" または "交際費" または "光熱費" または "通信費" または "その他",
      "notes": "品目・備考（任意）",
      "confidence": "high" または "medium" または "low"
    }
  ]
}

抽出ルール：
- 合計行ではなく個別明細を優先して抽出
- 金額は整数のみ（小数不可）
- 読み取りが不確かな項目は confidence を "low" に設定
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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { mimeType, data: imageData } },
    ]);

    const raw = result.response.text();

    // JSONオブジェクトを抽出
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSONが見つかりません');

    const parsed = JSON.parse(match[0]) as {
      transcription?: string;
      transactions?: Array<Record<string, unknown>>;
    };

    const transcription = String(parsed.transcription ?? '');

    const transactions = (Array.isArray(parsed.transactions) ? parsed.transactions : [])
      .filter(t => Number(t.amount) > 0)
      .map(t => ({
        date:       typeof t.date === 'string' ? t.date : today(),
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

    return NextResponse.json({ transcription, transactions });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: '読み取りに失敗しました' }, { status: 500 });
  }
}
