'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Image from 'next/image'
import { 
  getSessions, deleteSession, renameSession, 
  getChatMessages, sendCoachingMessage, initializeSession 
} from '@/app/actions/coaching'
import { 
  Search, Menu, X, RefreshCw, Sparkles, Plus, Send, Edit3, 
  Trash2, Loader2, Check, ChevronRight, Copy, PenLine, CheckCircle2,
  Globe, Zap, Square, Paperclip, FileText, ThumbsUp, ThumbsDown
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

// 🚀 DIRECT UPLOAD HELPER WITH CANCELLATION SUPPORT
const uploadFilesDirectly = async (files: File[], sessionId: string, signal?: AbortSignal) => {
  if (files.length === 0) return [];
  
  const AGENT_URL = (process.env.NEXT_PUBLIC_AGENT_URL || "http://127.0.0.1:8789").replace(/\/$/, "");
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    
    const response = await fetch(`${AGENT_URL}/api/v1/upload-doc`, {
      method: 'POST',
      body: formData,
      signal // 🚀 Attached AbortSignal here
    });
    
    if (!response.ok) throw new Error(`Upload Failed: ${file.name}`);
    const data = await response.json();
    return data.url as string;
  });
  
  return Promise.all(uploadPromises);
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

// --- FLOATING PROMPT BAR COMPONENT (WITH FILE UPLOADS) ---
const PromptBar = ({ 
  onSubmit, 
  onStop,
  isGenerating,
  isUploading,
  editTrigger,
  isCentered
}: { 
  onSubmit: (val: string, files: File[], deep: boolean, web: boolean) => Promise<void>, 
  onStop: () => void,
  isGenerating: boolean,
  isUploading: boolean,
  editTrigger: {text: string, ts: number} | null,
  isCentered: boolean
}) => {
  const [text, setText] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [webAccess, setWebAccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAction = async () => {
    if (isGenerating || isUploading) {
      onStop();
    } else if (text.trim() || files.length > 0) {
      const submittedText = text;
      const submittedFiles = [...files];
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      setFiles([]); // Clear local preview instantly to move to chat bubble
      
      await onSubmit(submittedText, submittedFiles, deepSearch, webAccess);
    }
  };

  return (
    <div className={`w-full shrink-0 z-20 pointer-events-none ${
      isCentered ? 'px-4 sm:px-6' : 'px-3 sm:px-6 md:px-8 pb-4 sm:pb-6'
    }`}>
      <div className={`w-full pointer-events-auto ${isCentered ? 'max-w-2xl mx-auto' : 'max-w-4xl mx-auto'}`}>
        
        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col">
          
          {/* FILE PREVIEW AREA BEFORE SENDING */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 px-4 pt-4 pb-1">
              {files.map((file, idx) => (
                <div key={idx} className="relative flex items-center gap-2 p-2 pr-3 rounded-xl bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 max-w-[200px] overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <div className="w-8 h-8 shrink-0 rounded-md overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <FileText size={16} />
                    </div>
                  )}
                  <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 truncate w-full">
                    {file.name}
                  </span>

                  {isUploading && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
                      <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                  )}

                  {!isUploading && (
                    <button 
                      onClick={() => removeFile(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-500 shadow-sm transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 px-4 pt-3 pb-2">
            
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isUploading}
              className="h-10 w-10 sm:h-12 sm:w-12 mb-1.5 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
              title="Attach File or Image"
            >
              <Paperclip size={20} />
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isUploading ? "Uploading files to Infera engine..." : "Message INFERA CORE or drop a file..."}
              className="flex-1 bg-transparent font-outfit text-[15px] sm:text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 min-h-[52px] sm:min-h-[60px] max-h-[180px] resize-none custom-scrollbar leading-relaxed pt-2.5 sm:pt-3.5"
              disabled={isGenerating || isUploading}
              rows={1}
            />
            
            <button
              onClick={handleAction}
              disabled={(isUploading || !isGenerating) && !text.trim() && files.length === 0}
              className={`h-10 w-10 sm:h-12 sm:w-12 mb-1.5 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 shadow-sm ${
                isGenerating || isUploading
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-95'
                  : (!text.trim() && files.length === 0)
                    ? 'bg-zinc-100 dark:bg-[#111113] text-zinc-400 dark:text-zinc-600 border border-transparent dark:border-zinc-800 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-[0_4px_14px_rgba(37,99,235,0.3)]'
              }`}
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : isGenerating ? <Square size={16} className="fill-current" /> : <Send size={20} className="-translate-x-px translate-y-px" />}
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
              Deep Think
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
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [forceStop, setForceStop] = useState(false);
  
  const requestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null); // 🚀 Holds our cancellation signal
  
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
  }, [messages, loading, isTyping, isUploading]);

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

  // 🚀 ABORT HANDLER
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Physically kill the upload
      abortControllerRef.current = null;
    }
    requestRef.current++; 
    setForceStop(true); 
    setLoading(false);
    setIsUploading(false);
    setIsTyping(false);
  };

  // 🚀 MAIN SUBMIT HANDLER (State Master + Revert Logic)
  const submitPrompt = async (text: string, attachedFiles: File[] = [], deepSearch: boolean = false, webAccess: boolean = false) => {
    if ((!text.trim() && attachedFiles.length === 0) || loading || isUploading || isTyping) return;
    const reqId = ++requestRef.current;
    setForceStop(false);

    // Save snapshot of UI state in case the user clicks cancel
    const prevMessagesSnapshot = [...messages];
    
    // Determine initial state based on files
    if (attachedFiles.length > 0) setIsUploading(true);
    else setLoading(true);

    try {
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        targetSessionId = await initializeSession(text || "Uploaded File");
        setSessionId(targetSessionId);
      }

      // 1. SHOW PRELIMINARY LOCAL PREVIEW
      const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
      const initialMarkdown = attachedFiles.map(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        if (imageExtensions.includes(ext)) return `\n\n![${f.name}](${URL.createObjectURL(f)})`;
        return `\n\n[${f.name}](attachment)`; // Temporary flag string for dynamic renderer
      }).join("");
      
      setMessages(prev => [...prev, { role: 'user', content: (text || "Uploaded files.") + initialMarkdown }]);

      // 2. DIRECT UPLOAD PHASE
      let uploadedUrls: string[] = [];
      if (attachedFiles.length > 0) {
        abortControllerRef.current = new AbortController(); // Activate signal
        try {
          uploadedUrls = await uploadFilesDirectly(attachedFiles, targetSessionId, abortControllerRef.current.signal);
        } catch (uploadErr: any) {
          if (uploadErr.name === 'AbortError') {
             // 🚀 PERFECT REVERT IF USER CLICKS CANCEL
             setMessages(prevMessagesSnapshot); 
             return; // Stop silently without throwing errors
          }
          throw uploadErr;
        } finally {
          abortControllerRef.current = null; // Clean up signal
        }
        setIsUploading(false); // End upload state
        setLoading(true);      // Begin LLM generation state
      }

      // 3. SWAP LOCAL URLs FOR CLOUDINARY URLs
      const fileMarkdown = uploadedUrls.map((url) => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        const fileName = url.split('/').pop() || "Document";
        if (imageExtensions.includes(ext)) return `\n\n![${fileName}](${url})`;
        return `\n\n[${fileName}](${url})`; // Clean url for docs
      }).join("");

      const localDisplayContent = (text || "Uploaded files.") + fileMarkdown;
      
      // Update the user message strictly (replaces the local blob urls with real ones)
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', content: localDisplayContent };
        return updated;
      });

      // 4. SEND TO LLM BACKEND
      const res = await sendCoachingMessage(targetSessionId, text, 'gpt-4o', uploadedUrls);
      if (requestRef.current !== reqId) return; 
      
      if (!sessionId) refreshSessions();
      
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
      // Pass empty array for fileUrls when editing
      const res = await sendCoachingMessage(sessionId!, newText, 'gpt-4o', [], index);
      if (requestRef.current !== reqId) return; 

      setMessages(prev => {
        const newMsgs = [...truncatedMessages, { role: 'user', content: newText }, { role: 'assistant', content: res.content }];
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

  // --- 3. ROBUST, BEAUTIFUL MARKDOWN COMPONENTS ---
  const MarkdownComponents = {
    table: ({ children }: any) => (
      <div className="my-8 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-sm">
        <table className="w-full text-left border-collapse text-sm font-outfit">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-[#111113] text-zinc-500 dark:text-zinc-400 font-google-sans font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-5 py-4 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
    td: ({ children }: any) => <td className="px-5 py-4 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium leading-relaxed">{children}</td>,
    
    // SaaS Grade Code Blocks
    pre: ({ children }: any) => <div className="rounded-2xl overflow-hidden my-8 border border-zinc-800 shadow-xl relative group/code bg-[#0c0c0e]">{children}</div>,
    code: ({ node, className, inline, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative">
          <div className="bg-[#111113] px-5 py-3 text-xs font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center">
            <span className="font-google-sans font-bold tracking-wider uppercase text-zinc-500">{match[1]}</span>
            <CodeCopyButton text={String(children).replace(/\n$/, '')} />
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="!m-0 !bg-[#0c0c0e] !p-6 custom-scrollbar"
            codeTagProps={{
              className: "text-[14px] font-mono leading-relaxed text-zinc-200"
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={`${inline ? 'bg-zinc-100 dark:bg-[#1f1f22] text-zinc-900 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800/50' : 'block p-5 bg-[#0c0c0e] text-zinc-200'} font-mono text-[0.85em] font-semibold`} {...props}>
          {children}
        </code>
      );
    },
    
    p: ({ children }: any) => <p className="mb-6 last:mb-0 leading-loose text-[16px] sm:text-[17px] text-zinc-800 dark:text-zinc-300">{children}</p>,
    
    h1: ({ children }: any) => <h1 className="font-google-sans text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white mt-12 mb-6 pb-2 border-b border-zinc-200 dark:border-zinc-800">{children}</h1>,
    h2: ({ children }: any) => <h2 className="font-google-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-12 mb-6 flex items-center gap-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="font-google-sans text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-8 mb-4">{children}</h3>,
    
    ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-3 mb-6 font-outfit text-[16px] sm:text-[17px] text-zinc-800 dark:text-zinc-300">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-6 space-y-3 mb-6 font-outfit text-[16px] sm:text-[17px] text-zinc-800 dark:text-zinc-300">{children}</ol>,
    li: ({ children, ...props }: any) => <li className="leading-relaxed marker:text-zinc-400 dark:marker:text-zinc-600 pl-1" {...props}>{children}</li>,
    
    strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white">{children}</strong>,
    hr: () => <hr className="my-10 border-zinc-200 dark:border-zinc-800/80" />,
  };

  // --- 4. MESSAGE ITEM (Memoized) ---
  const MessageItem = React.memo(({ m, index, isLast, loading, isUploading, isTypingGlobal, isLocallyTyping, displayedContent, onRegenerate, onEditSubmit, isNewAssistant }: any) => {
    const isUser = m.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(m.content || "");

    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
    
    // 🚀 DYNAMIC MARKDOWN INJECTORS (Reacts to `isUploading` state)
    const memoizedComponents = useMemo(() => {
      return {
        ...MarkdownComponents,
        
        // DOCUMENT ATTACHMENT RENDERER
        a: ({ node, href, children, ...props }: any) => {
          if (href === 'attachment' || (typeof href === 'string' && (href.startsWith('http://res.cloudinary.com') || href.startsWith('https://res.cloudinary.com')))) {
            // It is currently uploading if it still has the 'attachment' placeholder
            const isCurrentlyUploading = isLast && isUser && isUploading && href === 'attachment';
            return (
              <a 
                href={isCurrentlyUploading ? undefined : href}
                target={isCurrentlyUploading ? undefined : "_blank"}
                rel={isCurrentlyUploading ? undefined : "noopener noreferrer"}
                className={`relative flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-xl w-max max-w-full my-3 shadow-sm select-none overflow-hidden group transition-colors no-underline ${isCurrentlyUploading ? 'cursor-wait' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer'}`}
              >
                <div className={`p-2 ${isCurrentlyUploading ? 'bg-blue-600 animate-pulse' : 'bg-blue-100 dark:bg-blue-900/30'} text-blue-600 dark:text-blue-400 rounded-lg shrink-0 transition-colors`}>
                  {isCurrentlyUploading ? <Loader2 size={18} className="animate-spin text-white" /> : <FileText size={18} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-[13px] font-bold ${isCurrentlyUploading ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'} truncate pr-2 font-google-sans`}>
                    {children}
                  </span>
                  {isCurrentlyUploading ? (
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5 animate-pulse">Uploading to Infera...</span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-500/60 uppercase tracking-widest mt-0.5 group-hover:text-blue-600 transition-colors">Open Document</span>
                  )}
                </div>
              </a>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 font-semibold transition-colors break-words" {...props}>
              {children}
              <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[9px] font-google-sans uppercase font-bold px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">Source</span>
            </a>
          );
        },
        
        // IMAGE ATTACHMENT RENDERER
        img: ({ src, alt }: any) => {
          // If it's a blob URL, we are currently uploading it
          const isCurrentlyUploading = isLast && isUser && isUploading && src?.startsWith('blob:');
          return (
            <div className={`my-6 w-full relative rounded-2xl overflow-hidden group/img border border-zinc-200 dark:border-zinc-800 shadow-xl bg-zinc-50 dark:bg-[#0c0c0e] ${isCurrentlyUploading ? 'opacity-70 animate-pulse' : ''}`}>
              <img 
                src={src} 
                alt={alt || "Coaching Content"} 
                className={`w-full max-h-[500px] object-contain transition-all duration-500 ${isCurrentlyUploading ? 'cursor-wait' : 'cursor-zoom-in hover:scale-105'}`}
                onClick={() => { if (!isCurrentlyUploading && typeof window !== 'undefined') window.open(src, '_blank') }}
              />
              {isCurrentlyUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm gap-2">
                  <Loader2 size={32} className="animate-spin text-white drop-shadow-md" />
                  <span className="text-white font-google-sans text-[11px] font-bold uppercase tracking-widest drop-shadow-md">Uploading Image...</span>
                </div>
              )}
              {alt && alt !== "Uploaded Image" && !isCurrentlyUploading && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-center">
                  {alt}
                </div>
              )}
            </div>
          );
        },

        blockquote: ({ children }: any) => {
          return (
            <div className="w-full mt-6 mb-6 p-6 sm:p-8 bg-zinc-50 dark:bg-[#111113] border-l-4 border-blue-500 rounded-r-2xl shadow-sm">
              <span className="leading-loose text-[16px] sm:text-[17px] font-outfit italic text-zinc-700 dark:text-zinc-400">{children}</span>
            </div>
          )
        }
      };
    }, [isLast, isUser, isUploading]);

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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={{
                  ...memoizedComponents, 
                  p: ({children}: any) => <p className="font-outfit text-[15.5px] sm:text-[16px] m-0 font-medium tracking-wide whitespace-pre-wrap">{children}</p>
                }}
              >
                {m.content}
              </ReactMarkdown>
            ) : (
              <>
                {contentToRender ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={memoizedComponents}>
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
          {!isUser && (
            <div className="flex items-center gap-0.5">
              <button 
                onClick={() => handleFeedback('like')}
                className={`p-1.5 transition-colors rounded-lg hover:bg-emerald-500/10 ${feedback === 'like' ? 'text-emerald-500' : 'text-zinc-400'}`} 
                title="Good response"
              >
                <ThumbsUp size={14} fill={feedback === 'like' ? 'currentColor' : 'none'} />
              </button>
              <button 
                onClick={() => handleFeedback('dislike')}
                className={`p-1.5 transition-colors rounded-lg hover:bg-rose-500/10 ${feedback === 'dislike' ? 'text-rose-500' : 'text-zinc-400'}`} 
                title="Bad response"
              >
                <ThumbsDown size={14} fill={feedback === 'dislike' ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}
          <CopyButton text={m.content || ""} />
          
          {isUser && !loading && !isTypingGlobal && !isUploading && (
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit prompt">
              <PenLine size={15} />
            </button>
          )}

          {!isUser && isLast && !loading && !isTypingGlobal && !isUploading && (
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
                    isGenerating={loading || isTyping} 
                    isUploading={isUploading}
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
                                isUploading={isUploading}
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
                          isLast={m.role === 'assistant' && i === messages.length - 1 || (m.role === 'user' && i === messages.length - 1)}
                          loading={loading}
                          isUploading={isUploading}
                          isTypingGlobal={isTyping}
                          onRegenerate={handleRegenerate}
                          onEditSubmit={handleEditSubmit}
                          isNewAssistant={false}
                        />
                      );
                    })}

                    {loading && !isUploading && !isTyping && (
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
                    isGenerating={loading || isTyping} 
                    isUploading={isUploading}
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