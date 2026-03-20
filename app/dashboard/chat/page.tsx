'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import { 
  getSessions, deleteSession, renameSession, 
  getChatMessages, sendCoachingMessage 
} from '@/app/actions/coaching'
import { 
  Search, Menu, X, RefreshCw, Sparkles,
  Plus, Send, Edit3, Trash2, Loader2, Check, ChevronRight, Copy, PenLine, CheckCircle2,
  Globe, Zap, Square
} from 'lucide-react'

// --- 1. UTILITY COMPONENTS ---
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

// --- SMOOTH HIGH SPEED TYPEWRITER HOOK ---
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

    if (!enabled || !safeText) {
      setDisplayedText(safeText);
      setIsTypingState(false);
      hasFinishedRef.current = true;
      onCompleteRef.current?.();
      return;
    }

    if (forceStop) {
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

// --- FLOATING PROMPT BAR COMPONENT ---
const PromptBar = ({ 
  onSubmit, 
  onStop,
  isGenerating,
  editTrigger,
  isCentered
}: { 
  onSubmit: (val: string) => void, 
  onStop: () => void,
  isGenerating: boolean,
  editTrigger: {text: string, ts: number} | null,
  isCentered: boolean
}) => {
  const [text, setText] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [webAccess, setWebAccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editTrigger && editTrigger.text) {
      setText(editTrigger.text);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
      }
    }
  }, [editTrigger]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAction();
    }
  };

  const handleAction = () => {
    if (isGenerating) {
      onStop();
    } else if (text.trim()) {
      onSubmit(text);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className={`w-full shrink-0 z-20 pointer-events-none ${
      isCentered ? 'px-4 sm:px-6' : 'px-3 sm:px-6 md:px-8 pb-4 sm:pb-6'
    }`}>
      <div className={`w-full pointer-events-auto ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}`}>
        
        {/* PROMPT BAR STYLING: High visibility borders, crisp contrast */}
        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          
          <div className="flex items-end gap-2 px-4 pt-4 pb-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message INFERA CORE..."
              className="flex-1 bg-transparent font-outfit text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[52px] sm:min-h-[60px] max-h-[180px] resize-none custom-scrollbar leading-relaxed pt-1"
              disabled={isGenerating && !text.trim()}
              rows={1}
            />
            <button
              onClick={handleAction}
              disabled={!isGenerating && !text.trim()}
              className={`h-10 w-10 sm:h-12 sm:w-12 mb-1.5 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 shadow-sm ${
                isGenerating
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-95'
                  : !text.trim()
                    ? 'bg-zinc-100 dark:bg-[#111113] text-zinc-400 dark:text-zinc-600 border border-transparent dark:border-zinc-800 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_4px_14px_rgba(37,99,235,0.3)]'
              }`}
            >
              {isGenerating ? <Square size={16} className="fill-current" /> : <Send size={20} className="-translate-x-px translate-y-px" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 pb-3 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              onClick={() => setDeepSearch(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-google-sans font-bold transition-all shrink-0 ${
                deepSearch
                  ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400'
                  : 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Zap size={13} className={deepSearch ? 'text-violet-600 dark:text-violet-400' : ''} />
              Deep Search
            </button>

            <button
              onClick={() => setWebAccess(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-google-sans font-bold transition-all shrink-0 ${
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

// --- TYPEWRITER MESSAGE WRAPPER ---
const TypewriterMessage = ({
  content, isNew, forceStop, onComplete, scrollRef, children,
}: {
  content: string; isNew: boolean; forceStop: boolean; onComplete: () => void; scrollRef?: React.RefObject<HTMLDivElement>; children: (displayed: string, isLocalTyping: boolean) => React.ReactNode;
}) => {
  const { displayedText, isTyping } = useTypewriter(content, isNew, forceStop, onComplete);

  useEffect(() => {
    if (isTyping && scrollRef?.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [displayedText, isTyping, scrollRef]);

  return <>{children(displayedText, isTyping)}</>;
};


// --- 2. MAIN COMPONENT ---
export default function AICoachingMentor() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
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
  const [editTrigger, setEditTrigger] = useState<{text: string, ts: number} | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { refreshSessions(); }, []);
  
  useEffect(() => { 
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      setTimeout(() => {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, loading, isTyping]);

  const refreshSessions = async () => { setSessions(await getSessions()); };

  const loadSession = async (id: string) => {
    setLoading(true);
    setSessionId(id);
    setLastAssistantIndex(-1);
    const msgs = await getChatMessages(id);
    setMessages(msgs || []);
    setLoading(false);
    setMobileMenuOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSession(id);
    if (sessionId === id) { setMessages([]); setSessionId(null); }
    refreshSessions();
  };

  const saveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await renameSession(id, editTitle);
    setEditingId(null);
    refreshSessions();
  };

  const handleStop = () => {
    requestRef.current++; 
    setLoading(false);
    setForceStop(true); 
    setIsTyping(false);
  };

  const getSafeResponseText = (res: any): string => {
    if (!res) return "Error: Received empty response from server.";
    if (typeof res === 'string') return res;
    return res.content || res.text || res.message || res.response || JSON.stringify(res);
  };

  const submitPrompt = async (text: string) => {
    if (!text.trim() || loading || isTyping) return;
    const reqId = ++requestRef.current;
    
    setForceStop(false);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    
    try {
      const res = await sendCoachingMessage(sessionId, text, 'default');
      if (requestRef.current !== reqId) return; 
      
      if (res?.sessionId) {
        setSessionId(res.sessionId);
        if (!sessionId) refreshSessions();
      }
      
      const safeContent = getSafeResponseText(res);
      
      setMessages(prev => {
        const newMsgs = [...prev, { role: 'assistant', content: safeContent }];
        setLastAssistantIndex(newMsgs.length - 1);
        return newMsgs;
      });
      setIsTyping(true);
    } catch (err: any) {
      console.error(err);
      if (requestRef.current === reqId) {
        setMessages(prev => [
          ...prev, 
          { role: 'assistant', content: `**System Error:** Connection Failed. Please try again.` }
        ]);
        setIsTyping(false);
      }
    } finally { 
      if (requestRef.current === reqId) setLoading(false); 
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
      const res = await sendCoachingMessage(sessionId, newText, 'default', index);
      if (requestRef.current !== reqId) return; 

      if (res?.sessionId) setSessionId(res.sessionId);
      const safeContent = getSafeResponseText(res);

      setMessages(prev => {
        const newMsgs = [...truncatedMessages, { role: 'user', content: newText }, { role: 'assistant', content: safeContent }];
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

  // --- 3. ROBUST MARKDOWN COMPONENTS ---
  const MarkdownComponents = {
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-sm">
        <table className="w-full text-left border-collapse text-sm font-outfit">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-[#111113] text-zinc-500 dark:text-zinc-400 font-google-sans font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-4 py-3 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-3 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium">{children}</td>,
    
    // SaaS Grade Code Blocks (Always Dark for premium feel, matching Vercel/Linear)
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
            codeTagProps={{
              className: "text-[14px] font-mono leading-relaxed text-zinc-200"
            }}
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
      return (
        <button 
          onClick={() => submitPrompt(text)}
          disabled={loading || isTyping}
          className="w-full text-left mt-4 mb-2 p-5 bg-white dark:bg-[#0c0c0e] hover:bg-zinc-50 dark:hover:bg-[#111113] border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-2xl text-sm font-outfit font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all flex items-center justify-between group shadow-sm disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-blue-500 shrink-0" />
            <span className="leading-snug">{text}</span>
          </div>
          <ChevronRight size={18} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      )
    }
  };

  // --- 4. MESSAGE ITEM (Memoized) ---
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
              <button 
                onClick={() => { setIsEditing(false); setEditValue(m.content); }} 
                className="px-4 py-2 font-google-sans text-[13px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setIsEditing(false); onEditSubmit(index, editValue); }} 
                disabled={loading || isTypingGlobal || !editValue.trim()}
                className="px-4 py-2 font-google-sans text-[13px] font-bold bg-blue-600 text-white hover:bg-blue-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
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
          : 'bg-transparent text-zinc-900 dark:text-zinc-100 w-full'
        }`}>
          <div className={`prose prose-zinc dark:prose-invert max-w-none break-words w-full ${isUser ? 'prose-p:leading-relaxed prose-p:my-0 prose-p:text-white dark:prose-p:text-zinc-900' : ''}`}>
            {isUser ? (
              <p className="font-outfit text-[15.5px] sm:text-[16px] m-0 font-medium tracking-wide">{m.content}</p>
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

  // --- 5. SIDEBAR (Memoized) ---
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

  const hasMessages = messages.length > 0;
  const isGenerating = loading || isTyping;

  return (
    <>
      {/* Inject Google Fonts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Outfit:wght@100..900&display=swap');
        .font-outfit { font-family: 'Outfit', sans-serif !important; }
        .font-google-sans { font-family: 'Google Sans', sans-serif !important; }
      `}} />

      {/* Main App Container - FIXED HEIGHT to prevent mobile scrolling */}
      <div className="fixed inset-0 top-[64px] sm:top-[72px] flex w-full overflow-hidden bg-white dark:bg-[#050505] font-outfit text-zinc-900 dark:text-zinc-100">
          
          <aside className="hidden md:flex flex-col w-80 shrink-0 z-10">
            <HistorySidebar sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter} loadSession={loadSession} setEditingId={setEditingId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename} handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setMobileMenuOpen(false); setLastAssistantIndex(-1);}} />
          </aside>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
              <div className="absolute left-0 top-0 h-full w-[280px] bg-white dark:bg-[#050505] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
                <div className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 flex justify-between items-center px-6">
                  <span className="font-google-sans font-bold text-sm tracking-wide text-zinc-900 dark:text-white uppercase">History</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[#0c0c0e] rounded-xl transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <HistorySidebar sessions={sessions} sessionId={sessionId} filter={filter} setFilter={setFilter} loadSession={loadSession} setEditingId={setEditingId} editingId={editingId} editTitle={editTitle} setEditTitle={setEditTitle} saveRename={saveRename} handleDelete={handleDelete} createNewSession={() => {setMessages([]); setSessionId(null); setMobileMenuOpen(false); setLastAssistantIndex(-1);}} />
                </div>
              </div>
            </div>
          )}

          <main className="flex-1 flex flex-col min-w-0 relative h-full">
            
            {/* Mobile Header trigger */}
            <header className="h-[60px] shrink-0 flex items-center justify-between px-4 z-30 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80 absolute top-0 w-full md:hidden">
              <div className="flex items-center gap-3">
                <button className="flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-[#0c0c0e]" onClick={() => setMobileMenuOpen(true)}>
                  <Menu size={22} />
                </button>
                <span className="font-google-sans text-[13px] font-bold text-zinc-500 dark:text-zinc-400">
                  Chat History
                </span>
              </div>
            </header>

            {!hasMessages ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden pt-10">
                <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-700 max-w-3xl">
                  
                  <div className="mb-4 w-48 sm:w-56 transition-transform hover:scale-105 duration-500">
                    <Image 
                      src="/logo.png" 
                      alt="InfraCore Logo" 
                      width={220} 
                      height={60} 
                      className="w-full h-auto object-contain dark:invert opacity-90"
                      priority
                    />
                  </div>
                  
                  <h1 className="font-google-sans text-[1.75rem] sm:text-[2.25rem] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight mb-2">
                    Ask anything...
                  </h1>
                  
                  <PromptBar 
                    onSubmit={submitPrompt} 
                    onStop={handleStop}
                    isGenerating={isGenerating} 
                    editTrigger={editTrigger} 
                    isCentered={true}
                  />
                </div>
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto pt-16 md:pt-8 p-4 sm:p-6 md:p-8 scroll-smooth custom-scrollbar">
                  <div className="max-w-4xl mx-auto w-full space-y-8 sm:space-y-10">
                    
                    {messages.map((m, i) => {
                      const isNewAssistant = m.role === 'assistant' && i === lastAssistantIndex;
                      
                      if (isNewAssistant) {
                        return (
                          <TypewriterMessage
                            key={`tw-msg-${lastAssistantIndex}`}
                            content={m.content || ""}
                            isNew={true}
                            forceStop={forceStop}
                            onComplete={() => setIsTyping(false)}
                            scrollRef={scrollRef}
                          >
                            {(displayed, isLocalTyping) => (
                              <MessageItem
                                key={`${m.role}-${i}`}
                                m={m}
                                index={i}
                                isLast={i === messages.length - 1}
                                loading={loading}
                                isTypingGlobal={isTyping}
                                isLocallyTyping={isLocalTyping}
                                displayedContent={displayed}
                                onRegenerate={handleRegenerate}
                                onEditSubmit={handleEditSubmit}
                                isNewAssistant={true}
                                forceStop={forceStop}
                                onTypingComplete={() => setIsTyping(false)}
                              />
                            )}
                          </TypewriterMessage>
                        );
                      }

                      return (
                        <MessageItem
                          key={`${m.role}-${i}`}
                          m={m}
                          index={i}
                          isLast={m.role === 'assistant' && i === messages.length - 1}
                          loading={loading}
                          isTypingGlobal={isTyping}
                          onRegenerate={handleRegenerate}
                          onEditSubmit={handleEditSubmit}
                          isNewAssistant={false}
                        />
                      );
                    })}

                    {loading && (
                      <div className="flex w-full items-start animate-in fade-in">
                        <div className="flex items-center gap-3 text-zinc-500 ml-2 bg-[#fafafa] dark:bg-[#0c0c0e] px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                          <Loader2 className="animate-spin text-zinc-400 dark:text-zinc-500" size={18} /> 
                          <span className="font-google-sans text-[11px] font-bold uppercase tracking-widest text-zinc-500">Generating Response</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="h-[120px] sm:h-[140px]" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-[#050505] dark:via-[#050505] to-transparent pt-12 pb-4 sm:pb-6 pointer-events-none z-30">
                  <PromptBar 
                    onSubmit={submitPrompt} 
                    onStop={handleStop}
                    isGenerating={isGenerating} 
                    editTrigger={editTrigger} 
                    isCentered={false}
                  />
                </div>
              </>
            )}
          </main>
      </div>
    </>
  )
}