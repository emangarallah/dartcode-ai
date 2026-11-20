import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ ok:true, app:'DartCode AI', database:Boolean(process.env.DATABASE_URL), geminiConfigured:Boolean(process.env.GEMINI_API_KEY), provider:'Google Gemini', primaryModel:'gemini-3.8-flash', fallbackModel:'gemini-3.5-flash-lite' });
}
