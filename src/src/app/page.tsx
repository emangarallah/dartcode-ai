"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, BookOpen, Bot, Check, ChevronDown, ChevronLeft, ChevronRight, CircleStop, Code2, Copy, ExternalLink, Headphones, Loader2, Pause, Play, RotateCcw, Send, Sparkles, Terminal, Volume2 } from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type Mode = "coach" | "direct";
type Language = "Dart" | "Python" | "JavaScript" | "Java" | "C++" | "C#" | "Go" | "Rust";

const languages: Language[] = ["Dart", "Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust"];

function renderAnswer(markdown: string) {
  const lines = markdown.split("\n");
  const output: React.ReactNode[] = [];
  let code: string[] = [];
  let inCode = false;
  let language = "";
  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (!inCode) { inCode = true; language = line.trim().slice(3); code = []; }
      else { output.push(<pre className="code-block" key={"code" + index}><div className="code-label">{language || "CODE"}</div><code>{code.join("\n")}</code></pre>); inCode = false; }
      return;
    }
    if (inCode) { code.push(line); return; }
    if (!line.trim()) { output.push(<div className="answer-gap" key={index} />); return; }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) output.push(<h3 key={index}>{heading[2]}</h3>);
    else if (/^[-*]\s+/.test(line)) output.push(<p className="answer-list" key={index}>• {line.replace(/^[-*]\s+/, "")}</p>);
    else if (/^\d+\.\s+/.test(line)) output.push(<p className="answer-list" key={index}>{line}</p>);
    else output.push(<p key={index}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>);
  });
  if (inCode) output.push(<pre className="code-block" key="unfinished"><code>{code.join("\n")}</code></pre>);
  return output;
}

function extractExecutionTrace(markdown: string): { content: string; steps: string[] } {
  const lines = markdown.split(/\r?\n/);
  const heading = /^##\s+(?:تتبّع التنفيذ|تتبع التنفيذ)\s*$/;
  const start = lines.findIndex((line) => heading.test(line.trim()));
  if (start < 0) return { content: markdown, steps: [] };

  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line.trim()));
  if (end < 0) end = lines.length;

  const steps = lines
    .slice(start + 1, end)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("```"))
    .map((line) => line.replace(/^[-*]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean);

  const content = [...lines.slice(0, start), ...lines.slice(end)].join("\n").trim();
  return { content, steps };
}


function ComplexityChart({ answer }: { answer: string }) {
  const normalized = answer.toLowerCase().replace(/²/g, "^2").replace(/\\s+/g, "");
  const selected = normalized.match(/o\\((?:n\\*\\*2|n\\^2|n\\*n|nlogn|n|logn|1)\\)/)?.[0] || "";
  const active = selected.includes("n^2") || selected.includes("n*n") || selected.includes("n**2") ? "n2"
    : selected.includes("nlogn") ? "nlogn"
    : selected.includes("logn") ? "logn"
    : selected.includes("o(n)") ? "n"
    : selected.includes("o(1)") ? "one" : "";
  const curves = [
    { id: "one", label: "O(1)", color: "#66d9d0", fn: (n: number) => 12 },
    { id: "logn", label: "O(log n)", color: "#8b7cff", fn: (n: number) => 12 + Math.log2(n) * 12 },
    { id: "n", label: "O(n)", color: "#e8bd62", fn: (n: number) => n * 12 },
    { id: "nlogn", label: "O(n log n)", color: "#62c997", fn: (n: number) => n * Math.log2(n) * 3.7 },
    { id: "n2", label: "O(n²)", color: "#f07888", fn: (n: number) => n * n * 1.45 },
  ];
  const pathFor = (fn: (n: number) => number) =>
    Array.from({ length: 10 }, (_, i) => {
      const x = 48 + i * 54;
      const y = 204 - Math.min(160, fn(i + 1));
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  return (
    <section className="complexity-chart" dir="rtl" aria-label="مخطط مقارنة التعقيد الزمني">
      <div className="chart-heading">
        <div><h3>مخطط نمو التعقيد الزمني</h3><p>مقارنة سرعة نمو الخوارزميات مع زيادة حجم الإدخال</p></div>
        <span className="chart-tag">BIG O</span>
      </div>
      <div className="chart-scroll" dir="ltr">
        <svg className="complexity-svg" viewBox="0 0 590 250" role="img" aria-label="منحنيات مقارنة O واحد و O لوغاريتمي و O n و O n log n و O n تربيع">
          {[44, 84, 124, 164, 204].map((y) => <line key={y} x1="48" y1={y} x2="534" y2={y} className="chart-gridline" />)}
          <line x1="48" y1="28" x2="48" y2="204" className="chart-axis"/>
          <line x1="48" y1="204" x2="534" y2="204" className="chart-axis"/>
          {[1, 3, 5, 7, 9].map((n) => <text key={n} x={48 + (n - 1) * 54} y="224" className="chart-tick" textAnchor="middle">{n}</text>)}
          <text x="290" y="244" className="chart-axis-label" textAnchor="middle">حجم الإدخال (n)</text>
          <text x="14" y="116" className="chart-axis-label" textAnchor="middle" transform="rotate(-90 14 116)">العمليات النسبية</text>
          {curves.map((curve) => <path key={curve.id} d={pathFor(curve.fn)} fill="none" stroke={curve.color} strokeWidth={active === curve.id ? 4 : 2} opacity={!active || active === curve.id ? 1 : .38} strokeLinecap="round" strokeLinejoin="round" className={active === curve.id ? "chart-line selected" : "chart-line"}/>)}
        </svg>
      </div>
      <div className="chart-legend">
        {curves.map((curve) => <span key={curve.id} className={active === curve.id ? "chart-legend-item selected" : "chart-legend-item"}><i style={{ background: curve.color }}/>{curve.label}</span>)}
      </div>
      <p className="chart-footnote">{active ? `تم إبراز المنحنى الأقرب للتعقيد المذكور في الشرح: ${curves.find((curve) => curve.id === active)?.label}.` : "يعرض المخطط مقارنة تعليمية عامة. أضف Big O بصيغة O(n) أو O(log n) في الشرح ليتم إبراز المنحنى تلقائياً."}</p>
    </section>
  );
}

export default function HomePage() {
  const [problem, setProblem] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [mode, setMode] = useState<Mode>("coach");
  const [language, setLanguage] = useState<Language>("Dart");
  const [answer, setAnswer] = useState("");
  const [traceSteps, setTraceSteps] = useState<string[]>([]);
  const [traceIndex, setTraceIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const speechQueueRef = useRef<string[]>([]);
  const speechCursorRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => setVoiceReady(window.speechSynthesis.getVoices().length > 0);
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => { window.speechSynthesis.cancel(); window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const spokenText = useMemo(() => answer
    .replace(/```[\s\S]*?```/g, " تم تجاوز مقطع الكود ")
    .replace(/![[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[>*_`#]/g, "")
    .replace(/\n{2,}/g, ". "), [answer]);

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speechQueueRef.current = [];
    speechCursorRef.current = 0;
    setSpeaking(false); setPaused(false);
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
      return;
    }
    if (speaking) return;

    window.speechSynthesis.cancel();
    const segments = traceSteps.length
      ? traceSteps.map((step, index) => `الخطوة ${index + 1}. ${step}`)
      : [spokenText];
    if (!segments.some((segment) => segment.trim())) return;

    speechQueueRef.current = segments;
    speechCursorRef.current = 0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("ar"))
      || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

    const speakNext = () => {
      const index = speechCursorRef.current;
      const segment = speechQueueRef.current[index];
      if (!segment) {
        setSpeaking(false);
        setPaused(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(segment);
      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred?.lang || "ar";
      utterance.rate = 0.94;
      utterance.onstart = () => {
        if (traceSteps.length) setTraceIndex(index);
      };
      utterance.onend = () => {
        speechCursorRef.current += 1;
        speakNext();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    setSpeaking(true);
    setPaused(false);
    speakNext();
  }

  async function solve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem.trim()) { setError("اكتب نص المسألة أولاً."); return; }
    setLoading(true); setError(""); setAnswer(""); setTraceSteps([]); setTraceIndex(0); stopSpeech();
    try {
      let clientId = window.localStorage.getItem("dartcode_client_id");
      if (!clientId) {
        clientId = window.crypto.randomUUID();
        window.localStorage.setItem("dartcode_client_id", clientId);
      }
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, problemText: problem.trim(), sourceUrl: url.trim(), difficulty, mode, language, title: title.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر توليد الحل. حاول مرة أخرى.");
      const generatedAnswer = data.answer || "";
      const parsedAnswer = extractExecutionTrace(generatedAnswer);
      setAnswer(parsedAnswer.content || generatedAnswer);
      setTraceSteps(parsedAnswer.steps);
      setTraceIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally { setLoading(false); }
  }

  async function copyAnswer() {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><Code2 size={23}/></span><span>DartCode <b>AI</b><small>LEARN · THINK · SOLVE</small></span></a>
        <div className="topbar-right"><span className="status-dot"/> مدربك البرمجي الذكي <span className="top-pill">BETA</span></div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL CODING COACH</div>
        <h1>لا تحفظ الحل... <span>افهم الفكرة.</span></h1>
        <p>حوّل مسائل LeetCode وProblem Solving إلى فرصة حقيقية لتطوير مهاراتك، خطوة بخطوة مع مدربك الذكي.</p>
      </section>

      <div className="workspace">
        <section className="panel input-panel">
          <div className="panel-heading"><div className="heading-icon"><BookOpen size={19}/></div><div><h2>مسألتك البرمجية</h2><p>أدخل وصف المسألة وابدأ رحلة الحل</p></div></div>
          <form onSubmit={solve}>
            <label className="field-label" htmlFor="problem-title">اسم المسألة <span>اختياري</span></label>
            <input id="problem-title" className="text-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: Two Sum"/>
            <label className="field-label" htmlFor="problem-url">رابط المسألة <span>LeetCode أو غيره</span></label>
            <div className="url-wrap"><ExternalLink size={16}/><input id="problem-url" className="url-input" dir="ltr" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://leetcode.com/problems/..."/></div>
            <label className="field-label" htmlFor="problem-text">وصف المسألة <b>*</b></label>
            <textarea id="problem-text" className="problem-textarea" value={problem} onChange={e => setProblem(e.target.value)} placeholder="الصق نص المسألة هنا...\n\nاكتب المطلوب، المدخلات، المخرجات، والأمثلة إن وجدت." required/>
            <div className="settings-grid">
              <div><label className="field-label" htmlFor="difficulty">مستوى الصعوبة</label><div className="select-wrap"><select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}><option value="Easy">سهل · Easy</option><option value="Medium">متوسط · Medium</option><option value="Hard">صعب · Hard</option></select><ChevronDown size={15}/></div></div>
              <div><label className="field-label" htmlFor="language">لغة الحل</label><div className="select-wrap"><select id="language" value={language} onChange={e => setLanguage(e.target.value as Language)}>{languages.map(item => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={15}/></div></div>
            </div>
            <div className="field-label mode-label">طريقة التعلم</div>
            <div className="mode-switch">
              <button type="button" className={mode === "coach" ? "mode-option active" : "mode-option"} onClick={() => setMode("coach")}><Headphones size={17}/><span><b>وضع المدرب</b><small>افهم الفكرة بالتدريج</small></span></button>
              <button type="button" className={mode === "direct" ? "mode-option active" : "mode-option"} onClick={() => setMode("direct")}><Code2 size={17}/><span><b>الحل المباشر</b><small>الحل مع الشرح المختصر</small></span></button>
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button className="solve-button" type="submit" disabled={loading}>{loading ? <><Loader2 className="spin" size={18}/> جارٍ تحليل المسألة...</> : <><Sparkles size={18}/> حلّل المسألة مع AI <Send size={16}/></>}</button>
            <p className="privacy-note">تأكد من إدخال نص المسألة كاملاً للحصول على شرح أدق.</p>
          </form>
        </section>

        <section className="panel answer-panel">
          <div className="panel-heading answer-heading"><div className="heading-icon purple"><Bot size={20}/></div><div><h2>مساحة الشرح والحل</h2><p>هنا سيظهر تحليلك البرمجي</p></div><span className="ai-tag"><span/> AI ENGINE</span></div>
          {!answer && !loading && <div className="empty-state"><div className="empty-illustration"><Code2 size={39}/><Sparkles className="sparkle-one" size={17}/><span className="empty-orbit"/></div><h3>جاهز نبدأ التحدي؟</h3><p>أرسل المسألة، وسيقوم المدرب بتحليلها وشرح الفكرة وبناء الحل أمامك.</p><div className="empty-steps"><span><Check size={14}/> تحليل الفكرة</span><span><Check size={14}/> شرح الخوارزمية</span><span><Check size={14}/> كود قابل للنسخ</span></div></div>}
          {loading && <div className="loading-state"><div className="loading-ring"><Bot size={27}/></div><h3>نفكر في أفضل حل...</h3><p>نحلل المعطيات ونرتب خطوات الحل البرمجي.</p><div className="loading-bar"><span/></div></div>}
          {answer && <div className="answer-content" dir="rtl">
            <div className="answer-toolbar"><span><span className="status-dot"/> تم إنشاء الشرح</span><div className="toolbar-actions"><button type="button" onClick={copyAnswer} title="نسخ الشرح"><Copy size={15}/> نسخ</button><button type="button" onClick={() => { setAnswer(""); setTraceSteps([]); setTraceIndex(0); stopSpeech(); }} title="مسح النتيجة"><RotateCcw size={15}/></button></div></div>
            <div className="answer-markdown" dir="rtl">{renderAnswer(answer)}</div>
            <section className="execution-console" aria-label="محاكاة خطوات تنفيذ الخوارزمية">
              <div className="console-topbar">
                <div className="console-lights" aria-hidden="true"><i/><i/><i/></div>
                <div className="console-heading"><Terminal size={15}/> ALGORITHM TRACE</div>
                <span className={traceSteps.length ? "console-status" : "console-status unavailable"}>
                  {traceSteps.length ? "TRACE READY" : "TRACE UNAVAILABLE"}
                </span>
              </div>
              <div className="console-content" aria-live="polite">
                {traceSteps.length > 0 ? traceSteps.map((step, index) => (
                  <button
                    className={index === traceIndex ? "console-step active" : "console-step"}
                    key={index}
                    type="button"
                    onClick={() => setTraceIndex(index)}
                    aria-current={index === traceIndex ? "step" : undefined}
                  >
                    <span className="console-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="console-step-text" dir="rtl">{step}</span>
                    {index === traceIndex && <span className="console-caret" aria-hidden="true">▋</span>}
                  </button>
                )) : (
                  <div className="console-empty" dir="rtl">
                    لم يصل سجل خطوات من النموذج لهذه المسألة. أعد طلب الحل للحصول على محاكاة مفصلة.
                  </div>
                )}
              </div>
              <div className="console-controls" dir="rtl">
                <span className="console-counter">
                  الخطوة <b>{traceSteps.length ? traceIndex + 1 : 0}</b> من <b>{traceSteps.length}</b>
                </span>
                <div className="console-control-buttons">
                  <button type="button" disabled={!traceSteps.length || traceIndex === 0} onClick={() => setTraceIndex((value) => Math.max(0, value - 1))}>
                    <ChevronRight size={14}/> السابق
                  </button>
                  <button type="button" disabled={!traceSteps.length || traceIndex >= traceSteps.length - 1} onClick={() => setTraceIndex((value) => Math.min(traceSteps.length - 1, value + 1))}>
                    التالي <ChevronLeft size={14}/>
                  </button>
                  <button type="button" disabled={!traceSteps.length} onClick={() => setTraceIndex(0)}>
                    <RotateCcw size={13}/> إعادة
                  </button>
                </div>
              </div>
              <p className="console-note" dir="rtl">محاكاة تعليمية توضّح تغيّر القيم وفق المثال، وليست تشغيلاً فعلياً للكود.</p>
            </section>
            <section className="algorithm-map" dir="rtl">
              <h3>مخطط سير الخوارزمية</h3>
              <div className="flowchart">
                {traceSteps.map((step, index) => (
                  <div className="flow-item" key={index}>
                    <button type="button" className={index === traceIndex ? "flow-node active" : index < traceIndex ? "flow-node done" : "flow-node"} onClick={() => setTraceIndex(index)}>
                      <small>{String(index + 1).padStart(2, "0")}</small><span>{step}</span>
                    </button>
                    {index < traceSteps.length - 1 && <div className="flow-line"><i/></div>}
                  </div>
                ))}
              </div>
            </section>
            <ComplexityChart answer={answer} />
            <div className="coach-audio"><div className="audio-icon"><AudioLines size={19}/></div><div className="audio-copy"><b>المدرب الصوتي</b><small>{voiceReady ? "يتزامن صوت المدرب مع إبراز كل خطوة في المخطط" : "يتطلب الصوت دعماً من المتصفح وأصواتاً مثبتة على جهازك"}</small></div><div className="audio-controls">
              {!speaking && !paused ? <button type="button" onClick={speak} aria-label="تشغيل الشرح"><Play size={16} fill="currentColor"/></button> : <button type="button" onClick={() => { window.speechSynthesis.pause(); setPaused(true); setSpeaking(false); }} aria-label="إيقاف مؤقت"><Pause size={16}/></button>}
              {paused && <button type="button" onClick={speak} aria-label="استكمال الشرح"><Play size={15}/></button>}
              <button type="button" onClick={stopSpeech} aria-label="إيقاف الصوت"><CircleStop size={16}/></button>
            </div></div>
            <p className="audio-hint"><Volume2 size={13}/> يشرح المدرب خطوات التتبّع بالتتابع؛ ويتحرك تمييز المخطط تلقائياً مع كل خطوة. يتم تجاوز مقاطع الكود.</p>
          </div>}
        </section>
      </div>
      <footer className="footer"><span>DartCode AI</span><span>صُمّم ليحوّل طريقة تعلّمك للبرمجة <span className="footer-heart">♥</span></span><span>BUILD YOUR LOGIC.</span></footer>
    </main>
  );
}
