'use client'

import React, { useState, useEffect, memo, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { BookOpen, CheckCircle2, X, Lightbulb, Loader2, Info } from 'lucide-react'
import { formatQuizText } from '@/app/dashboard/chat/study/utils'
import { syncQuizState, getQuizState } from '@/app/actions/study'

// 🚀 1. PLUGINS OUTSIDE COMPONENT (Prevents endless re-parsing)
const memoizedRemarkPlugins = [remarkMath, remarkGfm];
const memoizedRehypePlugins = [[rehypeKatex, { strict: false, throwOnError: false }]] as any;

// 🚀 2. STRICT ENTERPRISE MARKDOWN RENDERING
const QuizMarkdownComponents: any = {
  p: ({ children }: any) => <div className="leading-relaxed break-words w-full min-w-0 text-zinc-900 dark:text-zinc-100 font-medium whitespace-pre-wrap">{children}</div>,
  strong: ({ children }: any) => <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ inline, children, className }: any) => {
    if (className && className.includes('language-math')) return <span className={className}>{children}</span>;
    return inline
      ? <code className="font-mono text-[13px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md break-words">{children}</code>
      : <pre className="font-mono text-[13px] bg-[#0d0d0d] text-zinc-300 px-4 py-3 rounded-lg overflow-x-auto max-w-full my-3 flex-1 min-w-0 border border-zinc-800 shadow-sm custom-scrollbar">{children}</pre>;
  },
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-zinc-800 dark:text-zinc-200 w-full min-w-0 break-words">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-zinc-800 dark:text-zinc-200 w-full min-w-0 break-words">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed break-words min-w-0">{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="border-l-[3px] border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 px-4 py-2 my-3 rounded-r-lg text-zinc-700 dark:text-zinc-300 italic break-words w-full min-w-0">{children}</blockquote>,
};

// 🚀 3. HIGH-PERFORMANCE MEMOIZED MARKDOWN RENDERER
const SafeMarkdown = memo(({ content }: { content: string }) => {
  const formatted = useMemo(() => formatQuizText(content), [content]);
  return (
    <ReactMarkdown 
      remarkPlugins={memoizedRemarkPlugins} 
      rehypePlugins={memoizedRehypePlugins} 
      components={QuizMarkdownComponents}
    >
      {formatted}
    </ReactMarkdown>
  );
});
SafeMarkdown.displayName = 'SafeMarkdown';

// 🚀 4. HIGH-PERFORMANCE MEMOIZED OPTION BUTTON
const QuizOption = memo(({ opt, index, isSelected, isCorrect, submitted, onSelect }: any) => {
  let stateClass = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] text-zinc-700 dark:text-zinc-300";
  let badgeClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700";
  
  if (submitted) {
    if (isCorrect) {
      stateClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500";
      badgeClass = "bg-emerald-500 text-white border-emerald-500 shadow-sm";
    } else if (isSelected) {
      stateClass = "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100";
      badgeClass = "bg-red-500 text-white border-red-500 shadow-sm";
    } else {
      stateClass = "border-zinc-200 dark:border-zinc-800 opacity-60 cursor-default";
    }
  } else {
    if (isSelected) {
      stateClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500";
      badgeClass = "bg-blue-600 text-white border-blue-600 shadow-sm";
    } else {
      stateClass += " hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-[#111113] cursor-pointer";
    }
  }

  return (
    <button
      type="button"
      disabled={submitted}
      onClick={onSelect}
      className={`w-full text-left p-3 sm:p-3.5 rounded-lg border transition-all duration-150 flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 ${stateClass}`}
    >
      <div className={`w-6 h-6 rounded flex items-center justify-center font-semibold text-[12px] shrink-0 transition-colors mt-0.5 sm:mt-0 ${badgeClass}`}>
        {String.fromCharCode(65 + index)}
      </div>
      <div className="flex-1 min-w-0 text-[13px] sm:text-[14px] leading-snug prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 break-words overflow-x-auto custom-scrollbar [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
        <SafeMarkdown content={opt} />
      </div>
      {submitted && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1 sm:mt-0" />}
      {submitted && isSelected && !isCorrect && <X size={16} className="text-red-500 shrink-0 mt-1 sm:mt-0" />}
    </button>
  );
});
QuizOption.displayName = 'QuizOption';


// 🚀 5. MAIN COMPONENT
export const QuizWidget = ({ topic, questions, question, options, correctIndex, explanation, onAnswerSubmitted, sessionId, isHistorical }: any) => {
  // Memoize the list so it never loses reference
  const quizList = useMemo(() => questions || [{ question, options, correctIndex, explanation }], [questions, question, options, correctIndex, explanation]);

  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from Database on mount
  useEffect(() => {
    async function loadState() {
      if (sessionId && topic) {
        const dbState = await getQuizState(sessionId, topic);
        if (dbState) {
          setSelectedMap(dbState.selected_answers || {});
          setSubmitted(dbState.is_submitted || false);
        }
      }
      setIsLoaded(true);
    }
    loadState();
  }, [sessionId, topic]);

  const isAllAnswered = Object.keys(selectedMap).length === quizList.length;

  // Handle Option Selection & Background Sync
  const handleSelectOption = useCallback((qIndex: number, optIndex: number) => {
    if (submitted) return;
    setSelectedMap(prev => {
      const newMap = { ...prev, [qIndex]: optIndex };
      // Background sync (Fire and forget)
      if (sessionId) {
        syncQuizState(sessionId, topic, quizList, newMap, false).catch(console.error);
      }
      return newMap;
    });
  }, [submitted, sessionId, topic, quizList]);

  // Final Submission
  const handleSubmit = async () => {
    if (!isAllAnswered || submitted || isHistorical) return;
    setSaving(true);
    
    let score = 0;
    quizList.forEach((q: any, i: number) => {
      if (selectedMap[i] === q.correctIndex) score++;
    });

    try {
      await syncQuizState(sessionId || 'local', topic || 'General Concept', quizList, selectedMap, true, score);
      setSubmitted(true);
      
      const feedbackMsg = `I submitted the assessment and scored ${score} out of ${quizList.length}. Let's continue.`;
      if (onAnswerSubmitted) onAnswerSubmitted(feedbackMsg, true);
    } catch(e) {
      console.error("DB Save failed:", e);
    }
    
    setSaving(false);
  }

  if (!isLoaded) {
    return <div className="my-6 rounded-xl bg-zinc-100 dark:bg-[#111113] animate-pulse h-64 w-full max-w-3xl mx-auto border border-zinc-200 dark:border-zinc-800"></div>;
  }

  return (
    <div className="my-6 rounded-xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 shadow-sm w-full max-w-3xl mx-auto font-inter overflow-hidden flex flex-col min-w-0">
      
      {/* HEADER */}
      <div className="bg-zinc-50 dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-0.5 truncate w-full">
              {quizList.length > 1 ? 'Practice Assessment' : 'Knowledge Check'}
            </h3>
            <p className="text-[14px] font-semibold text-zinc-900 dark:text-white truncate w-full">{topic}</p>
          </div>
        </div>
        {submitted && (
          <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider rounded flex items-center gap-1.5 shrink-0 ml-3">
            <CheckCircle2 size={13} className="text-zinc-500" /> <span className="hidden sm:inline">Completed</span>
          </div>
        )}
      </div>
      
      {/* BODY */}
      <div className="p-4 sm:p-6 space-y-8 sm:space-y-10 min-w-0 w-full overflow-x-hidden">
        {quizList.map((q: any, qIndex: number) => (
          <div key={qIndex} className="min-w-0 w-full flex flex-col">
            
            {/* Question Text */}
            <div className="flex gap-3 mb-4 min-w-0 w-full items-start">
              {quizList.length > 1 && (
                <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[12px] shrink-0 mt-0.5">
                  {qIndex + 1}
                </span>
              )}
              <div className="flex-1 min-w-0 text-[14px] sm:text-[15px] text-zinc-900 dark:text-zinc-100 leading-relaxed prose prose-zinc dark:prose-invert max-w-none break-words overflow-x-auto custom-scrollbar [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 pb-1">
                <SafeMarkdown content={q.question} />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 sm:pl-9 min-w-0 w-full">
              {q.options.map((opt: string, i: number) => (
                <QuizOption 
                  key={i}
                  opt={opt}
                  index={i}
                  isSelected={selectedMap[qIndex] === i}
                  isCorrect={i === q.correctIndex}
                  submitted={submitted}
                  onSelect={() => handleSelectOption(qIndex, i)}
                />
              ))}
            </div>

            {/* Explanation Box */}
            {submitted && (
              <div className="mt-4 sm:pl-9 min-w-0 w-full animate-in fade-in duration-300">
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 text-[13px] sm:text-[14px] leading-relaxed flex items-start gap-3 min-w-0 w-full overflow-hidden shadow-sm">
                  <Lightbulb size={16} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 prose prose-zinc dark:prose-invert max-w-none break-words overflow-x-auto custom-scrollbar [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
                    <span className="font-semibold text-zinc-900 dark:text-white mr-2 block mb-1.5">Explanation</span>
                    <SafeMarkdown content={q.explanation} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Submit Footer */}
        {!submitted && !isHistorical && (
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 mt-6 flex flex-col items-center min-w-0 w-full">
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={!isAllAnswered || saving}
              className="w-full sm:w-auto min-w-[200px] h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-sm border border-blue-700 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : 'Submit Assessment'}
            </button>
            {!isAllAnswered && (
              <p className="text-center text-zinc-500 text-[12px] font-medium mt-3 flex items-center justify-center gap-1.5 break-words px-4">
                <Info size={14} className="text-zinc-400 shrink-0" />
                <span>Answer all {quizList.length} questions to submit</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}