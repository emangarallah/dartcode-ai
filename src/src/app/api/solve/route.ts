import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const allowedLanguages = new Set(['dart','python','javascript','java','cpp','csharp','go','rust']);
const allowedDifficulties = new Set(['easy','medium','hard']);
const models = ['gemini-3.8-flash','gemini-3.5-flash-lite'];

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({error:'مفتاح Gemini غير مضبوط في إعدادات الخادم.'},{status:503});

    const body = await req.json();
    const problem = String(body?.problem ?? '').trim().slice(0,18000);
    if (!problem) return NextResponse.json({error:'أدخل نص المسألة أولاً.'},{status:400});

    const language = allowedLanguages.has(String(body?.language)) ? String(body.language) : 'dart';
    const difficulty = allowedDifficulties.has(String(body?.difficulty)) ? String(body.difficulty) : 'medium';
    const mode = body?.mode === 'direct' ? 'direct' : 'coach';
    const sourceUrl = typeof body?.url === 'string' ? body.url.slice(0,1000) : null;
    const languageNames: Record<string,string> = {dart:'Dart',python:'Python',javascript:'JavaScript',java:'Java',cpp:'C++',csharp:'C#',go:'Go',rust:'Rust'};

    const prompt = `أنت DartCode AI، خبير Problem Solving وLeetCode ومدرب برمجة.
أجب بالعربية الواضحة مع إ���q�^