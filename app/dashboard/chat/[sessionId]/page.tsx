'use client'

// Triggering Turbopack invalidation
import React, { useState, useRef, useEffect, useMemo, MouseEvent, KeyboardEvent, ChangeEvent } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { ShareModal } from '@/components/ShareModal'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PromptBar } from '@/components/PromptBar'
import { RenameModal } from '@/components/RenameModal'
import { toast } from 'sonner'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { 
  getSessions, deleteSession, renameSession, deleteSessions,
  getChatMessages, sendCoachingMessage, initializeSession,
  archiveSession, shareSession, getSessionById, duplicateSession
} from '@/app/actions/coaching'
import { 
  Menu, X, RefreshCw, Copy, PenLine, CheckCircle2,
  Globe, FileText, ThumbsUp, ThumbsDown, Loader2, ChevronRight, 
  Terminal, Share2, Archive, GitFork, Lock, Link as LinkIcon, 
  Plus, Trash2, Edit3, Clock, ChevronDown, CheckSquare, Square, Search, Sparkles
} from 'lucide-react'
import { uploadFilesDirectly } from '@/utils/uploadHelper'
import { QuizWidget } from '@/components/study/QuizWidget'
import { ProgressWidget } from '@/components/study/ProgressWidget'

// --- 1. UTILITY COMPONENTS ---

// 🚀 MATH PRE-PROCESSOR
const preprocessMath = (content: string) => {
  if (!content) return "";
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
};

const extractTextFromNode = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (node && node.props && node.props.children) return extractTextFromNode(node.props.children);
  return '';
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95" title="Copy message">
      {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
    </button>
  );
};

const CodeCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1 text-zinc-400 hover:text-white transition-all rounded-md hover:bg-zinc-700/50 active:scale-95">
      {copied ? (
        <>
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <Copy size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Copy</span>
        </>
      )}
    </button>
  );
};

const extractSources = (content: string) => {
  const sources: { title: string, url: string, domain: string }[] = [];
  const seenUrls = new Set<string>();
  
  const linkRegex = /\[(?:Citation|Source)\s*(?:\d+)?\]\((https?:\/\/[^\s\)]+)\)/gi;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[1];
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        sources.push({ title: domain, url, domain });
      } catch {
        sources.push({ title: 'Source Link', url, domain: 'external' });
      }
    }
  }
  return sources;
};

const SourcesHeader = ({ content, existingSources }: { content: string, existingSources?: any[] }) => {
  const sources = existingSources && existingSources.length > 0 ? existingSources : extractSources(content);
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mb-6 w-full animate-in fade-in duration-500">
      <div className="flex items-center gap-2 px-1">
        <Globe size={16} className="text-zinc-400" />
        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Sources</span>
      </div>
      <div className="flex flex-wrap gap-2.5 w-full">
        {sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 max-w-[280px] p-2 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111113] hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm hover:shadow-md no-underline group">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=64`} alt="" className="w-4 h-4 object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate w-full group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{s.title}</span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                <LinkIcon size={10} className="shrink-0" />
                <span className="truncate">{s.domain}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const useTypewriter = (text: string, enabled: boolean, forceStop: boolean, onComplete?: () => void) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);
  const safeText = text || ""; 
  
  const hasFinishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (hasFinishedRef.current) {
      setDisplayedText(safeText);
      return;
    }

    if (!enabled || !safeText || forceStop) {
      setDisplayedText(safeText);
      setIsTypingState(false);
      hasFinishedRef.current = true;
      onCompleteRef.current?.();
      return;
    }

    setIsTypingState(true);
    setDisplayedText('');
    let i = 0;
    
    const interval = setInterval(() => {
      i += 8; 
      if (i >= safeText.length) {
        setDisplayedText(safeText);
        setIsTypingState(false);
        hasFinishedRef.current = true;
        clearInterval(interval);
        onCompleteRef.current?.();
      } else {
        setDisplayedText(safeText.slice(0, i));
      }
    }, 4); 

    return () => clearInterval(interval);
  }, [safeText, enabled, forceStop]); 

  return { displayedText, isTyping: isTypingState };
};

const TypewriterMessage = ({ content, isNew, forceStop, onComplete, scrollRef, children }: any) => {
  const { displayedText, isTyping } = useTypewriter(content, isNew, forceStop, onComplete);

  useEffect(() => {
    if (isTyping && scrollRef?.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [displayedText, isTyping, scrollRef]);

  return <>{children(displayedText, isTyping)}</>;
};

// --- 2. SIDEBAR COMPONENTS ---
const SessionItem = ({ s, sessionId, isBulkMode, isSelected, onToggleSelect, onRename, onDelete, loadSession }: any) => {
  return (
    <div onClick={() => isBulkMode ? onToggleSelect(s.id) : loadSession(s.id)} className={`group relative p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${sessionId === s.id && !isBulkMode ? 'bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-700 shadow-sm' : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-[#0c0c0e]'}`}>
      <div className="shrink-0">
        {isBulkMode ? (
          <div className={`p-1 rounded-md transition-colors ${isSelected ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10' : 'text-zinc-300 dark:text-zinc-700 hover:text-zinc-400'}`}>
            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </div>
        ) : (
          <div className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 ${sessionId === s.id ? 'bg-blue-600 scale-125' : 'bg-transparent group-hover:bg-zinc-300'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <button className={`w-full text-left font-outfit text-[14px] truncate transition-colors ${sessionId === s.id && !isBulkMode ? 'font-bold text-zinc-900 dark:text-white' : 'font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}>
          {s.title}
        </button>
      </div>
      {!isBulkMode && (
        <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={(e)=>{ e.stopPropagation(); onRename(s.id, s.title); }} className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors rounded-md hover:bg-white dark:hover:bg-zinc-800" title="Rename"><Edit3 size={14} /></button>
          <button onClick={(e)=>onDelete(e, s.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-md hover:bg-white dark:hover:bg-zinc-800" title="Delete"><Trash2 size={14} /></button>
        </div>
      )}
    </div>
  )
}

const HistorySidebar = ({ sessions, sessionId, loadSession, handleDelete, handleBulkDelete, renameSession, refreshSessions, createNewSession }: any) => {
  const [filter, setFilter] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<{id: string, title: string} | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeSessions = useMemo(() => (sessions || []).filter((s:any) => s.status !== 'archived' && s.title?.toLowerCase().includes(filter.toLowerCase())), [sessions, filter]);
  const archivedSessions = useMemo(() => (sessions || []).filter((s:any) => s.status === 'archived' && s.title?.toLowerCase().includes(filter.toLowerCase())), [sessions, filter]);

  const onRenameSuccess = async (newTitle: string) => {
    if (!editingSession) return;
    await renameSession(editingSession.id, newTitle);
    toast.success("Session renamed successfully");
    refreshSessions();
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#050505] border-r border-zinc-200 dark:border-zinc-800/80">
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[11px] uppercase tracking-widest text-zinc-500">Chat History</span>
            <button onClick={refreshSessions} className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"><RefreshCw size={12} /></button>
          </div>
          <div className="flex items-center gap-3">
             {isBulkMode && selectedIds.size > 0 && (
                <button onClick={() => handleBulkDelete(Array.from(selectedIds)).then(() => {setIsBulkMode(false); setSelectedIds(new Set())})} className="font-bold text-[11px] uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"><Trash2 size={12} /> Delete ({selectedIds.size})</button>
             )}
             <button onClick={() => { setIsBulkMode(!isBulkMode); setSelectedIds(new Set()); }} className={`font-bold text-[11px] uppercase tracking-wider transition-colors ${isBulkMode ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-400 hover:text-zinc-600'}`}>{isBulkMode ? 'Done' : 'Select'}</button>
          </div>
        </div>

        <button onClick={createNewSession} disabled={isBulkMode} className="w-full h-11 flex items-center justify-center sm:justify-start gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all font-bold text-[13px] shadow-sm disabled:opacity-50">
          <Plus size={16} />
          <span>New Session</span>
        </button>

        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={15} />
          <input placeholder="Search sessions..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl font-outfit text-[13px] font-medium focus:outline-none focus:border-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar pb-6 mt-2">
        {archivedSessions.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <button onClick={() => setShowArchived(!showArchived)} className="w-full px-2 flex items-center justify-between group/archive mb-2">
              <div className="flex items-center gap-2">
                <Archive size={12} className="text-zinc-400 group-hover/archive:text-zinc-600 transition-colors" />
                <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 group-hover/archive:text-zinc-700 transition-colors">Archived</span>
              </div>
              {showArchived ? <ChevronDown size={12} className="text-zinc-400" /> : <ChevronRight size={12} className="text-zinc-400" />}
            </button>
            {showArchived && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                {archivedSessions.map((s:any) => <SessionItem key={s.id} s={s} sessionId={sessionId} isBulkMode={isBulkMode} isSelected={selectedIds.has(s.id)} onToggleSelect={(id:string) => { const next = new Set(selectedIds); next.has(id) ? next.delete(id) : next.add(id); setSelectedIds(next); }} onRename={(id:string, t:string)=>{setEditingSession({id, title:t}); setRenameModalOpen(true);}} onDelete={handleDelete} loadSession={loadSession} />)}
              </div>
            )}
            <div className="pt-2 border-b border-zinc-200 dark:border-zinc-800/50 mx-2 opacity-50" />
          </div>
        )}

        <div className="space-y-1.5">
          <div className="px-2 flex items-center gap-2 mb-2">
            <Clock size={12} className="text-blue-500" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500">Active Sessions</span>
          </div>
          {activeSessions.length === 0 && <p className="px-4 py-3 text-[12px] text-zinc-400 font-medium italic">No active sessions</p>}
          {activeSessions.map((s:any) => <SessionItem key={s.id} s={s} sessionId={sessionId} isBulkMode={isBulkMode} isSelected={selectedIds.has(s.id)} onToggleSelect={(id:string) => { const next = new Set(selectedIds); next.has(id) ? next.delete(id) : next.add(id); setSelectedIds(next); }} onRename={(id:string, t:string)=>{setEditingSession({id, title:t}); setRenameModalOpen(true);}} onDelete={handleDelete} loadSession={loadSession} />)}
        </div>
      </div>
      <RenameModal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} currentTitle={editingSession?.title || ""} onRename={onRenameSuccess} />
    </div>
  )
}

// --- 3. MARKDOWN RENDERER ---
export const StudyMarkdown = ({ content, role, sessionId, onAnswerSubmitted, isLast, isTyping }: any) => {
  const sanitizedContent = preprocessMath(content);

  const components = useMemo(() => ({
    table: ({ children }: any) => (
      <div className="my-8 w-full max-w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#050505] shadow-sm custom-scrollbar">
        <table className="w-full text-left border-collapse text-[12px] sm:text-[13px] font-outfit min-w-[400px]">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-5 py-4 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
    td: ({ children }: any) => <td className="px-5 py-4 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium whitespace-pre-wrap break-words">{children}</td>,
    pre: ({ children }: any) => <div className="rounded-xl overflow-hidden my-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/code bg-[#050505]">{children}</div>,
    p: ({ children }: any) => <p className="mb-6 last:mb-0 leading-[1.8] text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 font-medium break-words">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-10 mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800 break-words">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-8 mb-4 break-words">{children}</h2>,
    ul: ({ children }: any) => <ul className="list-none pl-1 space-y-3 mb-6 font-outfit text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 break-words w-full">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-4 sm:pl-5 space-y-1.5 mb-6 font-outfit text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 break-words w-full">{children}</ol>,
    li: ({ children, ...props }: any) => (
      <li className="leading-[1.8] relative pl-6 flex items-start break-words" {...props}>
        <span className="absolute left-0 top-[0.6em] w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 shrink-0" />
        <span className="font-medium min-w-0 flex-1">{children}</span>
      </li>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white break-words">{children}</strong>,
    hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
    blockquote: ({ children }: any) => <blockquote className="w-full mt-4 mb-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 border-l-4 border-zinc-300 dark:border-zinc-700 rounded-r-xl break-words min-w-0"><span className="text-[15px] font-outfit italic text-zinc-600 dark:text-zinc-400 font-medium">{children}</span></blockquote>,
    a: ({ node, href, children, ...props }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 font-semibold transition-colors break-words" {...props}>
        {children}
      </a>
    ),
    code: ({ node, className, inline, children, ...props }: any) => {
      const text = String(children).replace(/\n$/, '');
      const match = /language-([a-zA-Z0-9_?\-]+)/.exec(className || '');
      let lang = match ? match[1] : '';

      if (lang === '' && text.trim().startsWith('{') && text.trim().includes('"component"')) {
        lang = 'json';
      }

      if (!inline && (lang === 'json?chameleon' || lang === 'json')) {
        let parsed = null;
        try { parsed = JSON.parse(text); } 
        catch (err) {
          try { parsed = JSON.parse(text.replace(/\\(?!["\\/bfnrt])/g, '\\\\')); } 
          catch (err2) { parsed = null; }
        }

        if (parsed && (parsed.component === 'QuizWidget' || parsed.component === 'ProgressWidget')) {
          if (parsed.component === 'QuizWidget') {
            return <QuizWidget {...parsed.props} sessionId={sessionId} onAnswerSubmitted={onAnswerSubmitted} isHistorical={!isLast} />;
          }
          if (parsed.component === 'ProgressWidget') {
            return <ProgressWidget {...parsed.props} />;
          }
        }

        if (!parsed && isTyping) {
          return (
            <div className="my-4 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-2.5 text-zinc-500 shadow-sm w-full min-w-0">
              <Loader2 className="animate-spin shrink-0" size={18} />
              <span className="font-bold text-[12px] uppercase tracking-widest break-words truncate">Generating Interactive Module...</span>
            </div>
          );
        }
      }

      if (!inline && match) {
        return (
          <div className="relative w-full min-w-0">
            <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal size={14} className="text-zinc-400 shrink-0" />
                <span className="font-bold tracking-wider uppercase truncate">{match[1]}</span>
              </div>
              <CodeCopyButton text={text} />
            </div>
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="!m-0 !bg-[#050505] !p-5 sm:!p-6 custom-scrollbar overflow-x-auto w-full" codeTagProps={{ className: "text-[13px] sm:text-[14px] font-mono leading-relaxed text-zinc-200" }}>{text}</SyntaxHighlighter>
          </div>
        )
      }

      return (
        <code className={`${inline ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700' : 'block p-5 bg-[#050505] text-zinc-200 overflow-x-auto custom-scrollbar w-full flex-1 min-w-0'} font-mono text-[0.85em] font-semibold break-words`} {...props}>
          {children}
        </code>
      );
    }
  }), [sessionId, onAnswerSubmitted, isLast, isTyping]);

  return (
    <div className={`prose prose-zinc dark:prose-invert max-w-none break-words w-full min-w-0 ${role === 'user' ? 'prose-p:leading-relaxed prose-p:my-0' : ''}`}>
       <ReactMarkdown 
         remarkPlugins={[remarkMath, remarkGfm]} 
         rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]} 
         components={components}
       >
         {sanitizedContent}
       </ReactMarkdown>
    </div>
  );
};

// --- 4. MESSAGE ITEM (Memoized) ---
const MessageItem = React.memo(({ m, index, isLast, loading, isUploading, isTypingGlobal, isLocallyTyping, displayedContent, onRegenerate, onEditSubmit, onChatSubmit, isNewAssistant, sessionId }: any) => {
  const isUser = m.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.content || "");
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  
  useEffect(() => {
    if (m.id) {
      const stored = localStorage.getItem(`feedback-${m.id}`);
      if (stored === 'like' || stored === 'dislike') setFeedback(stored);
    }
  }, [m.id]);

  const handleFeedback = (type: 'like' | 'dislike') => {
    if (!m.id) return;
    const newVal = feedback === type ? null : type;
    setFeedback(newVal);
    if (newVal) localStorage.setItem(`feedback-${m.id}`, newVal);
    else localStorage.removeItem(`feedback-${m.id}`);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%] self-end animate-in fade-in duration-200 mb-2">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus-within:border-blue-500 rounded-2xl p-4 shadow-sm transition-all">
          <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full bg-transparent font-outfit text-[15px] text-zinc-900 dark:text-zinc-100 outline-none resize-none no-scrollbar min-h-[80px]" autoFocus />
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <button onClick={() => { setIsEditing(false); setEditValue(m.content); }} className="px-4 py-2 text-[12px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors active:scale-95">Cancel</button>
            <button onClick={() => { setIsEditing(false); onEditSubmit(index, editValue); }} disabled={loading || isTypingGlobal || !editValue.trim()} className="px-4 py-2 text-[12px] font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50 active:scale-95">Save & Send</button>
          </div>
        </div>
      </div>
    );
  }

  const contentToRender = isNewAssistant && displayedContent !== undefined ? displayedContent : (m.content || "");

  return (
    <div className={`group flex flex-col gap-2 w-full animate-in fade-in slide-in-from-bottom-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`relative max-w-[95%] sm:max-w-[85%] md:max-w-[80%] min-w-0 ${isUser ? 'bg-zinc-100 dark:bg-zinc-800 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl rounded-tr-sm text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50' : 'bg-transparent text-zinc-900 dark:text-zinc-100 w-full'}`}>
        <div className="w-full min-w-0">
          {isUser ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{p: ({children}: any) => <p className="font-outfit text-[15px] m-0 font-medium whitespace-pre-wrap break-words">{children}</p>}}>{m.content}</ReactMarkdown>
          ) : (
            <>
              {!isUser && contentToRender && <SourcesHeader content={contentToRender} existingSources={m.sources} />}
              {contentToRender ? <StudyMarkdown content={contentToRender} role={m.role} sessionId={sessionId} onAnswerSubmitted={onChatSubmit} isLast={isLast} isTyping={isTypingGlobal} /> : <div className="flex items-center gap-3"><Loader2 size={16} className="animate-spin text-zinc-400" /><span className="font-outfit text-zinc-500 italic">Thinking...</span></div>}
              {isNewAssistant && isLocallyTyping && <span className="inline-block w-[6px] h-4 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse ml-1 align-text-bottom" />}
            </>
          )}
        </div>
      </div>
      
      <div className={`flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mt-1 ${isUser ? 'mr-2 justify-end' : 'ml-0 justify-start'}`}>
        {!isUser && (
          <div className="flex items-center gap-0.5 mr-1">
            <button onClick={() => handleFeedback('like')} className={`p-1.5 transition-all rounded-md active:scale-95 ${feedback === 'like' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`} title="Good response"><ThumbsUp size={14} fill={feedback === 'like' ? 'currentColor' : 'none'} /></button>
            <button onClick={() => handleFeedback('dislike')} className={`p-1.5 transition-all rounded-md active:scale-95 ${feedback === 'dislike' ? 'text-rose-500 bg-rose-500/10' : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10'}`} title="Bad response"><ThumbsDown size={14} fill={feedback === 'dislike' ? 'currentColor' : 'none'} /></button>
          </div>
        )}
        <CopyButton text={m.content || ""} />
        {isUser && !loading && !isTypingGlobal && !isUploading && <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95" title="Edit prompt"><PenLine size={14} /></button>}
        {!isUser && isLast && !loading && !isTypingGlobal && !isUploading && <button onClick={() => onRegenerate(index)} className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95" title="Regenerate response"><RefreshCw size={14} /></button>}
      </div>
    </div>
  );
});
MessageItem.displayName = 'MessageItem';

// --- 5. MAIN COMPONENT ---
export default function ActiveStudySessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeSessionId = typeof params?.sessionId === 'string' ? params.sessionId : null;
  const initialPrompt = searchParams.get('initialPrompt');
  
  const [messages, setMessages] = useState<{role: string, content: string, sources?: any[]}[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!activeSessionId); 
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  const requestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const navigatingToNewId = useRef<string | null>(null);
  const triggeredInitialPrompt = useRef<string | null>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(activeSessionId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastAssistantIndex, setLastAssistantIndex] = useState<number>(-1);
  const [editTrigger, setEditTrigger] = useState<{text: string, ts: number} | null>(null);
  const [isForking, setIsForking] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserClient();

  useEffect(() => { 
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    }
    fetchUser();
    refreshSessions(); 
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      if (navigatingToNewId.current === activeSessionId) {
        navigatingToNewId.current = null;
        setSessionId(activeSessionId);
        setIsInitialLoading(false);
      } else {
        loadChatHistory(activeSessionId);
      }
    } else {
      setMessages([]);
      setSessionId(null);
      setIsInitialLoading(false);
    }
  }, [activeSessionId]);
  
  useEffect(() => {
    if (initialPrompt && sessionId && messages.length === 0 && !loading && !isTyping && triggeredInitialPrompt.current !== sessionId) {
      triggeredInitialPrompt.current = sessionId;
      submitPrompt(initialPrompt);
      const newPath = `/dashboard/chat/${sessionId}`;
      window.history.replaceState(null, '', newPath);
    }
  }, [initialPrompt, sessionId, messages.length]);

  useEffect(() => { 
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loading, isTyping, isUploading]);

  const refreshSessions = async () => { setSessions(await getSessions()); };

  const handleShare = async () => {
    if (!activeSessionId) return;
    try {
      await shareSession(activeSessionId);
      const url = `${window.location.origin}/dashboard/chat/${activeSessionId}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
      toast.success("Share link generated");
    } catch (err) {
      toast.error("Failed to generate share link.");
    }
  };

  const handleArchive = async () => {
    if (!activeSessionId) return;
    const promise = archiveSession(activeSessionId);
    toast.promise(promise, {
      loading: 'Archiving session...',
      success: () => {
        router.push('/dashboard/chat');
        refreshSessions();
        return "Session archived.";
      },
      error: 'Archive operation failed.'
    });
  };

  const handleDuplicate = async () => {
    if (!activeSessionId) return;
    setIsForking(true);
    const promise = duplicateSession(activeSessionId);
    toast.promise(promise, {
      loading: 'Cloning session...',
      success: (newId) => { router.push(`/dashboard/chat/${newId}`); return "Session cloned."; },
      error: 'Cloning operation failed.',
      finally: () => setIsForking(false)
    });
  };

  const loadChatHistory = async (id: string) => {
    setIsInitialLoading(true);
    setSessionId(id);
    setLastAssistantIndex(-1);
    try {
      const [msgs, data] = await Promise.all([getChatMessages(id), getSessionById(id)]);
      setMessages(msgs || []);
      setSessionData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitialLoading(false);
      setMobileMenuOpen(false);
    }
  };

  const loadSessionRoute = (id: string) => {
    router.push(`/dashboard/chat/${id}`);
  };

  const startNewChat = () => {
    router.push('/dashboard/chat');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    if (sessionId === id) router.push('/dashboard/chat');
    refreshSessions();
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    requestRef.current++; 
    setForceStop(true); 
    setLoading(false);
    setIsUploading(false);
    setIsTyping(false);
  };

  const submitPrompt = async (text: string, attachedFiles: File[] = [], deepSearch: boolean = false, webAccess: boolean = false) => {
    if ((!text.trim() && attachedFiles.length === 0) || loading || isUploading || isTyping) return;
    const reqId = ++requestRef.current;
    setForceStop(false);

    const prevMessagesSnapshot = [...messages];
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    const initialMarkdown = attachedFiles.map(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (imageExtensions.includes(ext)) return `\n\n![${f.name}](${URL.createObjectURL(f)})`;
      return `\n\n[${f.name}](attachment)`; 
    }).join("");
    
    setMessages(prev => [...prev, { role: 'user', content: (text || "Uploaded files.") + initialMarkdown }]);

    if (attachedFiles.length > 0) setIsUploading(true);
    else setLoading(true);

    try {
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        targetSessionId = await initializeSession(text || "Uploaded File");
        navigatingToNewId.current = targetSessionId;
        setSessionId(targetSessionId);
        router.push(`/dashboard/chat/${targetSessionId}`);
        refreshSessions();
      }

      let uploadedUrls: string[] = [];
      if (attachedFiles.length > 0) {
        abortControllerRef.current = new AbortController(); 
        try {
          uploadedUrls = await uploadFilesDirectly(attachedFiles, targetSessionId as string, abortControllerRef.current.signal);
        } catch (uploadErr: any) {
          if (uploadErr.name === 'AbortError') {
             setMessages(prevMessagesSnapshot); 
             return; 
          }
          throw uploadErr;
        } finally {
          abortControllerRef.current = null; 
        }
        setIsUploading(false); 
        setLoading(true);      
      }

      const fileMarkdown = uploadedUrls.map((url) => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        const fileName = url.split('/').pop() || "Document";
        if (imageExtensions.includes(ext)) return `\n\n![${fileName}](${url})`;
        return `\n\n[${fileName}](${url})`; 
      }).join("");

      const localDisplayContent = (text || "Uploaded files.") + fileMarkdown;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', content: localDisplayContent };
        return updated;
      });

      const res = await sendCoachingMessage(targetSessionId as string, text, 'gpt-4o', uploadedUrls);
      if (requestRef.current !== reqId) return; 
      
      if (targetSessionId) refreshSessions();
      setMessages(prev => {
        const newMsgs = [...prev, { role: 'assistant', content: res.content, sources: res.sources }];
        setLastAssistantIndex(newMsgs.length - 1);
        return newMsgs;
      });
      setIsTyping(true);

    } catch (err: any) {
      console.error(err);
      if (requestRef.current === reqId) {
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: `**System Error:** ${err.message || 'Connection or File Upload Failed. Please try again.'}` }
        ]);
        setIsTyping(false);
      }
    } finally { 
      if (requestRef.current === reqId) {
        setLoading(false); 
        setIsUploading(false);
      }
    }
  };

  const handleEditSubmit = async (index: number, newText: string) => {
    if (!newText.trim() || loading || isTyping) return;
    const reqId = ++requestRef.current;
    
    setForceStop(false);
    const truncatedMessages = messages.slice(0, index);
    setMessages([...truncatedMessages, { role: 'user', content: newText }]);
    setLoading(true);
    
    try {
      const res = await sendCoachingMessage(sessionId!, newText, 'gpt-4o', [], index);
      if (requestRef.current !== reqId) return; 

      setMessages(prev => {
        const newMsgs = [...truncatedMessages, { role: 'user', content: newText }, { role: 'assistant', content: res.content, sources: res.sources }];
        setLastAssistantIndex(newMsgs.length - 1);
        return newMsgs;
      });
      setIsTyping(true);
    } catch (err) {
      console.error(err);
    } finally { 
      if (requestRef.current === reqId) setLoading(false); 
    }
  };

  const handleRegenerate = async (index: number) => {
    if (loading || isTyping) return;
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

  const isOwner = currentUser?.id === sessionData?.user_id;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-edges { -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
      `}} />

      <div className="fixed inset-0 top-14 sm:top-16 flex w-full h-[calc(100vh-56px)] sm:h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100">
        <aside className="hidden md:flex flex-col w-[280px] shrink-0 z-10 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#050505]">
          <HistorySidebar sessions={sessions} sessionId={sessionId} loadSession={loadSessionRoute} handleDelete={handleDelete} handleBulkDelete={async (ids) => { await deleteSessions(ids); refreshSessions(); if (sessionId && ids.includes(sessionId)) router.push('/dashboard/chat'); }} renameSession={renameSession} refreshSessions={refreshSessions} createNewSession={startNewChat} />
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[280px] bg-white dark:bg-[#050505] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
              <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center px-4">
                <span className="font-bold text-sm text-zinc-900 dark:text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <HistorySidebar sessions={sessions} sessionId={sessionId} loadSession={loadSessionRoute} handleDelete={handleDelete} handleBulkDelete={async (ids) => { await deleteSessions(ids); refreshSessions(); if (sessionId && ids.includes(sessionId)) router.push('/dashboard/chat'); }} renameSession={renameSession} refreshSessions={refreshSessions} createNewSession={startNewChat} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#050505] relative h-full">
          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#050505]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-30 absolute top-0 w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><Menu size={20} /></button>
              <h2 className="font-semibold text-sm text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{sessions.find(s => s.id === sessionId)?.title || "New Chat"}</h2>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {!isOwner && sessionId && (
                <button onClick={handleDuplicate} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all active:scale-95 font-bold text-xs">
                  {isForking ? <Loader2 size={14} className="animate-spin" /> : <GitFork size={14} />}
                  <span className="hidden sm:inline">Clone Session</span>
                </button>
              )}
              {isOwner && sessionId && (
                <div className="flex items-center gap-1">
                  <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-semibold text-xs"><Share2 size={14} /><span className="hidden sm:inline">Share</span></button>
                  <button onClick={handleArchive} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-semibold text-xs"><Archive size={14} /><span className="hidden sm:inline">Archive</span></button>
                </div>
              )}
            </div>
          </header>

          <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} shareUrl={shareUrl} />

          {isInitialLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#050505]"><div className="flex flex-col items-center gap-4"><Loader2 size={24} className="animate-spin text-zinc-400" /><span className="text-sm font-medium text-zinc-500">Loading chat...</span></div></div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto pt-16 p-4 sm:p-6 md:p-8 scroll-smooth custom-scrollbar w-full">
                <div className="max-w-4xl mx-auto w-full space-y-8 sm:space-y-10 min-w-0">
                  {messages.map((m, i) => {
                    const isNewAssistant = m.role === 'assistant' && i === lastAssistantIndex;
                    if (isNewAssistant) {
                      return <TypewriterMessage key={`tw-${i}`} content={m.content || ""} isNew={true} forceStop={forceStop} onComplete={() => setIsTyping(false)} scrollRef={scrollRef}>{(displayed, isLocalTyping) => (
                        <MessageItem m={m} index={i} isLast={i === messages.length - 1} loading={loading} isUploading={isUploading} isTypingGlobal={isTyping} isLocallyTyping={isLocalTyping} displayedContent={displayed} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} onChatSubmit={submitPrompt} isNewAssistant={true} sessionId={sessionId} />
                      )}</TypewriterMessage>;
                    }
                    return <MessageItem key={`msg-${i}`} m={m} index={i} isLast={i === messages.length - 1} loading={loading} isUploading={isUploading} isTypingGlobal={isTyping} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} onChatSubmit={submitPrompt} isNewAssistant={false} sessionId={sessionId} />;
                  })}
                  {loading && !isUploading && !isTyping && (<div className="flex w-full items-start animate-in fade-in slide-in-from-bottom-2"><div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm ml-2"><Loader2 className="animate-spin text-zinc-400" size={16} /><span className="text-[12px] font-medium text-zinc-500">Thinking...</span></div></div>)}
                  <div className="h-[120px]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 dark:from-[#050505] dark:via-[#050505]/95 to-transparent pt-10 pb-4 sm:pb-6 pointer-events-none z-20">
                <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
                  {isOwner ? (
                    <PromptBar onSubmit={submitPrompt} onStop={handleStop} isGenerating={loading || isTyping} isUploading={isUploading} editTrigger={editTrigger} isCentered={false} />
                  ) : (
                    <div className="pointer-events-auto flex flex-col items-center gap-3 py-5 px-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <Lock size={16} />
                        <span className="font-bold text-sm">View-Only Mode</span>
                      </div>
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 text-center max-w-sm">You are viewing a shared session. Duplicate this session to your own workspace to continue the conversation.</p>
                      <button onClick={handleDuplicate} disabled={isForking} className="mt-2 flex items-center gap-2 px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg shadow-sm transition-all active:scale-[0.98] font-bold text-[13px] disabled:opacity-50">
                        {isForking ? <Loader2 size={14} className="animate-spin" /> : <GitFork size={14} />}
                        <span>Clone Session</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}