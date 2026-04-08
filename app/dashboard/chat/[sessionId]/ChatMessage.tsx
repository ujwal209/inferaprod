'use client'

import React, { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toast } from 'sonner'
import { 
  Copy, PenLine, CheckCircle2, Globe, ExternalLink, 
  ThumbsUp, ThumbsDown, RefreshCw, FileText
} from 'lucide-react'
import { preprocessMath } from './chat-utils'

const CodeCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true); toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-400 hover:text-white transition-all rounded-md hover:bg-zinc-700/50 shrink-0">
      {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
      <span className={`text-[10px] font-bold tracking-wide uppercase font-inter ${copied ? 'text-emerald-400' : ''}`}>
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
};

// 🚀 SLEEK BADGE-STYLE SOURCES (Horizontally Scrollable, Original Colors)
const SourceBadges = ({ sources }: { sources: any[] }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-4 w-full min-w-0 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 px-1">
        <Globe size={12} className="text-blue-500 shrink-0" />
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em] font-inter">Sources</span>
      </div>
      
      <div className="flex flex-nowrap gap-2 w-full overflow-x-auto custom-scrollbar pb-2 snap-x touch-pan-x">
        {sources.map((s, i) => (
          <a 
            key={i} 
            href={s.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md shrink-0 snap-start group max-w-[200px] sm:max-w-[240px]"
          >
            <img 
              src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`} 
              className="w-4 h-4 rounded-sm object-contain shrink-0 transition-transform group-hover:scale-110" 
              alt=""
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate w-full font-inter">
              {s.title || s.domain}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

const StudyMarkdown = ({ content, sources }: { content: string, sources: any[] }) => {
  const sanitizedContent = preprocessMath(content);

  const components = useMemo(() => ({
    // 🚀 CUSTOM LINK HANDLER: Replaces [Citation X] with Favicon Badges
    a: ({ href, children }: any) => {
      const text = String(children);
      const isCitation = /Citation\s*\d+|Source/i.test(text);
      
      if (isCitation) {
        const domain = new URL(href).hostname.replace('www.', '');
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center align-middle mx-0.5 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all group no-underline"
            title={domain}
          >
            <img 
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} 
              className="w-3 h-3 mr-1 object-contain" 
              alt="" 
            />
            <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-inter">
              {text.match(/\d+/)?.[0] || '↗'}
            </span>
          </a>
        );
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all">
          {children}
        </a>
      );
    },
    table: ({ children }: any) => <div className="my-6 w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"><table className="w-full text-left border-collapse text-sm">{children}</table></div>,
    thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">{children}</thead>,
    th: ({ children }: any) => <th className="px-4 py-2 font-semibold">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50">{children}</td>,
    pre: ({ children }: any) => <div className="rounded-xl overflow-hidden my-5 border border-zinc-200 dark:border-zinc-800 bg-[#0c0c0e]">{children}</div>,
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-inter">{match[1]}</span>
            <CodeCopyButton text={String(children).replace(/\n$/, '')} />
          </div>
          <SyntaxHighlighter {...props} style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1.25rem', background: 'transparent', fontSize: '13px' }}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code {...props} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-blue-300 px-1.5 py-0.5 rounded text-[13px] font-mono">{children}</code>
      );
    },
    p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed text-[15px] text-zinc-800 dark:text-zinc-200 font-inter">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8 mb-4 font-inter">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-4 font-inter">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mt-6 mb-3 font-inter">{children}</h3>,
    ul: ({ children }: any) => <ul className="mb-4 space-y-2 list-disc pl-5 marker:text-zinc-400">{children}</ul>,
    li: ({ children }: any) => <li className="text-[15px] leading-relaxed font-inter">{children}</li>,
    blockquote: ({ children }: any) => <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 py-1 my-5 text-zinc-500 italic">{children}</blockquote>,
  }), [sources]);

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none w-full min-w-0 font-inter">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

export const ChatMessageItem = ({ m, index, onRegenerate, onEditSubmit }: any) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  // 🚀 Parses generic user uploads (Files/Images) so they render properly
  const renderUserMessage = (rawText: string) => {
    let cleanText = rawText.replace(/\[AUTO-EXTRACTED DOCUMENT CONTEXT FOR .*?\][\s\S]*?\[END OF DOCUMENT CONTEXT\]/g, '');
    cleanText = cleanText.replace(/\[STUDY MATERIAL CONTEXT FOR .*?\][\s\S]*?\[END OF DOCUMENT CONTEXT\]/g, '');
    const parts = cleanText.split(/(!?\[[^\]]*\]\([^)]+\))/g);
    
    return (
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words font-inter">
        {parts.map((part, i) => {
          const trimmed = part.trim();
          const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            return (
              <div key={i} className="my-3 flex flex-col items-start">
                <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full max-w-full sm:max-w-xs h-auto rounded-lg border border-black/10 dark:border-white/10 shadow-sm object-contain bg-white dark:bg-zinc-900" loading="lazy" />
              </div>
            );
          }
          const fileMatch = trimmed.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
          if (fileMatch) {
            return (
              <a key={i} href={fileMatch[2]} target="_blank" rel="noopener noreferrer" className="my-2 inline-flex items-center gap-2 px-3 py-2 bg-black/10 dark:bg-white/10 rounded-lg text-sm font-medium transition-colors hover:bg-black/20 dark:hover:bg-white/20">
                <FileText size={16} className="text-white dark:text-zinc-900 shrink-0" /> 
                <span className="truncate">{fileMatch[1]}</span>
              </a>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col gap-2 w-full animate-in fade-in duration-300 min-w-0 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className={`w-fit max-w-[95%] md:max-w-[85%] lg:max-w-[80%] min-w-0 ${
        m.role === 'user' 
          ? 'px-4 py-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm border border-zinc-900 dark:border-zinc-100' 
          : 'w-full text-zinc-900 dark:text-zinc-100'
      }`}>
        
        {editing ? (
          <div className="flex flex-col gap-3 w-full sm:w-[400px]">
            <textarea 
              className="w-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg p-3 text-sm outline-none resize-none min-h-[100px] font-inter text-white dark:text-zinc-900 focus:border-blue-500"
              autoFocus value={val} onChange={(e) => setVal(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={() => { onEditSubmit(index, val); setEditing(false); }} className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-blue-700 font-inter">Save & Resend</button>
            </div>
          </div>
        ) : (
          m.role === 'user' ? (
            renderUserMessage(m.content)
          ) : (
            <div className="w-full min-w-0">
              <SourceBadges sources={m.sources} />
              <StudyMarkdown content={m.content} sources={m.sources} />
            </div>
          )
        )}
      </div>

      {m.role !== 'user' && !editing && (
        <div className="flex items-center gap-1 text-zinc-400 mt-2 px-1">
          <button className="p-1.5 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors"><ThumbsUp size={14} /></button>
          <button className="p-1.5 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors"><ThumbsDown size={14} /></button>
          <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <button onClick={() => onRegenerate(index)} className="p-1.5 hover:text-blue-500 rounded-md transition-colors" title="Regenerate"><RefreshCw size={14} /></button>
        </div>
      )}
      
      {m.role === 'user' && !editing && (
        <div className="flex items-center gap-1 text-zinc-400 mt-1 px-1 justify-end">
          <button onClick={() => { setEditing(true); setVal(m.content); }} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-md transition-colors" title="Edit message">
            <PenLine size={14} />
          </button>
        </div>
      )}
    </div>
  );
};