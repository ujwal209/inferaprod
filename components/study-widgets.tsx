'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { 
  BookOpen, CheckCircle2, X, Sparkles, Check, 
  Loader2, BarChart, ArrowRight, Copy, Maximize2, Download 
} from 'lucide-react'

import { createClient } from '@/utils/supabase/client'
import { saveQuizResult } from '@/app/actions/study'

const supabase = createClient()

// In-memory cache to survive ReactMarkdown arbitrary component remounts during active chat session
const temporaryQuizSessionCache: Record<string, { selected: Record<number, number>, submitted: boolean }> = {};

// ==========================================
// 1. QUIZ WIDGET (STRICTLY NO LOCAL STORAGE FOR STATE)
// ==========================================
export const QuizWidget = ({ topic, questions, question, options, correctIndex, explanation, onAnswerSubmitted, sessionId, isHistorical }: any) => {
  const quizList = questions || [{ question, options, correctIndex, explanation }];
  const uniqueQuizKey = `${sessionId}-${quizList[0]?.question?.substring(0, 30)}`;

  const [selectedMap, setSelectedMap] = useState<Record<number, number>>(() => temporaryQuizSessionCache[uniqueQuizKey]?.selected || {});
  const [submitted, setSubmitted] = useState(() => temporaryQuizSessionCache[uniqueQuizKey]?.submitted || false);
  const [saving, setSaving] = useState(false);

  // 🚀 ONLY lock the quiz if it's an OLD message loaded from the Supabase Database AND isn't in current session cache.
  // NO LOCAL STORAGE CACHING.
  useEffect(() => {
    if (isHistorical && !submitted && !temporaryQuizSessionCache[uniqueQuizKey]?.submitted) {
      setSelectedMap(quizList.reduce((acc: any, _: any, i: number) => ({...acc, [i]: quizList[i].correctIndex}), {}));
      setSubmitted(true);
    }
  }, [isHistorical, quizList, submitted, uniqueQuizKey]);

  const isAllAnswered = Object.keys(selectedMap).length === quizList.length;

  const handleSubmit = async () => {
    if (!isAllAnswered || submitted || isHistorical) return;
    setSaving(true);
    
    // Save to cache before remount happens
    temporaryQuizSessionCache[uniqueQuizKey] = { selected: selectedMap, submitted: true };
    setSubmitted(true);

    let score = 0;
    quizList.forEach((q: any, i: number) => {
      if (selectedMap[i] === q.correctIndex) score++;
    });

    try {
      // 1. STRICTLY SAVE TO DATABASE ONLY
      await saveQuizResult({
        session_id: sessionId || 'local',
        topic: topic || 'General Concept',
        score: score,
        total_questions: quizList.length,
        quiz_data: { questions: quizList, selected: selectedMap }
      });
      
      // 2. Ping the Navbar Notification Bell (This does NOT affect quiz lock state)
      const storedNotifs = localStorage.getItem('infera_notifications');
      let notifs = storedNotifs ? JSON.parse(storedNotifs) : [];
      const newNotif = {
        id: Date.now().toString(),
        title: 'Assessment Graded!',
        message: `You scored ${score}/${quizList.length} on "${topic}".`,
        time: 'Just now',
        unread: true,
        iconType: 'sparkles',
        bg: 'bg-[#00BC7D]/20 dark:bg-[#00BC7D]/20',
        link: '/dashboard/chat'
      };
      localStorage.setItem('infera_notifications', JSON.stringify([newNotif, ...notifs]));
      window.dispatchEvent(new Event('storage'));
    } catch(e) {
      console.error("DB Save failed:", e);
    }

    setSubmitted(true);
    setSaving(false);

    // Tell the AI our score, and let it handle the progression
    const feedbackMsg = `I submitted the assessment and scored ${score} out of ${quizList.length}. Please update my progress and ask me if I am ready to continue.`;
    if (onAnswerSubmitted) onAnswerSubmitted(feedbackMsg, true);
  }

  return (
    <div className="my-6 rounded-[1.5rem] bg-white dark:bg-[#0c0c0e] border border-[#00BC7D]/30 dark:border-[#00BC7D]/30 shadow-xl shadow-[#00BC7D]/5 w-full max-w-full sm:max-w-3xl font-outfit overflow-hidden flex flex-col">
      <div className="bg-zinc-50 dark:bg-[#111113] border-b border-zinc-100 dark:border-zinc-800/80 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#00BC7D]/10 border border-[#00BC7D]/20 flex items-center justify-center shadow-sm shrink-0">
            <BookOpen size={16} className="text-[#00BC7D]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-google-sans text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5 truncate">
              {quizList.length > 1 ? 'Comprehensive Assessment' : 'Knowledge Check'}
            </h3>
            <p className="text-[13px] font-semibold text-[#00BC7D] truncate max-w-[150px] sm:max-w-xs">{topic}</p>
          </div>
        </div>
        {submitted && (
          <span className="px-2.5 py-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 shrink-0 ml-2">
            <CheckCircle2 size={13} /> <span className="hidden sm:inline">Completed</span>
          </span>
        )}
      </div>
      
      <div className="p-4 sm:p-6 space-y-8 sm:space-y-10">
        {quizList.map((q: any, qIndex: number) => (
          <div key={qIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${qIndex * 100}ms` }}>
            <div className="flex gap-3 mb-4 min-w-0">
              {quizList.length > 1 && (
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#00BC7D]/10 text-[#00BC7D] font-bold text-[13px] shrink-0">
                  {qIndex + 1}
                </span>
              )}
              <div className="text-[15px] sm:text-[16px] font-bold text-zinc-900 dark:text-white leading-relaxed pt-0.5 prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 prose-headings:my-0 w-full overflow-x-auto break-words custom-scrollbar">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={getMarkdownComponents()}>
                  {q.question}
                </ReactMarkdown>
              </div>
            </div>

            <div className="space-y-2.5 ml-0 sm:ml-10">
              {q.options.map((opt: string, i: number) => {
                let stateClass = "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300"
                let badgeClass = "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                
                if (submitted) {
                  if (i === q.correctIndex) {
                    stateClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20 shadow-sm"
                    badgeClass = "bg-emerald-500 text-white shadow-sm"
                  } else if (i === selectedMap[qIndex]) {
                    stateClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 shadow-sm"
                    badgeClass = "bg-red-500 text-white shadow-sm"
                  } else {
                    stateClass = "border-zinc-200 dark:border-zinc-800 opacity-40 cursor-default"
                  }
                } else {
                  if (selectedMap[qIndex] === i) {
                    stateClass = "border-[#00BC7D] bg-[#00BC7D]/10 text-[#00a36c] dark:text-[#00BC7D] ring-2 ring-[#00BC7D]/20 shadow-sm"
                    badgeClass = "bg-[#00BC7D] text-white shadow-sm"
                  } else {
                    stateClass += " hover:border-[#00BC7D]/50 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  }
                }

                return (
                  <button
                    key={i}
                    disabled={submitted}
                    onClick={() => setSelectedMap(prev => ({...prev, [qIndex]: i}))}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 sm:gap-4 ${stateClass} min-w-0`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-[12px] sm:text-[13px] shrink-0 transition-colors ${badgeClass}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="text-[13.5px] sm:text-[14.5px] leading-snug prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 w-full overflow-x-auto break-words custom-scrollbar">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={getMarkdownComponents()}>
                        {opt}
                      </ReactMarkdown>
                    </div>
                    {submitted && i === q.correctIndex && <CheckCircle2 size={16} className="text-emerald-500 ml-auto shrink-0" />}
                    {submitted && i === selectedMap[qIndex] && i !== q.correctIndex && <X size={16} className="text-red-500 ml-auto shrink-0" />}
                  </button>
                )
              })}
            </div>

            {submitted && (
              <div className="mt-4 ml-0 sm:ml-10 p-4 sm:p-5 rounded-xl bg-[#00BC7D]/10 border border-[#00BC7D]/20 text-[13.5px] sm:text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-start gap-3 min-w-0">
                <Sparkles size={16} className="text-[#00BC7D] shrink-0 mt-0.5" />
                <div className="prose prose-zinc dark:prose-invert max-w-none w-full overflow-x-auto break-words custom-scrollbar">
                  <span className="font-bold text-zinc-900 dark:text-white mr-2">Explanation:</span>
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={getMarkdownComponents()}>
                    {q.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

        {!submitted && !isHistorical && (
          <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800/80 mt-6">
            <button 
              onClick={handleSubmit} 
              disabled={!isAllAnswered || saving}
              className="w-full h-12 bg-[#00BC7D] hover:bg-[#00a36c] text-white font-bold text-[14.5px] sm:text-[15px] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#00BC7D]/25 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : 'Submit Assessment'}
            </button>
            {!isAllAnswered && (
              <p className="text-center text-zinc-400 text-[12px] font-medium mt-3">
                Answer all {quizList.length} questions to submit
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// 2. PROGRESS WIDGET
// ==========================================
export const ProgressWidget = ({ topic, masteryPercentage, completedConcepts, nextConcept }: any) => {
  const radius = 60;
  const arc = Math.PI * radius; 
  const percentage = Math.max(0, Math.min(100, masteryPercentage || 0));
  const offset = arc - (percentage / 100) * arc;

  return (
    <div className="my-6 p-5 sm:p-6 rounded-[1.5rem] bg-gradient-to-br from-[#00BC7D]/5 to-[#00a36c]/5 border border-[#00BC7D]/20 dark:border-[#00BC7D]/30 w-full max-w-full sm:max-w-xl font-outfit shadow-xl shadow-[#00BC7D]/5 overflow-hidden">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#00BC7D] flex items-center justify-center shadow-md shadow-[#00BC7D]/20 shrink-0">
            <BarChart size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-google-sans text-[10px] sm:text-[11px] font-bold text-[#00BC7D] uppercase tracking-widest mb-0.5">Live Tracker</h3>
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight truncate w-full">{topic}</p>
          </div>
        </div>
      </div>
      
      <div className="relative flex justify-center items-end h-[70px] sm:h-[80px] mb-6 sm:mb-8">
        <svg className="w-[140px] h-[70px] sm:w-[160px] sm:h-[80px] drop-shadow-md" viewBox="0 0 160 80">
          <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-zinc-200 dark:text-zinc-800" />
          <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="url(#progress-gradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={Math.PI * 70} strokeDashoffset={(Math.PI * 70) - (percentage / 100) * (Math.PI * 70)} className="transition-all duration-1000 ease-out" />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BC7D" />
              <stop offset="100%" stopColor="#00a36c" /> 
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-2xl sm:text-3xl font-black text-[#00BC7D] leading-none">
            {percentage}%
          </span>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1">Mastery</span>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Mastered Concepts</p>
          <div className="flex flex-wrap gap-2">
            {completedConcepts?.length > 0 ? completedConcepts.map((c: string, i: number) => (
              <span key={i} className="px-2.5 py-1.5 bg-[#00BC7D]/10 text-[#00a36c] dark:text-[#00BC7D] text-[11px] sm:text-[12px] font-bold rounded-lg border border-[#00BC7D]/20 flex items-center gap-1.5 shadow-sm break-words">
                <CheckCircle2 size={13} className="shrink-0" /> {c}
              </span>
            )) : (
              <span className="text-zinc-400 text-[12px] italic">Learning in progress...</span>
            )}
          </div>
        </div>
        
        <div className="p-3 sm:p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-[#00BC7D]/20 dark:border-[#00BC7D]/20 shadow-sm min-w-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Up Next</p>
          <p className="text-[14px] sm:text-[15px] font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 break-words w-full">
            <ArrowRight size={15} className="text-[#00BC7D] shrink-0" /> 
            <span className="truncate">{nextConcept}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// 3. UTILITIES & JSON PARSER
// ==========================================
export const extractWidgets = (rawText: string) => {
  let text = rawText || '';
  const widgets: any[] = [];
  let isStreaming = false;

  // Pre-clean backticks for safety
  text = text.replace(/```json\?chameleon\n?/g, '').replace(/```json\n?/g, '');

  while (true) {
    const match = text.match(/\{\s*"component"\s*:\s*"(QuizWidget|ProgressWidget)"/);
    
    if (!match) {
      const partialMatch = text.match(/\{\s*"component"/);
      if (partialMatch) {
        isStreaming = true;
        text = text.substring(0, partialMatch.index);
      }
      break;
    }

    const startIndex = match.index!;
    let openBraces = 0;
    let lastIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];
      if (escapeNext) { escapeNext = false; continue; }
      if (char === '\\') { escapeNext = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === '{') openBraces++;
        if (char === '}') {
          openBraces--;
          if (openBraces === 0) { lastIndex = i; break; }
        }
      }
    }

    if (lastIndex !== -1) {
      const jsonStr = text.substring(startIndex, lastIndex + 1);
      try {
        let parsed = null;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (e) {
          const fixedStr = jsonStr.replace(/\\(?!["\\/bfnrt])/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '');
          parsed = JSON.parse(fixedStr);
        }
        if (parsed) widgets.push(parsed);
        text = text.slice(0, startIndex) + text.slice(lastIndex + 1); 
      } catch(e) {
        text = text.slice(0, startIndex) + text.slice(lastIndex + 1); 
      }
    } else {
      isStreaming = true;
      text = text.substring(0, startIndex);
      break;
    }
  }

  text = text.replace(/```/g, '').trim();
  return { text, widgets, isStreaming };
};

// ==========================================
// 4. THE MARKDOWN COMPONENT
// ==========================================
const extractTextFromNode = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (node && node.props && node.props.children) return extractTextFromNode(node.props.children);
  return '';
};

const BaseMarkdownComponents = {
  table: ({ children }: any) => (
    <div className="my-5 w-full max-w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-sm custom-scrollbar">
      <table className="w-full text-left border-collapse text-[12px] sm:text-[13px] font-outfit min-w-[400px]">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-[#111113] text-zinc-500 dark:text-zinc-400 font-google-sans font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
  th: ({ children }: any) => <th className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
  td: ({ children }: any) => <td className="px-3 py-2 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium whitespace-pre-wrap break-words">{children}</td>,
  
  h1: ({ children }: any) => <h1 className="font-google-sans text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 sm:mt-8 mb-3 sm:mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 break-words">{children}</h1>,
  h2: ({ children }: any) => <h2 className="font-google-sans text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 sm:mt-8 mb-3 sm:mb-4 break-words">{children}</h2>,
  h3: ({ children }: any) => <h3 className="font-google-sans text-[16px] sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-5 sm:mt-6 mb-2 sm:mb-3 break-words">{children}</h3>,
  
  ul: ({ children }: any) => <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-4 font-outfit text-[14.5px] sm:text-[15px] text-zinc-800 dark:text-zinc-300 break-words w-full">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-4 font-outfit text-[14.5px] sm:text-[15px] text-zinc-800 dark:text-zinc-300 break-words w-full">{children}</ol>,
  
  li: ({ children, ...props }: any) => <li className="pl-1 leading-relaxed marker:text-zinc-400 dark:marker:text-zinc-600 break-words" {...props}>{children}</li>,
  p: ({ children, ...props }: any) => <p className="text-[14.5px] sm:text-[15px] leading-relaxed mb-3 sm:mb-4 break-words w-full" {...props}>{children}</p>,
  strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white break-words">{children}</strong>,
  
  a: ({ node, href, children, ...props }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline text-[#00BC7D] hover:text-[#00a36c] underline underline-offset-2 decoration-[#00BC7D]/30 font-semibold transition-colors break-words" {...props}>
      {children}
      <span className="inline-flex items-center justify-center bg-[#00BC7D]/10 text-[#00BC7D] text-[9px] font-google-sans uppercase font-bold px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">Source</span>
    </a>
  ),

  blockquote: ({ children }: any) => {
    return (
      <div className="w-full mt-3 mb-3 p-3 sm:p-4 bg-[#00BC7D]/5 dark:bg-[#111113] border border-[#00BC7D]/20 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 shadow-sm min-w-0">
        <Sparkles size={15} className="text-[#00BC7D] shrink-0 mt-0.5" />
        <span className="leading-snug text-[13.5px] sm:text-[14.5px] font-outfit font-semibold text-zinc-700 dark:text-zinc-300 break-words w-full">{children}</span>
      </div>
    )
  },
};

export const getMarkdownComponents = () => {
  return {
    ...BaseMarkdownComponents,
    code: ({ node, className, inline, children, ...props }: any) => {
      // 🚀 BULLETPROOF ARRAY PARSING FOR CODE BLOCKS
      const rawText = Array.isArray(children) ? children.join('') : String(children);
      const text = rawText.replace(/\n$/, '');
      const match = /language-([a-zA-Z0-9_?\-]+)/.exec(className || '');
      const lang = match ? match[1] : '';

      if (!inline && lang) {
        return (
          <div className="relative my-4 w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-0">
            <div className="bg-[#111113] px-3 py-2 text-[10px] sm:text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center rounded-t-xl">
              <span className="font-google-sans font-bold tracking-wider uppercase text-zinc-500 truncate mr-2">
                {lang.replace('?chameleon', '') || 'code'}
              </span>
            </div>
            <SyntaxHighlighter 
              style={oneDark} 
              language={lang.replace('?chameleon', '')} 
              PreTag="div" 
              className="!m-0 !bg-[#0c0c0e] !p-3 sm:!p-4 custom-scrollbar overflow-x-auto w-full rounded-b-xl" 
              codeTagProps={{ className: "text-[12px] sm:text-[13px] font-mono leading-relaxed text-zinc-200 block min-w-max" }}
            >
              {text}
            </SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code className={`${inline ? 'bg-zinc-100 dark:bg-[#1f1f22] text-zinc-900 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800/50 break-words' : 'block p-3 bg-[#0c0c0e] text-zinc-200 overflow-x-auto rounded-xl custom-scrollbar w-full min-w-max'} font-mono text-[0.8em] font-semibold`} {...props}>
          {text}
        </code>
      );
    }
  }
}

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0" title="Copy message">
      {copied ? <CheckCircle2 size={14} className="text-[#00BC7D]" /> : <Copy size={14} />}
    </button>
  );
};