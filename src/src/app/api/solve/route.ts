import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

type SolveBody = {
  problemText?: string;
  sourceUrl?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  mode?: "coach" | "direct";
  language?: string;
  title?: string;
};

const allowedLanguages = ["Dart", "Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust"];
const allowedDifficulties = ["Easy", "Medium", "Hard"];

function makePrompt(body: Required<Pick<SolveBody, "problemText" | "difficulty" | "mode" | "language">> & SolveBody) {
  const coach = body.mode === "coach";
  return `You are DartCode AI, an expert algorithms instructor and competitive programming mentor.
Answer in clear English. Keep the entire explanation and all code left-to-right (LTR).
Target programming language: ${body.language}. Difficulty: ${body.difficulty}.
Teaching mode: ${coach ? "COACH: teach progressively, explain the intuition before revealing the implementation, and guide the learner." : "DIRECT: provide the optimal solution promptly with concise reasoning."}

Use this structure with Markdown headings:
## Problem Understanding
## Key Insight
## Approach
## ${body.language} Solution
Provide one complete, correct, idiomatic code block in ${body.language}.
## Complexity Analysis
State time and space complexity and explain why.
## Edge Cases
List important edge cases and how the solution handles them.
${coach ? "## Coach Notes\nAdd 2-3 short learning questions or hints that help the student check their understanding." : ""}

If the prompt contains examples or constraints, use them. Do not claim to have executed or tested code. If details are missing, state reasonable assumptions explicitly. Do not invent constraints or sample outputs.

Problem title: ${body.title?.trim() || "Not provided"}
Source URL: ${body.sourceUrl?.trim() || "Not provided"}

Problem statement:
${body.problemText}
`;
}

async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("إعداد GEMINI_API_KEY غير موجود في بيئة النشر.");

  const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
  let lastStatus = 0;
  let lastMessage = "";

  for (const model of models) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 24000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 7000, topP: 0.9 },
          }),
          signal: controller.signal,
          cache: "no-store",
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const answer = payload?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("\n")
          .trim();
        if (answer) return { answer, model };
        lastMessage = "لم يُرجع نموذج الذكاء الاصطناعي نصاً صالحاً.";
        lastStatus = 502;
      } else {
        lastStatus = response.status;
        lastMessage = payload?.error?.message || "Gemini API request failed";
        if (![400, 401, 403, 404, 429, 500, 502, 503, 504].includes(response.status)) break;
      }
    } catch (error) {
      lastStatus = 504;
      lastMessage = error instanceof Error && error.name === "AbortError"
        ? "انتهت مهلة الاتصال بخدمة الذكاء الاصطناعي."
        : "تعذر الاتصال بخدمة الذكاء الاصطناعي.";
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastStatus === 401 || lastStatus === 403) {
    throw new Error("مفتاح Gemini غير صالح أو لا يملك صلاحية استخدام النموذج. راجع إعداد GEMINI_API_KEY في Vercel.");
  }
  if (lastStatus === 429) throw new Error("تم تجاوز حد طلبات Gemini أو رصيد الاستخدام. انتظر قليلاً ثم حاول مجدداً.");
  if (lastStatus === 404) throw new Error("لم يتم العثور على نموذج Gemini المطلوب. تحقق من أسماء النماذج المتاحة لمفتاحك.");
  throw new Error(lastMessage || "تعذر توليد الشرح حالياً. حاول مرة أخرى.");
}

async function saveHistory(body: SolveBody, answer: string) {
  if (!process.env.DATABASE_URL) return;
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO solve_history
        (client_id, title, source_url, difficulty, mode, language, problem_text, answer_markdown)
      VALUES
        (${"anonymous"}, ${body.title?.trim() || "Untitled problem"}, ${body.sourceUrl?.trim() || null},
         ${body.difficulty || "Easy"}, ${body.mode || "coach"}, ${body.language || "Dart"},
         ${body.problemText || ""}, ${answer})
    `;
  } catch (error) {
    console.error("DartCode history save failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SolveBody;
    const problemText = body.problemText?.trim();
    if (!problemText) {
      return NextResponse.json({ error: "أدخل نص المسألة قبل طلب الحل." }, { status: 400 });
    }
    if (problemText.length > 30000) {
      return NextResponse.json({ error: "نص المسألة طويل جداً. الحد الأقصى 30,000 حرف." }, { status: 413 });
    }

    const normalized: SolveBody = {
      ...body,
      problemText,
      difficulty: allowedDifficulties.includes(body.difficulty || "") ? body.difficulty : "Easy",
      mode: body.mode === "direct" ? "direct" : "coach",
      language: allowedLanguages.includes(body.language || "") ? body.language : "Dart",
    };

    const result = await generateWithGemini(makePrompt(normalized as Required<Pick<SolveBody, "problemText" | "difficulty" | "mode" | "language">> & SolveBody));
    await saveHistory(normalized, result.answer);
    return NextResponse.json({ answer: result.answer, model: result.model });
  } catch (error) {
    console.error("DartCode solve error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء توليد الحل.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
