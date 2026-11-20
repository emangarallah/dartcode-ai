"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AudioLines, BookOpen, Bot, Check, ChevronDown, CircleStop, Code2, Copy, ExternalLink, Headphones, Loader2, Pause, Play, RotateCcw, Send, Sparkles, Volume2 } from "lucide-react";

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

export default function HomePage() {
  const [problem, setProblem] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [mode, setMode] = useState<Mode>("coach");
  const [language, setLanguage] = useState<Language>("Dart");
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);

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
    setSpeaking(false); setPaused(false);
  }

  function speak() {
    if (!spokenText.trim() || !("speechSynthesis" in window)) return;
    if (paused) { window.speechSynthesis.resume(); setPaused(false); setSpeaking(true); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.toLowerCase().startsWith("ar")) || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    if (preferred) utterance.voice = preferred;
    utterance.lang = preferred?.lang || "ar";
    utterance.rate = 0.94;
    utterance.onend = () => { setSpeaking(false); setPaused(false); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); };
    window.speechSynthesis.speak(utterance);
    setSpeaking(true); setPaused(false);
  }

  async function solve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problem.trim()) { setError("اكتب نص المسألة أولاً."); return; }
    setLoading(true); setError(""); setAnswer(""); stopSpeech();
    try {
      const response = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemText: problem.trim(), sourceUrl: url.trim(), difficulty, mode, language, title: title.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر توليد الحل. حاول مرة أخرى.");
      setAnswer(data.answer || "");
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
          {answer && <div className="answer-content" dir="ltr">
            <div className="answer-toolbar"><span><span className="status-dot"/> تم إنشاء الشرح</span><div className="toolbar-actions"><button type="button" onClick={copyAnswer} title="نسخ الشرح"><Copy size={15}/> نسخ</button><button type="button" onClick={() => { setAnswer(""); stopSpeech(); }} title="مسح النتيجة"><RotateCcw size={15}/></button></div></div>
            <div className="answer-markdown">{renderAnswer(answer)}</div>
            <div className="coach-audio"><div className="audio-icon"><AudioLines size={19}/></div><div className="audio-copy"><b>المدرب الصوتي</b><small>{voiceReady ? "استمع إلى الشرح بصوت المتصفح" : "استخدم الأصوات المثبتة في جهازك"}</small></div><div className="audio-controls">
              {!speaking && !paused ? <button type="button" onClick={speak} aria-label="تشغيل الشرح"><Play size={16} fill="currentColor"/></button> : <button type="button" onClick={() => { window.speechSynthesis.pause(); setPaused(true); setSpeaking(false); }} aria-label="إيقاف مؤقت"><Pause size={16}/></button>}
              {paused && <button type="button" onClick={speak} aria-label="استكمال الشرح"><Play size={15}/></button>}
              <button type="button" onClick={stopSpeech} aria-label="إيقاف الصوت"><CircleStop size={16}/></button>
            </div></div>
            <p className="audio-hint"><Volume2 size={13}/> قد تختلف جودة الصوت واللغة حسب الأصوات المتاحة في المتصفح والجهاز.</p>
          </div>}
        </section>
      </div>
      <footer className="footer"><span>DartCode AI</span><span>صُمّم ليحوّل طريقة تعلّمك للبرمجة <span className="footer-heart">♥</span></span><span>BUILD YOUR LOGIC.</span></footer>
    </main>
  );
}
