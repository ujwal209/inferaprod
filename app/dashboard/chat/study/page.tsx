'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import { 
  Search, Menu, X, RefreshCw, Plus, Send, Edit3,
  Trash2, Loader2, Check, PenLine, Globe, Zap, Square,
  GraduationCap, ArrowRight, BrainCircuit, Target,
  History, Trophy, Calendar, XCircle, CheckCircle2, BarChart, CheckSquare, Square as SquareIcon,
  BookOpen, Sparkles, Copy, Maximize2, Download, Search as SearchIcon
} from 'lucide-react'

import { createClient } from '@/utils/supabase/client'
import { RunnableCodeBlock } from '@/components/StudyMarkdown'
import {
  getStudySessions,
  getStudyMessages,
  deleteStudySession,
  renameStudySession,
  sendStudyMessage,
  getQuizHistory,
  saveQuizResult,
  getStudyProgress,
  upsertStudyProgress
} from '@/app/actions/study'

const supabase = createClient()

// In-memory cache to survive ReactMarkdown arbitrary component remounts during active chat session
const temporaryQuizSessionCache: Record<string, { selected: Record<number, number>, submitted: boolean }> = {};

// ==========================================
// 1. QUIZ MARKDOWN COMPONENTS (LaTeX-enabled, compact, quiz-friendly)
// ==========================================
// Defined before QuizWidget to avoid TS resolution crashes over ordering.
// `p` uses `div` so block KaTeX ($$) does not break React hydration/nesting rules.
const QuizMarkdownComponents: any = {
  p: ({ children }: any) => <div className="leading-relaxed break-words inline-block w-full text-zinc-800 dark:text-zinc-200">{children}</div>,
  strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ inline, children, className }: any) => {
    // If language is math, pass it through so KaTeX handles it instead of code formatting
    if (className && className.includes('language-math')) {
       return <span className={className}>{children}</span>;
    }
    return inline
      ? <code className="font-mono text-[0.85em] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md break-words">{children}</code>
      : <pre className="font-mono text-[0.85em] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-2 rounded-lg overflow-x-auto my-2 whitespace-pre-wrap break-words">{children}</pre>;
  },
  ul: ({ children }: any) => <ul className="list-disc pl-4 space-y-1 my-1.5 text-zinc-800 dark:text-zinc-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 space-y-1 my-1.5 text-zinc-800 dark:text-zinc-300">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-blue-500 pl-3 my-2 text-zinc-600 dark:text-zinc-400 italic">{children}</blockquote>,
};

// ==========================================
// 2. QUIZ WIDGET (STRICTLY NO LOCAL STORAGE FOR STATE)
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
      await saveQuizResult({
        session_id: sessionId || 'local',
        topic: topic || 'General Concept',
        score: score,
        total_questions: quizList.length,
        quiz_data: { questions: quizList, selected: selectedMap }
      });
      
      const storedNotifs = localStorage.getItem('infera_notifications');
      let notifs = storedNotifs ? JSON.parse(storedNotifs) : [];
      const newNotif = {
        id: Date.now().toString(),
        title: 'Assessment Graded!',
        message: `You scored ${score}/${quizList.length} on "${topic}".`,
        time: 'Just now',
        unread: true,
        iconType: 'sparkles',
        bg: 'bg-emerald-100 dark:bg-emerald-500/20',
        link: '/dashboard/chat'
      };
      localStorage.setItem('infera_notifications', JSON.stringify([newNotif, ...notifs]));
      window.dispatchEvent(new Event('storage'));
    } catch(e) {
      console.error("DB Save failed:", e);
    }

    setSubmitted(true);
    setSaving(false);

    const feedbackMsg = `I submitted the assessment and scored ${score} out of ${quizList.length}. Please update my progress and ask me if I am ready to continue.`;
    if (onAnswerSubmitted) onAnswerSubmitted(feedbackMsg, true);
  }

  return (
    <div className="my-6 rounded-[1.5rem] bg-white dark:bg-[#0c0c0e] border border-blue-200/60 dark:border-blue-900/50 shadow-xl shadow-blue-500/5 w-full max-w-full sm:max-w-3xl font-outfit overflow-hidden flex flex-col">
      <div className="bg-zinc-50 dark:bg-[#111113] border-b border-zinc-100 dark:border-zinc-800/80 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-sm shrink-0">
            <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-google-sans text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5 truncate">
              {quizList.length > 1 ? 'Comprehensive Assessment' : 'Knowledge Check'}
            </h3>
            <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[150px] sm:max-w-xs">{topic}</p>
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
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[13px] shrink-0">
                  {qIndex + 1}
                </span>
              )}
              <div className="text-[15px] sm:text-[16px] font-bold text-zinc-900 dark:text-white leading-relaxed pt-0.5 prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 prose-headings:my-0 w-full overflow-x-auto break-words custom-scrollbar">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={QuizMarkdownComponents}>
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
                    stateClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                    badgeClass = "bg-blue-500 text-white shadow-sm"
                  } else {
                    stateClass += " hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
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
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={QuizMarkdownComponents}>
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
              <div className="mt-4 ml-0 sm:ml-10 p-4 sm:p-5 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-[13.5px] sm:text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 flex items-start gap-3 min-w-0">
                <Sparkles size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="prose prose-zinc dark:prose-invert max-w-none w-full overflow-x-auto break-words custom-scrollbar">
                  <span className="font-bold text-zinc-900 dark:text-white mr-2">Explanation:</span>
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false }]]} components={QuizMarkdownComponents}>
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
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14.5px] sm:text-[15px] rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
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
// 2. PROGRESS WIDGET (DB-BACKED)
// ==========================================
export const ProgressWidget = ({ topic, masteryPercentage: aiMastery, completedConcepts: aiConcepts, nextConcept, sessionId }: any) => {
  const [progress, setProgress] = useState<{ mastery_percentage: number; completed_concepts: string[]; current_topic: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      // Fallback: just show AI's data if no sessionId
      setProgress({ mastery_percentage: 0, completed_concepts: [], current_topic: topic || '—' });
      setLoading(false);
      return;
    }

    const syncProgress = async () => {
      setLoading(true);
      try {
        const existing = await getStudyProgress(sessionId);
        const prevMastery = existing?.mastery_percentage ?? 0;
        // Follow AI's mastery progress, fallback to modest increment
        const safeMastery = aiMastery !== undefined ? Math.max(prevMastery, aiMastery) : Math.min(100, prevMastery + 10);
        const newConcepts = aiConcepts?.length ? aiConcepts : existing?.completed_concepts ?? [];
        const saved = await upsertStudyProgress(sessionId, {
          mastery_percentage: safeMastery,
          completed_concepts: newConcepts,
          current_topic: topic || existing?.current_topic || 'Initialization',
        });
        setProgress(saved);
      } catch (e) {
        console.error('Progress sync error:', e);
      } finally {
        setLoading(false);
      }
    };
    syncProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, aiMastery]);

  const displayMastery = progress?.mastery_percentage ?? 0;
  const displayConcepts = progress?.completed_concepts ?? [];
  const displayTopic = progress?.current_topic || topic || '—';
  const percentage = Math.max(0, Math.min(100, displayMastery));

  return (
    <div className="my-6 p-5 sm:p-6 rounded-[1.5rem] bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-blue-200/50 dark:border-blue-900/50 w-full max-w-full sm:max-w-xl font-outfit shadow-xl shadow-blue-500/5 overflow-hidden">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BarChart size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-google-sans text-[10px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-0.5">Live Tracker</h3>
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight truncate w-full">{displayTopic}</p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-20 gap-2 text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Syncing progress...</span>
        </div>
      ) : (
        <>
          <div className="relative flex justify-center items-end w-full max-w-[160px] mx-auto aspect-[2/1] mb-6 sm:mb-8">
            <svg className="w-full h-full drop-shadow-md pb-2" viewBox="0 0 160 80">
              <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-zinc-200 dark:text-zinc-800" />
              <path d="M 10 70 A 70 70 0 0 1 150 70" fill="none" stroke="url(#progress-gradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={Math.PI * 70} strokeDashoffset={(Math.PI * 70) - (percentage / 100) * (Math.PI * 70)} className="transition-all duration-1000 ease-out" />
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" /> 
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end">
              <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 leading-none">
                {percentage}%
              </span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1 -mb-1">Mastery</span>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Mastered Concepts</p>
              <div className="flex flex-wrap gap-2">
                {displayConcepts.length > 0 ? displayConcepts.map((c: string, i: number) => (
                  <span key={i} className="px-2.5 py-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] sm:text-[12px] font-bold rounded-lg border border-blue-500/20 flex items-center gap-1.5 shadow-sm break-words">
                    <CheckCircle2 size={13} className="shrink-0" /> {c}
                  </span>
                )) : (
                  <span className="text-zinc-400 text-[12px] italic">Learning in progress...</span>
                )}
              </div>
            </div>
            
            {nextConcept && (
              <div className="p-3 sm:p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm min-w-0">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Up Next</p>
                <p className="text-[14px] sm:text-[15px] font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-2 break-words w-full">
                  <ArrowRight size={15} className="text-blue-500 shrink-0" /> 
                  <span className="truncate">{nextConcept}</span>
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ==========================================
// 3. UTILITIES & JSON PARSER
// ==========================================
export const extractWidgets = (rawText: string) => {
  return { text: rawText || '', widgets: [], isStreaming: false };
};

// ==========================================
// COPY BUTTON UTILITY
// ==========================================
export const CopyButton = ({ text, className = "" }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className={`p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 ${className}`} title="Copy to clipboard">
      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 font-semibold transition-colors break-words" {...props}>
      {children}
      <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[9px] font-google-sans uppercase font-bold px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">Source</span>
    </a>
  ),

  blockquote: ({ children }: any) => {
    return (
      <div className="w-full mt-3 mb-3 p-3 sm:p-4 bg-blue-50/50 dark:bg-[#111113] border border-blue-200/50 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 shadow-sm min-w-0">
        <Sparkles size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <span className="leading-snug text-[13.5px] sm:text-[14.5px] font-outfit font-semibold text-zinc-700 dark:text-zinc-300 break-words w-full">{children}</span>
      </div>
    )
  },
};

// ==========================================

export const getMarkdownComponents = ({ sessionId = '', onAnswerSubmitted = null, isLast = false, isTyping = false, messageIndex = 0, lastUserMessage = '' }: any = {}) => {
  return {
    ...BaseMarkdownComponents,
    code: ({ node, className, inline, children, ...props }: any) => {
      const rawText = Array.isArray(children) ? children.join('') : String(children);
      const text = rawText.replace(/\n$/, '');
      const match = /language-([a-zA-Z0-9_?\-]+)/.exec(className || '');
      let lang = match ? match[1] : '';

      if (lang === '' && text.trim().startsWith('{') && text.trim().includes('"component"')) {
        lang = 'json';
      }

      if (!inline && (lang === 'json?chameleon' || lang === 'json')) {
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) {
          try {
            const fixedStr = text.replace(/\\(?!["\/bfnrt])/g, '\\\\');
            parsed = JSON.parse(fixedStr);
          } catch (e2) {}
        }

        // If this JSON has a `component` key, it's a widget attempt — gate strictly
        if (parsed && parsed.component) {
          const lastLower = lastUserMessage.toLowerCase();

          // Quiz: ONLY if user explicitly asked for a quiz (broad list matching backend)
          const quizKeywords = [
            'quiz me', 'test me', 'give me a quiz', 'take a quiz', 'knowledge check',
            'test my knowledge', 'i want a quiz', 'start a quiz', 'ready to take',
            'quiz on this', 'quiz on the', "let's do a quiz", "let's take a quiz",
            'take the quiz', 'do a quiz', 'ready for a quiz', 'ready for the quiz',
            'quick quiz', 'assess me', 'assessment', 'test myself'
          ];
          // Also allow auto-quiz: backend injects QuizWidget after 7 messages even without explicit request
          const autoQuizPattern = lastLower === '' || true; // always allow if backend decided to send it
          const userAskedForQuiz = quizKeywords.some(kw => lastLower.includes(kw)) || autoQuizPattern;

          // Progress: ONLY if user explicitly asked to see their progress
          const progressKeywords = ['show my progress', 'my progress', 'track my progress', 'progress tracker', 'how far', 'how much have i learned', 'mastery'];
          const userAskedForProgress = progressKeywords.some(kw => lastLower.includes(kw));

          if (parsed.component === 'QuizWidget') {
            if (!userAskedForQuiz) return null;
            return <QuizWidget {...parsed.props} sessionId={sessionId} onAnswerSubmitted={onAnswerSubmitted} isHistorical={!isLast} />;
          }
          if (parsed.component === 'ProgressWidget') {
            if (!userAskedForProgress) return null;
            return <ProgressWidget {...parsed.props} sessionId={sessionId} />;
          }
          // Silently suppress ALL unknown component types (QuestionWidget, etc.)
          return null;
        }

        if (!parsed && isTyping) {
          return (
            <div className="my-4 p-4 sm:p-5 rounded-xl border border-blue-200/50 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 flex items-center gap-2.5 text-blue-600 dark:text-blue-400 shadow-inner animate-pulse w-full">
              <Loader2 className="animate-spin shrink-0" size={18} />
              <span className="font-google-sans font-bold text-[11px] sm:text-[12px] uppercase tracking-widest break-words">Generating Interactive Module...</span>
            </div>
          );
        }
      }


      if (!inline && lang) {
        if (['javascript', 'js', 'typescript', 'ts', 'python', 'java', 'cpp', 'c', 'rust', 'go', 'php', 'bash'].includes(lang.toLowerCase().replace('?chameleon', ''))) {
          return <RunnableCodeBlock text={text} lang={lang.replace('?chameleon', '')} />;
        }
        return (
          <div className="relative my-4 w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-0">
            <div className="bg-[#111113] px-3 py-2 text-[10px] sm:text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center rounded-t-xl">
              <span className="font-google-sans font-bold tracking-wider uppercase text-zinc-500 truncate mr-2">{lang}</span>
              <div className="flex items-center gap-2"><CopyButton text={text} className="hover:text-blue-400" /></div>
            </div>
            <div className="w-full overflow-x-auto custom-scrollbar bg-[#0c0c0e]">
              <SyntaxHighlighter style={oneDark} language={lang === 'js' ? 'javascript' : lang === 'ts' ? 'typescript' : lang} PreTag="div" customStyle={{ margin: 0, background: 'transparent', padding: '1rem' }} codeTagProps={{ className: "text-[12px] sm:text-[13px] font-mono leading-relaxed text-zinc-200 block min-w-max" }}>
                {text}
              </SyntaxHighlighter>
            </div>
          </div>
        )
      }

      return (
        <code className={`${inline ? 'bg-zinc-100 dark:bg-[#1f1f22] text-zinc-900 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800/50 break-words' : 'block p-3 bg-[#0c0c0e] text-zinc-200 overflow-x-auto rounded-xl custom-scrollbar w-full whitespace-pre'} font-mono text-[0.8em] font-semibold`} {...props}>
          {text}
        </code>
      );
    }
  }
}

// ==========================================
// 5. QUIZ HISTORY MODAL
// ==========================================
const QuizHistoryModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getQuizHistory().then(data => {
        setHistory(data || []);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 font-outfit" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-[#111113]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-sm">
              <Trophy size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-google-sans text-lg font-bold text-zinc-900 dark:text-white leading-tight">Assessment History</h3>
              <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Review your past performance across all topics.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#fafafa] dark:bg-[#050505]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-blue-600">
              <Loader2 className="animate-spin" size={28} />
              <p className="text-sm font-bold font-google-sans uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <History size={32} className="text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No assessments completed yet.<br/>Take a quiz to see your history here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-[#0c0c0e]">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-zinc-50 dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-4 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Topic Evaluated</th>
                    <th className="px-5 py-4 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center">Score</th>
                    <th className="px-5 py-4 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center">Status</th>
                    <th className="px-5 py-4 font-google-sans text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-right">Date Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {history.map((record) => {
                    const percentage = (record.score / record.total_questions) * 100;
                    const passed = percentage >= 60;
                    return (
                      <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                        <td className="px-5 py-4"><p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">{record.topic}</p><p className="text-[12px] text-zinc-500 mt-0.5">{record.total_questions} Questions Total</p></td>
                        <td className="px-5 py-4 text-center"><span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold text-[14px]">{record.score} / {record.total_questions}</span></td>
                        <td className="px-5 py-4 text-center">
                          {passed ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[12px] font-bold"><CheckCircle2 size={14} /> Passed</span>
                                  : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[12px] font-bold"><XCircle size={14} /> Review Needed</span>}
                        </td>
                        <td className="px-5 py-4 text-right text-[13px] font-medium text-zinc-600 dark:text-zinc-400 flex items-center justify-end gap-1.5"><Calendar size={14} className="text-zinc-400" />{new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. SMOOTH TYPEWRITER
// ==========================================
const useTypewriter = (text: string, enabled: boolean, forceStop: boolean, onComplete?: () => void) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text || '');
      setIsTypingState(false);
      return;
    }

    if (forceStop) {
      setDisplayedText(text || '');
      setIsTypingState(false);
      if (onComplete) onComplete();
      return;
    }

    setIsTypingState(true);
    setDisplayedText('');
    let i = 0;
    const fullText = text || '';
    
    // Calculate a dynamic chunk size so it finishes very quickly (max ~0.8s), but still looks smooth
    const chunkSize = Math.max(5, Math.floor(fullText.length / 50)); 

    const interval = setInterval(() => {
      i += chunkSize; 
      if (i >= fullText.length) {
        setDisplayedText(fullText);
        setIsTypingState(false);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        setDisplayedText(fullText.slice(0, i));
      }
    }, 10); 

    return () => clearInterval(interval);
  }, [text, enabled, forceStop]); 

  return { displayedText, isTyping: isTypingState };
};

const TypewriterMessage = ({ content, isNew, forceStop, scrollRef, onComplete, children }: any) => {
  const { displayedText, isTyping } = useTypewriter(content, isNew, forceStop, onComplete);
  
  useEffect(() => {
    if (isTyping && scrollRef?.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [displayedText, isTyping, scrollRef]);

  return <>{children(displayedText, isTyping)}</>;
};

// ==========================================
// 7. MESSAGE ITEM
// ==========================================
const MessageItem = React.memo(({ m, index, isLast, loading, isTypingGlobal, isLocallyTyping, displayedContent, onRegenerate, onEditSubmit, isNewAssistant, sessionId, onAnswerSubmitted, messages }: any) => {
  const isUser = m.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.content || "");

  useEffect(() => { setEditValue(m.content || ""); }, [m.content]);

  const contentToProcess = isNewAssistant && displayedContent !== undefined ? displayedContent : (m.content || "");
  const { text: cleanText, widgets, isStreaming } = useMemo(() => extractWidgets(contentToProcess), [contentToProcess]);
  const showLoader = isStreaming && isNewAssistant && isLocallyTyping;

  // Find the preceding user message — used to detect "quiz me" etc.
  const lastUserMessage = useMemo(() => {
    if (!messages) return '';
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return messages[i].content || '';
    }
    return '';
  }, [messages, index]);

  const memoizedComponents = useMemo(() => {
    return getMarkdownComponents({ sessionId, onAnswerSubmitted, isLast, isTyping: isTypingGlobal, messageIndex: index, lastUserMessage });
  }, [sessionId, onAnswerSubmitted, isLast, isTypingGlobal, index, lastUserMessage]);

  if (isEditing) {
    return (
      <div className="flex flex-col w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%] self-end animate-in fade-in duration-200 mb-2">
        <div className="bg-white dark:bg-[#0c0c0e] border border-blue-500/50 focus-within:border-blue-500 rounded-2xl p-3 sm:p-4 shadow-sm transition-all">
          <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-transparent font-outfit text-[14.5px] sm:text-[15px] text-zinc-900 dark:text-zinc-100 outline-none resize-none custom-scrollbar min-h-[80px]" autoFocus />
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <button onClick={() => { setIsEditing(false); setEditValue(m.content); }} className="px-3 py-1.5 font-google-sans text-[12px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
            <button onClick={() => { setIsEditing(false); onEditSubmit(index, editValue); }} disabled={loading || isTypingGlobal || !editValue.trim()} className="px-3 py-1.5 font-google-sans text-[12px] font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50">Save & Regenerate</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex flex-col gap-1 w-full animate-in fade-in ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
      <div className={`relative max-w-[98%] sm:max-w-[92%] md:max-w-[88%] min-w-0 ${
        isUser
        ? 'bg-zinc-900 dark:bg-zinc-100 px-4 sm:px-5 py-3 sm:py-3.5 rounded-[1.25rem] rounded-tr-md text-white dark:text-zinc-900 shadow-sm border border-zinc-800 dark:border-zinc-200'
        : 'w-full'
      }`}>
        <div className={`prose prose-zinc dark:prose-invert max-w-full break-words w-full font-outfit custom-scrollbar ${isUser ? 'prose-p:leading-relaxed prose-p:my-0 prose-p:text-white dark:prose-p:text-zinc-900' : ''}`}>
          {isUser ? (
            <p className="font-outfit text-[14.5px] sm:text-[15px] m-0 font-medium tracking-wide whitespace-pre-wrap">{m.content}</p>
          ) : (
            <>
              {cleanText && (
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]} components={memoizedComponents}>
                  {cleanText}
                </ReactMarkdown>
              )}

              {isNewAssistant && isLocallyTyping && (
                <span className="inline-block w-[3px] h-4 bg-blue-500 rounded-full animate-pulse ml-1 align-text-bottom" />
              )}
            </>
          )}
        </div>
      </div>

      {!isUser && isLast && !loading && !isTypingGlobal && (
        <div className="flex w-full justify-start mt-2">
           <button onClick={() => onAnswerSubmitted("I understand this concept completely. Please update my progress tracker and immediately begin teaching the next topic in full, comprehensive detail right now.", true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-500 transition-colors rounded-lg shadow-sm font-semibold text-[13px] active:scale-95">
             <CheckCircle2 size={15} /> <span>Mark as Done</span>
           </button>
        </div>
      )}

      <div className={`flex items-center gap-1.5 mt-1.5 ${isUser ? 'mr-1.5 justify-end' : 'ml-1.5 justify-start'}`}>
        <CopyButton text={m.content || ""} />
        {isUser && !loading && !isTypingGlobal && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-2 py-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm" title="Edit prompt">
            <PenLine size={13} /> <span className="text-[11px] font-google-sans font-bold">Edit</span>
          </button>
        )}
        {!isUser && isLast && !loading && !isTypingGlobal && (
          <button onClick={() => onRegenerate(index)} className="flex items-center gap-1 px-2 py-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm" title="Regenerate response">
            <RefreshCw size={13} /> <span className="text-[11px] font-google-sans font-bold">Regenerate</span>
          </button>
        )}
      </div>
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

// ==========================================
// 8. PROMPT BAR
// ==========================================
const ActivePromptBar = ({ onSubmit, onStop, loading, isTyping, setShowHistoryModal, webSearchMode, setWebSearchMode, deepThinkMode, setDeepThinkMode }: any) => {
  const [chatInput, setChatInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && !isTyping && chatInput.trim()) {
        onSubmit(chatInput);
        setChatInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pointer-events-auto">
      <div className="bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-2xl border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden flex flex-col">
        <div className="flex items-end gap-3 px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up or request your progress tracker..."
            className="flex-1 bg-transparent font-outfit text-[14.5px] sm:text-[15px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[44px] max-h-[180px] resize-none custom-scrollbar leading-relaxed pt-1 pl-1"
            disabled={loading || isTyping}
            rows={1}
          />
          <button
            onClick={() => {
              if (loading || isTyping) onStop();
              else if (chatInput.trim()) {
                onSubmit(chatInput);
                setChatInput('');
                if (textareaRef.current) textareaRef.current.style.height = 'auto';
              }
            }}
            disabled={!loading && !isTyping && !chatInput.trim()}
            className={`h-9 w-9 sm:h-10 sm:w-10 mb-1 shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${
              loading || isTyping ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-95 shadow-none' : !chatInput.trim() ? 'bg-zinc-100 dark:bg-[#111113] border border-transparent dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_4px_14px_rgba(37,99,235,0.3)]'
            }`}
          >
            {loading || isTyping ? <Square size={14} className="fill-current" /> : <Send size={16} className="-translate-x-px translate-y-px" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-transparent overflow-x-auto scrollbar-hide">
          <button type="button" onClick={() => setWebSearchMode(!webSearchMode)} disabled={loading || isTyping} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-google-sans text-[11px] font-bold transition-all shrink-0 disabled:opacity-50 ${webSearchMode ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 text-blue-600 dark:text-blue-400' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'}`}>
            <SearchIcon size={13} className={webSearchMode ? '' : 'opacity-70'} /> Web Search
          </button>
          <button type="button" onClick={() => setDeepThinkMode(!deepThinkMode)} disabled={loading || isTyping} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-google-sans text-[11px] font-bold transition-all shrink-0 disabled:opacity-50 ${deepThinkMode ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400' : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'}`}>
            <BrainCircuit size={13} className={deepThinkMode ? '' : 'opacity-70'} /> Deep Think
          </button>
          
          <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-700 mx-1 hidden sm:block"></div>
          
          <button type="button" onClick={() => { if (!loading && !isTyping) { onSubmit("I'm ready to take a quick quiz on this concept."); } }} disabled={loading || isTyping} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-google-sans text-[11px] font-bold transition-all shrink-0 text-zinc-500 dark:text-zinc-400 disabled:opacity-50">
            <CheckSquare size={13} className="text-pink-500" /> Take Quiz
          </button>
          <button type="button" onClick={() => { if (!loading && !isTyping) { onSubmit("Please show my current progress tracker and tell me what we should cover next."); } }} disabled={loading || isTyping} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-google-sans text-[11px] font-bold transition-all shrink-0 text-zinc-500 dark:text-zinc-400 disabled:opacity-50">
            <Target size={13} className="text-blue-500" /> Track Progress
          </button>
          <button type="button" onClick={() => setShowHistoryModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-google-sans text-[11px] font-bold transition-all shrink-0 text-zinc-500 dark:text-zinc-400">
            <BarChart size={13} className="text-blue-500" /> Quiz History
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 9. INIT FORM
// ==========================================
const SUGGESTIONS = [
  { subject: 'Linear Algebra', level: 'Undergrad', q: 'Explain Eigenvalues intuitively.' },
  { subject: 'Calculus', level: 'High School', q: 'How does the Chain Rule work?' },
  { subject: 'Data Structures', level: 'Year 2', q: 'Time complexity of a Hash Map?' },
]

const InitForm = ({ onSubmit, loading }: { onSubmit: (e: any) => void, loading: boolean }) => {
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('')
  const [question, setQuestion] = useState('')

  const handleSuggestion = (s: typeof SUGGESTIONS[0]) => {
    setSubject(s.subject)
    setLevel(s.level)
    setQuestion(s.q)
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-700 px-3 sm:px-5">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-8 md:mb-10 w-full text-center sm:text-left">
        <Image src="/logo.png" width={200} height={50} alt="InfraCore Logo" className="w-[130px] sm:w-[150px] md:w-[180px] h-auto dark:invert object-contain opacity-95 transition-all duration-500 shrink-0" priority />
        <div className="hidden sm:block h-6 md:h-8 w-[1.5px] bg-zinc-200 dark:bg-zinc-800 rounded-full shrink-0" />
        <span className="font-google-sans text-[16px] sm:text-[18px] md:text-[20px] font-bold text-blue-600 tracking-tight whitespace-nowrap pt-1">Neural Study</span>
      </div>

      <div className="w-full text-left bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 rounded-2xl shadow-xl dark:shadow-none p-5 sm:p-7 md:p-8 transition-all duration-300">
        <form onSubmit={onSubmit} className="flex flex-col gap-4 md:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
            <div className="space-y-1.5">
              <label className="font-google-sans text-[10px] md:text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.15em] pl-1">Subject</label>
              <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. Physics" className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3.5 py-3 rounded-xl text-[13.5px] font-medium outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <label className="font-google-sans text-[10px] md:text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.15em] pl-1">Academic Level</label>
              <input name="level" value={level} onChange={(e) => setLevel(e.target.value)} required placeholder="e.g. Graduate" className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3.5 py-3 rounded-xl text-[13.5px] font-medium outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" disabled={loading} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-google-sans text-[10px] md:text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-[0.15em] pl-1">Your Primary Inquiry</label>
            <textarea name="question" value={question} onChange={(e) => setQuestion(e.target.value)} required placeholder="Describe the concept or problem you'd like to master..." className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-4 py-3.5 rounded-[1.25rem] text-[14px] md:text-[14.5px] font-medium outline-none transition-all text-zinc-900 dark:text-zinc-100 min-h-[90px] md:min-h-[100px] max-h-[160px] resize-none leading-relaxed custom-scrollbar" disabled={loading} />
          </div>
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 pt-4 md:pt-5 border-t border-zinc-100 dark:border-zinc-800/60 mt-1 md:mt-2">
            <div className="flex flex-wrap gap-2 justify-start w-full xl:w-auto">
              {SUGGESTIONS.map((s, idx) => (
                <button key={idx} type="button" onClick={() => handleSuggestion(s)} disabled={loading} className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full font-google-sans text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm">{s.subject}</button>
              ))}
            </div>
            <button type="submit" disabled={loading} className="w-full xl:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-google-sans text-[13px] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 group shrink-0">
              {loading ? <><Loader2 className="animate-spin" size={16} /><span>Initializing...</span></> : <><GraduationCap size={18} /><span>Start Learning</span><ArrowRight size={16} className="hidden md:block group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// 10. SIDEBAR
// ==========================================
const HistorySidebar = React.memo(({ sessions, sessionId, filter, setFilter, loadSession, setEditingId, editingId, editTitle, setEditTitle, saveRename, handleDelete, createNewSession }: any) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filteredSessions = (sessions || []).filter((s:any) => s.title.toLowerCase().includes(filter.toLowerCase()));

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSessions.map((s: any) => s.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    for (let id of Array.from(selectedIds)) {
      await handleDelete({ stopPropagation: () => {} } as any, id);
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#050505] relative overflow-hidden border-r border-zinc-200 dark:border-zinc-800/80">
      <div className="p-5 pb-2 space-y-5 relative z-10">
        <button onClick={() => { createNewSession(); setIsSelectMode(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[13px] shadow-sm transition-all active:scale-[0.98] group"><Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /><span className="font-google-sans">New Session</span></button>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-google-sans text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">History</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }} className={`font-google-sans text-[10px] font-bold uppercase tracking-wider transition-colors ${isSelectMode ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>{isSelectMode ? 'Cancel' : 'Manage'}</button>
            </div>
          </div>
          
          {isSelectMode ? (
            <div className="flex items-center justify-between px-1 animate-in fade-in zoom-in-95 duration-200 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button onClick={handleSelectAll} className="font-google-sans text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                {selectedIds.size === filteredSessions.length && filteredSessions.length > 0 ? <CheckSquare size={14} className="text-blue-600" /> : <SquareIcon size={14} />} 
                {selectedIds.size === filteredSessions.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Delete ({selectedIds.size})
              </button>
            </div>
          ) : (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input placeholder="Search history..." className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-lg font-outfit text-[12px] font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto px-3 mt-3 space-y-1 custom-scrollbar pb-6`}>
        {filteredSessions.map((s:any) => (
          <div key={s.id} onClick={() => { if(isSelectMode) { toggleSelect(s.id, { stopPropagation: ()=>{} } as any) } else { loadSession(s.id) } }} className={`group relative p-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2.5 ${sessionId === s.id && !isSelectMode ? 'bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-700 shadow-sm' : isSelectMode && selectedIds.has(s.id) ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30' : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-[#0c0c0e]'}`}>
            {isSelectMode && (
              <button onClick={(e) => toggleSelect(s.id, e)} className="shrink-0 text-zinc-400 dark:text-zinc-600 transition-colors">
                {selectedIds.has(s.id) ? <CheckSquare size={16} className="text-blue-600" /> : <SquareIcon size={16} />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              {editingId === s.id && !isSelectMode ? (
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <input autoFocus value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="bg-transparent font-outfit text-[13px] font-bold outline-none w-full border-b border-blue-500 text-zinc-900 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && saveRename(e as any, s.id)} />
                  <button onClick={(e)=>saveRename(e, s.id)} className="p-0.5 text-emerald-500 hover:scale-110 transition-transform"><Check size={16} /></button>
                </div>
              ) : (
                <div className={`w-full text-left font-outfit text-[13px] truncate transition-colors ${sessionId === s.id && !isSelectMode ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}>{s.title}</div>
              )}
            </div>
            {!isSelectMode && editingId !== s.id && (
              <div className="flex gap-0.5 opacity-100 transition-opacity sm:opacity-60 sm:group-hover:opacity-100">
                <button onClick={(e)=>{ e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }} className="p-1 text-zinc-400 hover:text-blue-500 transition-colors" title="Rename"><Edit3 size={13} /></button>
                <button onClick={(e)=>handleDelete(e, s.id)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
HistorySidebar.displayName = 'HistorySidebar';

// ==========================================
// 11. MAIN PAGE
// ==========================================
export default function StudyChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const requestRef = useRef(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastAssistantIndex, setLastAssistantIndex] = useState<number>(-1);

  const [webSearchMode, setWebSearchMode] = useState(false);
  const [deepThinkMode, setDeepThinkMode] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loading, isTyping]);

  useEffect(() => {
    getStudySessions().then((fetchedSessions) => {
      setSessions(fetchedSessions);
      if (fetchedSessions.length > 0 && !sessionId) {
        loadSession(fetchedSessions[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSession = async (id: string) => {
    setLoading(true); setSessionId(id); setLastAssistantIndex(-1);
    setMessages(await getStudyMessages(id));
    setLoading(false);
    setMobileMenuOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteStudySession(id);
    if (sessionId === id) { setMessages([]); setSessionId(null); }
    getStudySessions().then(setSessions);
  };

  const saveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await renameStudySession(id, editTitle);
    setEditingId(null);
    getStudySessions().then(setSessions);
  };

  const handleStop = () => {
    setForceStop(true); 
    setLoading(false); 
    setIsTyping(false);
  };

  const handleInitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const level = formData.get('level') as string;
    const question = formData.get('question') as string;

    const userMessage = `Topic: ${subject} (${level})\nQuestion: ${question}\n\nPlease start teaching me step-by-step using the Socratic method.`;
    setMessages([{ role: 'user', content: userMessage }]);

    try {
      const res = await sendStudyMessage(null, userMessage, { subject, level }, undefined, { webSearch: webSearchMode, deepThink: deepThinkMode });
      setSessionId(res.sessionId);
      getStudySessions().then(setSessions);

      setMessages([{ role: 'user', content: userMessage }, { role: 'assistant', content: res.content }]);
      setLastAssistantIndex(1);
      setIsTyping(true);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `**System Error:** API Token Limit Exceeded or Connection Failed.\n\nPlease start a new session to continue.` }
      ]);
      setLastAssistantIndex(1);
    } finally { setLoading(false); }
  };

  const handleChatSubmit = async (text: string, force = false) => {
    if (!force && (loading || isTyping)) return;
    if (force) {
      setForceStop(true);
      setIsTyping(false);
    }

    const reqId = ++requestRef.current;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await sendStudyMessage(sessionId, text, undefined, undefined, { webSearch: webSearchMode, deepThink: deepThinkMode });
      if (requestRef.current !== reqId) return;

      setMessages(prev => {
        const newMsgs = [...prev, { role: 'assistant', content: res.content }];
        setLastAssistantIndex(newMsgs.length - 1);
        return newMsgs;
      });
      setIsTyping(true);
    } catch (err: any) {
      console.error(err);
      if (requestRef.current === reqId) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `**System Error:** API Token Limit Exceeded or Connection Failed.\n\nPlease start a new session to continue.` }
        ]);
        setIsTyping(false);
      }
    } finally { if (requestRef.current === reqId) setLoading(false); }
  };

  const handleEditSubmit = async (index: number, newText: string) => {
    const reqId = ++requestRef.current;
    setForceStop(false);
    const truncatedMessages = messages.slice(0, index);
    setMessages([...truncatedMessages, { role: 'user', content: newText }]);
    setLoading(true);

    try {
      const res = await sendStudyMessage(sessionId, newText, undefined, index, { webSearch: webSearchMode, deepThink: deepThinkMode });
      if (requestRef.current !== reqId) return;
      setMessages([...truncatedMessages, { role: 'user', content: newText }, { role: 'assistant', content: res.content }]);
      setLastAssistantIndex(truncatedMessages.length + 1);
      setIsTyping(true);
    } catch (err) { console.error(err); }
    finally { if (requestRef.current === reqId) setLoading(false); }
  };

  const handleRegenerate = async (index: number) => {
    let userMsgIndex = -1;
    let lastUserMsg = "";
    for (let i = index; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i].content;
        userMsgIndex = i;
        break;
      }
    }
    if (userMsgIndex !== -1) {
      handleEditSubmit(userMsgIndex, lastUserMsg);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('[https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap](https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap)');

        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }

        .prose {
          max-width: 100% !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: anywhere !important;
        }
        .prose p, .prose ul, .prose ol, .prose li, .prose h1, .prose h2, .prose h3 {
          max-width: 100% !important;
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: anywhere !important;
        }
        .prose table {
          display: block !important;
          overflow-x: auto !important;
          max-width: 100% !important;
        }
        
        .prose a {
          color: #3b82f6 !important; 
          text-decoration: underline !important;
          text-underline-offset: 3px !important;
          font-weight: 600 !important;
          transition: all 0.2s ease;
        }
        .prose a:hover {
          color: #2563eb !important;
        }

        .katex-display {
          overflow-x: auto !important;
          overflow-y: hidden !important;
          padding-bottom: 0.5rem !important;
          scrollbar-width: thin !important;
          max-width: 100% !important;
          display: block !important;
        }
        .katex {
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: anywhere !important;
          max-width: 100% !important;
          display: inline-block !important;
        }
        .katex-display::-webkit-scrollbar {
          height: 6px;
        }
        .katex-display::-webkit-scrollbar-track {
          background: transparent;
        }
        .katex-display::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}} />

      <QuizHistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} />

      <div className="fixed inset-0 top-[60px] sm:top-[72px] flex w-full overflow-hidden bg-[#fafafa] dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20">

        <aside className="hidden md:flex flex-col w-72 z-10 shrink-0">
          <HistorySidebar
            sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter}
            loadSession={loadSession} setEditingId={setEditingId} editingId={editingId}
            editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename}
            handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setLastAssistantIndex(-1);}}
          />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[260px] bg-[#fafafa] dark:bg-[#050505] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 flex justify-between items-center px-5 shrink-0 bg-white/50 dark:bg-[#0c0c0e]/50">
                <div className="flex items-center gap-2">
                  <Image src="/logo.png" width={80} height={20} alt="Logo" className="h-4 w-auto dark:invert" />
                  <span className="font-google-sans font-bold text-[13px] tracking-wide text-zinc-900 dark:text-white mt-0.5">Neural Study</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 -mr-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-[#111113] rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <HistorySidebar sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter} loadSession={loadSession} setEditingId={setEditingId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename} handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setMobileMenuOpen(false); setLastAssistantIndex(-1);}} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-[#fafafa] dark:bg-[#050505]">

          <header className="md:hidden h-[60px] shrink-0 flex items-center justify-between px-4 z-30 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 absolute top-0 w-full">
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#111113] rounded-xl transition-colors" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2.5">
                 <Image src="/logo.png" width={100} height={24} alt="Infere Core Logo" className="h-5 w-auto dark:invert" />
                 <span className="font-google-sans text-[15px] font-bold text-zinc-900 dark:text-white mt-0.5">Neural Study</span>
              </div>
            </div>
          </header>

          {!messages.length ? (
            <div className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-8 custom-scrollbar pt-20 md:pt-8">
              <div className="m-auto w-full pt-4 pb-8">
                <InitForm onSubmit={handleInitSubmit} loading={loading} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto overflow-x-hidden w-full p-3 sm:p-5 md:p-8 pt-20 md:pt-6 scroll-smooth custom-scrollbar" ref={scrollRef}>
                <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
                  {messages.map((m, i) => {
                    const isNewAssistant = m.role === 'assistant' && i === lastAssistantIndex;
                    if (isNewAssistant) {
                      return (
                        <TypewriterMessage key={`tw-${i}`} content={m.content} isNew={true} forceStop={forceStop} onComplete={() => setIsTyping(false)} scrollRef={scrollRef}>
                          {(displayed: any, isLocalTyping: boolean) => (
                            <MessageItem m={m} index={i} isLast={i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} isNewAssistant={true} forceStop={forceStop} onTypingComplete={() => setIsTyping(false)} displayedContent={displayed} isLocallyTyping={isLocalTyping} sessionId={sessionId} onAnswerSubmitted={handleChatSubmit} messages={messages} />
                          )}
                        </TypewriterMessage>
                      );
                    }
                    return <MessageItem key={`msg-${i}`} m={m} index={i} isLast={m.role === 'assistant' && i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} isNewAssistant={false} sessionId={sessionId} onAnswerSubmitted={handleChatSubmit} messages={messages} />;
                  })}

                  {loading && !isTyping && (
                    <div className="flex w-full items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2.5 text-zinc-500 bg-white dark:bg-[#0c0c0e] px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit">
                        <Loader2 className="animate-spin text-blue-500" size={16} />
                        <span className="font-google-sans text-[12px] font-bold text-zinc-700 dark:text-zinc-300">Processing...</span>
                      </div>
                    </div>
                  )}

                  <div className="h-[180px] sm:h-[220px]" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 pointer-events-none pb-4 sm:pb-6 z-20 px-3 sm:px-6">
            <ActivePromptBar 
              onSubmit={(text: string) => handleChatSubmit(text)} 
              onStop={handleStop} 
              loading={loading} 
              isTyping={isTyping}
              setShowHistoryModal={setShowHistoryModal}
              webSearchMode={webSearchMode}
              setWebSearchMode={setWebSearchMode}
              deepThinkMode={deepThinkMode}
              setDeepThinkMode={setDeepThinkMode}
            />
          </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}