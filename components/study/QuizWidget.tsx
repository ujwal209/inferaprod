'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { BookOpen, CheckCircle2, X, Lightbulb, Loader2, Info } from 'lucide-react'
import { formatQuizText } from '@/app/dashboard/chat/study/utils'
import { syncQuizState, getQuizState } from '@/app/actions/study'

const QuizMarkdownComponents: any = {
  p: ({ children }: any) => <div className="leading-relaxed break-words w-full text-zinc-800 dark:text-zinc-200 font-medium whitespace-pre-wrap">{children}</div>,
  strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  code: ({ inline, children, className }: any) => {
    if (className && className.includes('language-math')) return <span className={className}>{children}</span>;
    return inline
      ? <code className="font-mono text-[0.85em] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md break-words">{children}</code>
      : <pre className="font-mono text-[0.85em] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-3 rounded-lg overflow-x-auto max-w-full my-2 flex-1 min-w-0">{children}</pre>;
  },
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 my-2 text-zinc-800 dark:text-zinc-300 w-full break-words">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 my-2 text-zinc-800 dark:text-zinc-300 w-full break-words">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed break-words">{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-blue-500 pl-3 my-2 text-zinc-600 dark:text-zinc-400 italic break-words">{children}</blockquote>,
};

export const QuizWidget = ({ topic, questions, question, options, correctIndex, explanation, onAnswerSubmitted, sessionId, isHistorical }: any) => {
  const quizList = questions || [{ question, options, correctIndex, explanation }];

  const [selectedMap, setSelectedMap] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🚀 Load state from Database on mount
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

  // 🚀 Handle Option Selection & Background Sync
  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const newMap = { ...selectedMap, [qIndex]: optIndex };
    setSelectedMap(newMap);
    
    // Background sync (Fire and forget)
    if (sessionId) {
      syncQuizState(sessionId, topic, quizList, newMap, false).catch(console.error);
    }
  };

  // 🚀 Final Submission
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
    return <div className="my-6 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse h-64 w-full max-w-3xl mx-auto border border-zinc-200 dark:border-zinc-800"></div>;
  }

  return (
    <div className="my-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 shadow-sm w-full max-w-3xl mx-auto font-outfit overflow-hidden flex flex-col">
      <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <BookOpen size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5 truncate">
              {quizList.length > 1 ? 'Practice Assessment' : 'Knowledge Check'}
            </h3>
            <p className="text-[13px] sm:text-sm font-semibold text-zinc-900 dark:text-white truncate w-full">{topic}</p>
          </div>
        </div>
        {submitted && (
          <div className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1.5 shrink-0 ml-3">
            <CheckCircle2 size={14} className="text-zinc-500" /> <span className="hidden sm:inline">Completed</span>
          </div>
        )}
      </div>
      
      <div className="p-4 sm:p-6 space-y-8 sm:space-y-10 min-w-0 w-full overflow-x-hidden">
        {quizList.map((q: any, qIndex: number) => (
          <div key={qIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-0 w-full flex flex-col" style={{ animationDelay: `${qIndex * 100}ms` }}>
            <div className="flex gap-3 mb-5 min-w-0 w-full">
              {quizList.length > 1 && (
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-[12px] sm:text-[13px] shrink-0 mt-0.5">
                  {qIndex + 1}
                </span>
              )}
              <div className="flex-1 min-w-0 text-[15px] sm:text-base font-bold text-zinc-900 dark:text-white leading-relaxed prose prose-zinc dark:prose-invert max-w-none overflow-x-auto break-words custom-scrollbar pb-1 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]} components={QuizMarkdownComponents}>
                  {formatQuizText(q.question)}
                </ReactMarkdown>
              </div>
            </div>

            <div className="space-y-2.5 sm:pl-10 min-w-0 w-full">
              {q.options.map((opt: string, i: number) => {
                let stateClass = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] text-zinc-700 dark:text-zinc-300"
                let badgeClass = "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-transparent"
                
                if (submitted) {
                  if (i === q.correctIndex) {
                    stateClass = "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-900 dark:text-green-100"
                    badgeClass = "bg-green-500 text-white border-green-500 shadow-sm"
                  } else if (i === selectedMap[qIndex]) {
                    stateClass = "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100"
                    badgeClass = "bg-red-500 text-white border-red-500 shadow-sm"
                  } else {
                    stateClass = "border-zinc-200 dark:border-zinc-800 opacity-50 cursor-default"
                  }
                } else {
                  if (selectedMap[qIndex] === i) {
                    stateClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/10 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500"
                    badgeClass = "bg-blue-600 text-white border-blue-600 shadow-sm"
                  } else {
                    stateClass += " hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={submitted}
                    onClick={() => handleSelectOption(qIndex, i)}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 flex items-start sm:items-center gap-3 sm:gap-4 ${stateClass} min-w-0`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[12px] sm:text-[13px] shrink-0 transition-colors mt-0.5 sm:mt-0 ${badgeClass}`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1 min-w-0 text-[13.5px] sm:text-[14.5px] leading-snug prose prose-zinc dark:prose-invert max-w-none prose-p:my-0 break-words overflow-x-auto custom-scrollbar [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]} components={QuizMarkdownComponents}>
                        {formatQuizText(opt)}
                      </ReactMarkdown>
                    </div>
                    {submitted && i === q.correctIndex && <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-1 sm:mt-0" />}
                    {submitted && i === selectedMap[qIndex] && i !== q.correctIndex && <X size={18} className="text-red-500 shrink-0 mt-1 sm:mt-0" />}
                  </button>
                )
              })}
            </div>

            {submitted && (
              <div className="mt-4 sm:pl-10 min-w-0 w-full">
                <div className="p-4 sm:p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[13.5px] sm:text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-3 min-w-0 w-full overflow-hidden">
                  <Lightbulb size={18} className="text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 prose prose-zinc dark:prose-invert max-w-none break-words overflow-x-auto custom-scrollbar [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
                    <span className="font-bold text-zinc-900 dark:text-white mr-2 block mb-1">Explanation</span>
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]} components={QuizMarkdownComponents}>
                      {formatQuizText(q.explanation)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {!submitted && !isHistorical && (
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/80 mt-6 flex flex-col items-center min-w-0 w-full">
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={!isAllAnswered || saving}
              className="w-full sm:w-auto min-w-[200px] h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14.5px] sm:text-[15px] rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : 'Submit Assessment'}
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