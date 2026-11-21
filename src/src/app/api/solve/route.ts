import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const maxDuration = 60;

type SolveBody = {
  clientId?: string;
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
اكتب الشرح بالكامل باللغة العربية الفصحى الواضحة، بما في ذلك العناوين والخطوات وتحليل التعقيد والحالات الطرفية وملاحظات المدرب. لا تكتب أي شرح باللغة الإنجليزية. الاستثناء الوحيد هو الكود البرمجي داخل كتلة كود Markdown؛ يجب أن يكون الكود باللغة الإنجليزية فقط، بما في ذلك أسماء المتغيرات والدوال والتعليقات والنصوص التوضيحية داخل الكود. لا تضع كلمات عربية داخل الكود أو تعليقاته. اجعل الشرح العربي باتجاه RTL، واجعل كتل الكود فقط باتجاه LTR.
Target programming language: ${body.language}. Difficulty: ${body.difficulty}.
Teaching mode: ${coach ? "COACH: teach progressively, explain the intuition before revealing the implementation, and guide the learner." : "DIRECT: provide the optimal solution promptly with concise reasoning."}

استخدم هذا الهيكل بعناوين عربية:
## فهم المسألة
## الفكرة الأساسية
## طريقة الحل
## الحل بلغة ${body.language}
قدّم كتلة كود واحدة كاملة وصحيحة واحترافية بلغة ${body.language}. اجعل جميع محتويات كتلة الكود باللغة الإنجليزية حصراً.
## تحليل التعقيد
اشرح التعقيد الزمني والمكاني باللغة العربية.
## الحالات الطرفية
اذكر الحالات المهمة وكيفية التعامل معها باللغة العربية.
## أسماء المتغيرات المستخدمة
قبل إنشاء المخطط، استخرج المتغيرات الضرورية من منطق المسألة وافترض أسماء واضحة لها إذا لم يذكرها نص المسألة. استخدم أسماء برمجية إنجليزية متوافقة مع ${body.language} وبأسلوب camelCase، وثبّت الاسم نفسه في جميع الخطوات ولا تغيّره بين خطوة وأخرى.
- اختر أسماء تصف المعنى لا أسماء عامة مثل x وy إلا عند الضرورة الرياضية.
- أمثلة: nums للمصفوفة، target للقيمة المطلوبة، left وright للمؤشرين، currentSum للمجموع الجاري، maxValue للقيمة العظمى، index للفهرس، count للعداد، result للنتيجة.
- أظهر أسماء المتغيرات وقيمها أو تحديثاتها داخل وصف خطوات المخطط نفسه، مثل: [PROCESS]: currentSum = currentSum + nums[index].
- اكتب شرط القرار كتعبير واضح يستخدم المتغيرات، مثل: [DECISION]: nums[index] == target?
- اجعل الإدخال يحدد المتغيرات المستقبلة، والإخراج يذكر المتغير الذي يحمل النتيجة.
- لا تستخدم أسماء متغيرات لا وجود لها في الخوارزمية، ولا تخترع قيماً فعلية غير موجودة في المثال. إذا احتجت إلى قيمة توضيحية في سجل التنفيذ، صرّح أنها افتراضية.
- إذا كانت المسألة تتطلب عدة متغيرات، أضف قبل المخطط عنواناً فرعياً ## قاموس المتغيرات يذكر الاسم الإنجليزي ومعناه العربي بإيجاز، ثم أعد استخدام الأسماء نفسها حرفياً داخل المخطط.

## مخطط سير الخوارزمية
هذا القسم إلزامي في كل إجابة، ولا يجوز حذفه أو استبداله بعبارة عامة. أنشئ مخطط تدفق خاصاً بهذه المسألة من 5 إلى 8 خطوات مرقمة، بحيث تمثل كل خطوة عملية أو قراراً حقيقياً في الخوارزمية المقترحة. ابدأ بقراءة المدخلات والتحقق منها، ثم اعرض العمليات والتحققات والتكرار أو المقارنة حسب طبيعة المسألة، وأنهِ بإرجاع النتيجة. لا تستخدم خطوات عامة لا تنطبق على المسألة.
اكتب كل خطوة في مخطط الانسياب بسطر مستقل وببادئة تصنيف إلزامية واحدة من هذه البوادئ الإنجليزية الدقيقة، ثم نقطتين ثم وصف الخطوة بالعربية:
[INPUT]: لقراءة المدخلات أو استقبال القيم فقط.
[PROCESS]: للحسابات، تهيئة المتغيرات، التحديث، الفرز، البحث، التكرار الذي لا يمثل سؤالاً متفرعاً.
[DECISION]: لسؤال منطقي حقيقي إجابته نعم/لا ويؤدي إلى مسارين مختلفين فقط، مثل تحقق شرط أو مقارنة.
[OUTPUT]: لعرض النتيجة أو إرجاعها أو طباعة المخرجات.
عندما تحتوي الخوارزمية على قرار [DECISION] له مساران، أخرج بعده مباشرة سطرين مستقلين بهذا الترتيب: [YES]: وصف العملية التي تحدث عند تحقق الشرط، ثم [NO]: وصف العملية عند عدم تحققه. لا تضع هذين السطرين إلا إذا كان المساران مختلفين فعلاً. بعد انتهاء المسارين، أخرج [MERGE]: للخطوة المشتركة التالية إن وجدت. عند وجود تكرار يعود إلى شرط سابق، أضف [LOOP]: وصف الرجوع إلى الشرط أو تكرار الحلقة. يجب أن تكون خطوات YES وNO إجراءات حقيقية وليست مجرد كلمتي نعم ولا.
لا تخمّن التصنيف من صياغة عربية مبهمة؛ اختر البادئة وفق وظيفة الخطوة الفعلية في الخوارزمية. لا تستخدم [DECISION] لمجرد وجود كلمة تحقق أو مقارنة ضمن وصف عملية؛ استخدمها فقط عندما توجد نقطة تفرّع فعلية. لا تضع كلمات التصنيف داخل نص الشرح نفسه، ولا تخلط أكثر من نوع في خطوة واحدة. يجب أن يحتوي المخطط عادة على قراءة مدخلات [INPUT]، وخطوات معالجة [PROCESS]، وقرار [DECISION] فقط عند وجود شرط فعلي، وإخراج [OUTPUT]. إذا لم توجد مدخلات منفصلة أو تفرعات، لا تخترعها. الواجهة ترسم البداية والنهاية بيضاوياً تلقائياً، [PROCESS] مستطيلاً، [DECISION] مُعيناً مع مساري نعم/لا، و[INPUT]/[OUTPUT] متوازي أضلاع.\nأنشئ بعد ذلك سجل محاكاة تعليمي من 5 إلى 8 خطوات مرقمة يوضح كيف تطبق الخوارزمية على مثال محدد تحت عنوان ## تتبع التنفيذ.
- استخدم أحد أمثلة الإدخال والإخراج الموجودة في نص المسألة، واذكر في كل خطوة ما يحدث للقيم أو المؤشرات أو المتغيرات المهمة.
- أظهر انتقال الحالة بالترتيب، ثم وضّح النتيجة النهائية وكيف تطابقت مع المخرج المتوقع.
- إذا لم يتضمن نص المسألة مثالاً، اختر أصغر مثال توضيحي صحيح وصرّح بوضوح أنه مثال توضيحي وليس من نص المسألة.
- اجعل كل خطوة سطراً مستقلاً يبدأ برقم مثل: 1. ...
- اكتب هذا القسم بالعربية فقط، ولا تضع كتلة كود فيه.
- لا تدّعِ تنفيذ البرنامج فعلياً، ولا تعرض التفكير الداخلي أو الاستدلال الخفي؛ اعرض فقط خطوات الخوارزمية وحركة البيانات التي يمكن شرحها والتحقق منها.
${coach ? "## نصائح المدرب\nأضف من 2 إلى 3 أسئلة أو تلميحات تعليمية قصيرة باللغة العربية لمساعدة الطالب على التحقق من فهمه." : ""}

استخدم الأمثلة والقيود الموجودة في نص المسألة. لا تدّعِ أنك شغّلت الكود أو اختبرته. إذا كانت التفاصيل ناقصة فاذكر الافتراضات المعقولة بالعربية. لا تخترع قيوداً أو مخرجات. تذكّر: كل النص التفسيري عربي، والكود وحده إنجليزي.

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
  if (!process.env.DATABASE_URL || !body.clientId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.clientId)) return;
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO solve_history
        (client_id, title, source_url, difficulty, mode, language, problem_text, answer_markdown)
      VALUES
        (${body.clientId}, ${body.title?.trim() || "Untitled problem"}, ${body.sourceUrl?.trim() || null},
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
