'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import { 
  Search, Menu, X, RefreshCw, Sparkles,
  Plus, Send, Edit3, Trash2, Loader2, Check, ChevronRight, Copy, PenLine, CheckCircle2,
  Globe, Zap, Square, Maximize2, Download
} from 'lucide-react'

// --- Server Actions (Ensure these point to your actual action file) ---
import { 
  getRoadmapSessions, 
  getRoadmapMessages, 
  deleteRoadmapSession, 
  renameRoadmapSession,
  sendRoadmapMessage 
} from '@/app/actions/architects'


// ==========================================
// 1. UTILITY COMPONENTS
// ==========================================

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
    <button onClick={handleCopy} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Copy message">
      {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
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
    <button 
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-white transition-all rounded-md hover:bg-zinc-700"
    >
      {copied ? (
        <>
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span className="text-[10px] font-google-sans font-bold uppercase tracking-wider text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span className="text-[10px] font-google-sans font-bold uppercase tracking-wider">Copy</span>
        </>
      )}
    </button>
  );
};

// ==========================================
// 2. INTERACTIVE IMAGE
// ==========================================

const InteractiveImage = ({ src, alt }: { src?: string; alt?: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = alt ? `${alt.replace(/\s+/g, '-').toLowerCase()}.png` : 'infera-generated-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab", error);
      window.open(src, '_blank'); 
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="relative group my-6 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-zoom-in shadow-sm transition-all hover:shadow-md max-w-lg"
      >
        <img 
          src={src} 
          alt={alt || 'Generated output'} 
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-xl flex items-center gap-2 font-google-sans font-bold text-[13px] shadow-xl transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Maximize2 size={16} />
            <span>Expand Image</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-5xl max-h-full flex flex-col items-center animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 right-0 left-0 flex justify-between items-center px-2">
              <span className="text-white/70 font-google-sans text-[13px] font-semibold truncate max-w-[200px] sm:max-w-md">
                {alt || 'Generated Image'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <img 
              src={src} 
              alt={alt || 'Expanded output'} 
              className="w-auto h-auto max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-zinc-900/50" 
            />
            <div className="absolute -bottom-16 flex justify-center w-full">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-google-sans font-bold text-[14px] shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span>{isDownloading ? 'Downloading...' : 'Download Image'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// 3. MARKDOWN COMPONENTS
// ==========================================

const MarkdownComponents = {
  table: ({ children }: any) => (
    <div className="my-6 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-sm">
      <table className="w-full text-left border-collapse text-sm font-outfit">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-[#111113] text-zinc-500 dark:text-zinc-400 font-google-sans font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
  th: ({ children }: any) => <th className="px-4 py-3 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium">{children}</td>,
  
  pre: ({ children }: any) => <div className="rounded-2xl overflow-hidden my-6 border border-zinc-800 shadow-lg relative group/code bg-[#0c0c0e]">{children}</div>,
  code: ({ node, className, inline, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <div className="relative">
        <div className="bg-[#111113] px-4 py-2.5 text-xs font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center">
          <span className="font-google-sans font-bold tracking-wider uppercase text-zinc-500">{match[1]}</span>
          <CodeCopyButton text={String(children).replace(/\n$/, '')} />
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="!m-0 !bg-[#0c0c0e] !p-5 custom-scrollbar"
          codeTagProps={{ className: "text-[14px] font-mono leading-relaxed text-zinc-200" }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className={`${inline ? 'bg-zinc-100 dark:bg-[#1f1f22] text-zinc-900 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800/50' : 'block p-4 bg-[#0c0c0e] text-zinc-200'} font-mono text-[0.85em] font-semibold`} {...props}>
        {children}
      </code>
    );
  },
  
  p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-relaxed font-outfit text-[15.5px] sm:text-[16px] text-zinc-800 dark:text-zinc-300">{children}</p>,
  h3: ({ children }: any) => <h3 className="font-google-sans text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-8 mb-4">{children}</h3>,
  h2: ({ children }: any) => <h2 className="font-google-sans text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-10 mb-6">{children}</h2>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-2 mb-4 font-outfit text-[15.5px] sm:text-[16px] text-zinc-800 dark:text-zinc-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-2 mb-4 font-outfit text-[15.5px] sm:text-[16px] text-zinc-800 dark:text-zinc-300">{children}</ol>,
  strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
  
  a: ({ node, href, children, ...props }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 font-semibold transition-colors break-words" 
      {...props}
    >
      {children}
      <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[9px] font-google-sans uppercase font-bold px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">
        Source
      </span>
    </a>
  ),

  blockquote: ({ children }: any) => {
    const text = extractTextFromNode(children).trim();
    // This requires passing the global submitPrompt function down, which ReactMarkdown can't easily do directly without context.
    // For simplicity and to avoid prop drilling bugs, we'll render it as a styled callout box.
    return (
      <div className="w-full mt-4 mb-4 p-5 bg-blue-50/50 dark:bg-[#111113] border border-blue-200/50 dark:border-zinc-800 rounded-2xl flex items-start gap-3 shadow-sm">
        <Sparkles size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <span className="leading-snug text-sm font-outfit font-semibold text-zinc-700 dark:text-zinc-300">{text}</span>
      </div>
    )
  },

  img: ({ src, alt }: any) => <InteractiveImage src={src} alt={alt} />
};

// ==========================================
// 4. TYPEWRITER EFFECT
// ==========================================

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
// 5. MESSAGE ITEM
// ==========================================

const MessageItem = React.memo(({ m, index, isLast, loading, isTypingGlobal, isLocallyTyping, displayedContent, onRegenerate, onEditSubmit, isNewAssistant }: any) => {
  const isUser = m.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.content || "");

  useEffect(() => { setEditValue(m.content || ""); }, [m.content]);

  if (isEditing) {
    return (
      <div className="flex flex-col w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%] self-end animate-in fade-in duration-200 mb-2">
        <div className="bg-white dark:bg-[#0c0c0e] border border-blue-500/50 focus-within:border-blue-500 rounded-2xl p-3 sm:p-4 shadow-sm transition-all">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-transparent font-outfit text-[15.5px] sm:text-[16px] text-zinc-900 dark:text-zinc-100 outline-none resize-none custom-scrollbar min-h-[80px]"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
            <button onClick={() => { setIsEditing(false); setEditValue(m.content); }} className="px-4 py-2 font-google-sans text-[13px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={() => { setIsEditing(false); onEditSubmit(index, editValue); }} disabled={loading || isTypingGlobal || !editValue.trim()} className="px-4 py-2 font-google-sans text-[13px] font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-xl transition-colors shadow-sm disabled:opacity-50">
              Save & Regenerate
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contentToRender = isNewAssistant && displayedContent !== undefined ? displayedContent : (m.content || "");

  return (
    <div className={`group flex flex-col gap-1 w-full animate-in fade-in ${isUser ? 'items-end' : 'items-start'}`}>
      
      <div className={`relative max-w-[98%] sm:max-w-[92%] md:max-w-[88%] ${
        isUser 
        ? 'bg-zinc-900 dark:bg-zinc-100 px-5 sm:px-6 py-3.5 sm:py-4 rounded-[1.5rem] rounded-tr-md text-white dark:text-zinc-900 shadow-sm border border-zinc-800 dark:border-zinc-200' 
        : 'bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm text-zinc-900 dark:text-zinc-100 w-full'
      }`}>
        <div className={`prose prose-zinc dark:prose-invert max-w-none break-words w-full font-outfit ${isUser ? 'prose-p:leading-relaxed prose-p:my-0 prose-p:text-white dark:prose-p:text-zinc-900' : ''}`}>
          {isUser ? (
            <p className="font-outfit text-[15.5px] sm:text-[16px] m-0 font-medium tracking-wide whitespace-pre-wrap">{m.content}</p>
          ) : (
            <>
              {contentToRender ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {contentToRender}
                </ReactMarkdown>
              ) : (
                <span className="font-outfit text-zinc-400 italic">Processing...</span>
              )}
              {isNewAssistant && isLocallyTyping && (
                <span className="inline-block w-[4px] h-5 bg-blue-500 rounded-full animate-pulse ml-1 align-text-bottom" />
              )}
            </>
          )}
        </div>
      </div>

      <div className={`flex items-center gap-1 opacity-100 transition-opacity mt-1.5 ${isUser ? 'mr-2 justify-end' : 'ml-2 justify-start'} sm:opacity-60 sm:hover:opacity-100`}>
        <CopyButton text={m.content || ""} />
        {isUser && !loading && !isTypingGlobal && (
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit prompt">
            <PenLine size={15} />
          </button>
        )}
        {!isUser && isLast && !loading && !isTypingGlobal && (
          <button onClick={() => onRegenerate(index)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Regenerate response">
            <RefreshCw size={15} />
          </button>
        )}
      </div>

    </div>
  );
});
MessageItem.displayName = 'MessageItem';


// ==========================================
// 6. PROMPT BAR
// ==========================================

const ActivePromptBar = ({ onSubmit, onStop, loading, isTyping }: any) => {
  const [chatInput, setChatInput] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [webAccess, setWebAccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
    // Fixed container anchoring it to the bottom with minimal necessary padding
    <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-t from-[#fafafa] via-[#fafafa] dark:from-[#050505] dark:via-[#050505] to-transparent pt-24">
      <div className="w-full max-w-4xl mx-auto">
        
        {/* Crisp Border and Glassmorphism */}
        <div className="bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-xl border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden flex flex-col">
          
          <div className="flex items-end gap-4 px-5 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up or refine your roadmap..."
              className="flex-1 bg-transparent font-outfit text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[52px] max-h-[200px] resize-none custom-scrollbar leading-relaxed pt-1.5 pl-1"
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
              className={`h-10 w-10 sm:h-12 sm:w-12 mb-1.5 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 shadow-sm ${
                loading || isTyping
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-95 shadow-none'
                  : !chatInput.trim()
                    ? 'bg-zinc-100 dark:bg-[#111113] border border-transparent dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_4px_14px_rgba(37,99,235,0.3)]'
              }`}
            >
              {loading || isTyping ? (
                <Square size={16} className="fill-current" />
              ) : (
                <Send size={20} className="-translate-x-px translate-y-px" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-transparent overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setDeepSearch(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-google-sans text-[12px] font-bold transition-all shrink-0 ${
                deepSearch
                  ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400'
                  : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Zap size={13} className={deepSearch ? 'text-violet-600 dark:text-violet-400' : ''} />
              Deep Think
            </button>

            <button
              type="button"
              onClick={() => setWebAccess(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-google-sans text-[12px] font-bold transition-all shrink-0 ${
                webAccess
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
                  : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Globe size={13} className={webAccess ? 'text-blue-600 dark:text-blue-400' : ''} />
              Web Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 7. INIT FORM
// ==========================================

const InitForm = ({ onSubmit, loading }: { onSubmit: (e: any) => void, loading: boolean }) => {
  return (
    <div className="w-full max-w-2xl flex flex-col items-center text-center animate-in fade-in duration-700 mx-auto my-auto pt-10">
      <div className="flex items-center justify-center gap-4 mb-6">
        <Image src="/logo.png" width={170} height={40} alt="InfraCore" className="dark:invert object-contain opacity-90" priority />
        <div className="h-6 w-[2px] bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <span className="font-google-sans text-[19px] font-bold text-blue-600 dark:text-blue-400 tracking-tight pt-1">
          Roadmaps
        </span>
      </div>
      
      <h1 className="font-google-sans text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-8">
        Architect your learning path.
      </h1>
      
      <div className="w-full text-left bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-3xl shadow-xl dark:shadow-none p-6 sm:p-8 transition-all duration-300">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="font-google-sans text-[13px] font-bold text-zinc-700 dark:text-zinc-300 pl-1 uppercase tracking-wider">Target Role</label>
              <input name="target_role" required placeholder="e.g. Frontend Developer" className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl text-[14px] font-medium outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="font-google-sans text-[13px] font-bold text-zinc-700 dark:text-zinc-300 pl-1 uppercase tracking-wider">Current Skills</label>
              <input name="current_skills" required placeholder="e.g. HTML, CSS, JS basics" className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl text-[14px] font-medium outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" disabled={loading} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-google-sans text-[13px] font-bold text-zinc-700 dark:text-zinc-300 pl-1 uppercase tracking-wider">Timeframe (Months)</label>
            <input name="timeframe_months" type="number" required placeholder="e.g. 6" className="font-outfit w-full bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl text-[14px] font-medium outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" disabled={loading} />
          </div>
          <div className="flex justify-end pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <button type="submit" disabled={loading} className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-google-sans text-[14px] font-bold shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
              {loading ? 'Building...' : 'Generate Path'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==========================================
// 8. SIDEBAR
// ==========================================

const HistorySidebar = React.memo(({ sessions, sessionId, filter, setFilter, loadSession, setEditingId, editingId, editTitle, setEditTitle, saveRename, handleDelete, createNewSession }: any) => {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const filteredSessions = (sessions || []).filter((s:any) => s.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-[#fafafa] dark:bg-[#050505] relative overflow-hidden border-r border-zinc-200 dark:border-zinc-800/80">
      
      <div className="p-6 pb-2 space-y-6 relative z-10">
        <button 
          onClick={() => { createNewSession(); setIsSelectMode(false); }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[14px] shadow-sm transition-all active:scale-[0.98] group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-google-sans">New Session</span>
        </button>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-google-sans text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">History</h3>
            <div className="flex items-center gap-3">
              {isSelectMode && (
                <button 
                  onClick={async () => {
                    // NO ALERTS: Directly map and delete
                    const ids = filteredSessions.map((s: any) => s.id);
                    for (let id of ids) {
                      await handleDelete({ stopPropagation: () => {} } as any, id);
                    }
                    setIsSelectMode(false);
                  }}
                  className="font-google-sans text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete All
                </button>
              )}
              <button 
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`font-google-sans text-[11px] font-bold uppercase tracking-wider transition-colors ${isSelectMode ? 'text-blue-600 dark:text-blue-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                {isSelectMode ? 'Done' : 'Manage'}
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={15} />
            <input 
              placeholder="Search history..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl font-outfit text-[13px] font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto px-4 mt-4 space-y-1.5 custom-scrollbar pb-6`}>
        {filteredSessions.map((s:any) => (
          <div key={s.id} className={`group relative p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${sessionId === s.id && !isSelectMode ? 'bg-white dark:bg-[#111113] border border-zinc-200 dark:border-zinc-700 shadow-sm' : 'border border-transparent hover:bg-zinc-100 dark:hover:bg-[#0c0c0e]'}`}>
            
            {isSelectMode && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(e, s.id); }} className="shrink-0 text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            )}

            <div onClick={() => !isSelectMode && loadSession(s.id)} className="flex-1 min-w-0">
              {editingId === s.id ? (
                <div className="flex items-center gap-2">
                  <input autoFocus value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="bg-transparent font-outfit text-[14px] font-bold outline-none w-full border-b border-blue-400 text-zinc-900 dark:text-white" onKeyDown={(e) => e.key === 'Enter' && saveRename(e as any, s.id)} />
                  <button onClick={(e)=>saveRename(e, s.id)} className="p-1 text-emerald-500 hover:scale-110 transition-transform"><Check size={18} /></button>
                </div>
              ) : (
                <button className={`w-full text-left font-outfit text-[14px] truncate transition-colors ${sessionId === s.id && !isSelectMode ? 'font-bold text-zinc-900 dark:text-white' : 'font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}>
                  {s.title}
                </button>
              )}
            </div>

            {!isSelectMode && editingId !== s.id && (
              <div className="flex gap-0.5 opacity-100 transition-opacity sm:opacity-60 sm:group-hover:opacity-100">
                <button onClick={(e)=>{ e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }} className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors" title="Rename"><Edit3 size={14} /></button>
                <button onClick={(e)=>handleDelete(e, s.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
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
// 9. MAIN PAGE
// ==========================================

export default function RoadmapChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  const requestRef = useRef(0);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastAssistantIndex, setLastAssistantIndex] = useState<number>(-1);
  
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
    getRoadmapSessions().then((fetchedSessions) => {
      setSessions(fetchedSessions);
      if (fetchedSessions.length > 0 && !sessionId) {
        loadSession(fetchedSessions[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSession = async (id: string) => {
    setLoading(true); setSessionId(id); setLastAssistantIndex(-1);
    setMessages(await getRoadmapMessages(id));
    setLoading(false);
    setMobileMenuOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteRoadmapSession(id);
    if (sessionId === id) { setMessages([]); setSessionId(null); }
    getRoadmapSessions().then(setSessions);
  };

  const saveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await renameRoadmapSession(id, editTitle);
    setEditingId(null);
    getRoadmapSessions().then(setSessions);
  };

  const handleStop = () => {
    requestRef.current++; setLoading(false); setForceStop(true); setIsTyping(false);
  };

  const handleInitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const targetRole = formData.get('target_role') as string;
    const currentSkills = formData.get('current_skills') as string;
    const timeframe = parseInt(formData.get('timeframe_months') as string);

    const userMessage = `Target Role: ${targetRole}\nCurrent Skills: ${currentSkills}\nTimeframe: ${timeframe} months`;
    setMessages([{ role: 'user', content: userMessage }]);
    
    try {
      const res = await sendRoadmapMessage(null, userMessage, { role: targetRole, skills: currentSkills, timeframe });
      setSessionId(res.sessionId);
      getRoadmapSessions().then(setSessions);
      
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

  const handleChatSubmit = async (text: string) => {
    if (loading || isTyping) return;
    const reqId = ++requestRef.current;
    
    setForceStop(false);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    
    try {
      const res = await sendRoadmapMessage(sessionId, text);
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
      const res = await sendRoadmapMessage(sessionId, newText, undefined, index);
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
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      {/* STRICT NON-SCROLLABLE WRAPPER (h-[100dvh] + overflow-hidden) */}
      <div className="fixed inset-0 top-[64px] sm:top-[72px] flex w-full overflow-hidden bg-[#fafafa] dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100 antialiased selection:bg-blue-500/20">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden md:flex flex-col w-80 z-10 shrink-0">
          <HistorySidebar 
            sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter} 
            loadSession={loadSession} setEditingId={setEditingId} editingId={editingId} 
            editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename} 
            handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setLastAssistantIndex(-1);}} 
          />
        </aside>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-[280px] bg-[#fafafa] dark:bg-[#050505] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 flex justify-between items-center px-6 shrink-0">
                <span className="font-google-sans font-bold text-sm tracking-wide text-zinc-900 dark:text-white uppercase">History</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-[#0c0c0e] rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-hidden">
                <HistorySidebar sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter} loadSession={loadSession} setEditingId={setEditingId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename} handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setMobileMenuOpen(false); setLastAssistantIndex(-1);}} />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CHAT AREA */}
        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-[#fafafa] dark:bg-[#050505]">
          
          <header className="md:hidden h-[60px] shrink-0 flex items-center justify-between px-4 sm:px-6 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 absolute top-0 w-full">
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#0c0c0e] rounded-xl transition-colors" onClick={() => setMobileMenuOpen(true)}>
                <Menu size={22} />
              </button>
              <span className="font-google-sans text-[13px] font-bold text-zinc-500 dark:text-zinc-400">
                Chat History
              </span>
            </div>
          </header>

          {!messages.length ? (
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-8 custom-scrollbar">
              <InitForm onSubmit={handleInitSubmit} loading={loading} />
            </div>
          ) : (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 md:pt-8 scroll-smooth custom-scrollbar" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                  {messages.map((m, i) => {
                    const isNewAssistant = m.role === 'assistant' && i === lastAssistantIndex;
                    if (isNewAssistant) {
                      return (
                        <TypewriterMessage key={`tw-${i}`} content={m.content} isNew={true} forceStop={forceStop} onComplete={() => setIsTyping(false)} scrollRef={scrollRef}>
                          {(displayed: any, isLocalTyping: boolean) => (
                            <MessageItem m={m} index={i} isLast={i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} isNewAssistant={true} forceStop={forceStop} onTypingComplete={() => setIsTyping(false)} displayedContent={displayed} />
                          )}
                        </TypewriterMessage>
                      );
                    }
                    return <MessageItem key={`msg-${i}`} m={m} index={i} isLast={m.role === 'assistant' && i === messages.length - 1} loading={loading} isTypingGlobal={isTyping} onRegenerate={handleRegenerate} onEditSubmit={handleEditSubmit} isNewAssistant={false} />;
                  })}
                  
                  {/* PREMIUM LOADING STATE */}
                  {loading && !isTyping && (
                    <div className="flex w-full items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-3 text-zinc-500 bg-white dark:bg-[#0c0c0e] px-5 py-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit">
                        <Loader2 className="animate-spin text-blue-500" size={18} /> 
                        <span className="font-google-sans text-[14px] font-bold text-zinc-700 dark:text-zinc-300">Architecting response...</span>
                      </div>
                    </div>
                  )}

                  {/* MASSIVE BOTTOM BUMPER: Ensures the last message scrolls high above the fixed prompt bar */}
                  <div className="h-[200px] sm:h-[240px]" />
                </div>
              </div>
              
              {/* FIXED BOTTOM PROMPT BAR WRAPPER */}
              <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-[#fafafa] via-[#fafafa] dark:from-[#050505] dark:via-[#050505] to-transparent pt-24">
                <ActivePromptBar onSubmit={handleChatSubmit} onStop={handleStop} loading={loading} isTyping={isTyping} />
              </div>
            </>
          )}
        </main>
      </div>
    </>
  )
}