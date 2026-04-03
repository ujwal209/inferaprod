'use client'

import React, { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { 
  CheckCircle2, X, Sparkles, Check, 
  Loader2, Copy, Maximize2, Download, Play 
} from 'lucide-react'
import MonacoEditor from '@monaco-editor/react'

import { QuizWidget } from '@/components/study/QuizWidget'
import { ProgressWidget } from '@/components/study/ProgressWidget'

// 🚀 Helper to sanitize AI math output before Markdown parsing
const preprocessMath = (content: string) => {
  if (!content) return "";
  return content
    // Replace block math \[ ... \] with $$ ... $$
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`)
    // Replace inline math \( ... \) with $ ... $
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
};

const extractTextFromNode = (node: any): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromNode).join('');
  if (node && node.props && node.props.children) return extractTextFromNode(node.props.children);
  return '';
};

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0" title="Copy message">
      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
};

export const CodeCopyButton = ({ text }: { text: string }) => {
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
      className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-white transition-all rounded-md hover:bg-zinc-700 shrink-0"
    >
      {copied ? (
        <>
          <CheckCircle2 size={11} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 hidden sm:inline">Copied</span>
        </>
      ) : (
        <>
          <Copy size={11} />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Copy</span>
        </>
      )}
    </button>
  );
};

export const InteractiveImage = ({ src, alt }: { src?: string; alt?: string }) => {
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
      window.open(src, '_blank'); 
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="relative group my-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-zoom-in shadow-sm transition-all hover:shadow-md w-full max-w-full sm:max-w-md"
      >
        <img 
          src={src} 
          alt={alt || 'Generated output'} 
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-zinc-900 dark:text-zinc-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-[11px] sm:text-[12px] shadow-xl transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <Maximize2 size={13} />
            <span>Expand</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-4xl max-h-full flex flex-col items-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-10 right-0 left-0 flex justify-between items-center px-1">
              <span className="text-white/70 text-[12px] font-semibold truncate max-w-[150px] sm:max-w-sm">
                {alt || 'Generated Image'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors">
                <X size={16} />
              </button>
            </div>
            <img src={src} alt={alt || 'Expanded output'} className="w-auto h-auto max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain bg-zinc-900/50" />
            <div className="absolute -bottom-14 flex justify-center w-full">
              <button onClick={handleDownload} disabled={isDownloading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-[12px] sm:text-[13px] shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100">
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download Image'}</span>
                <span className="sm:hidden">{isDownloading ? '...' : 'Download'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const RunnableCodeBlock = ({ lang, text }: { lang: string, text: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [editableCode, setEditableCode] = useState(text);
  const [currentLang, setCurrentLang] = useState(lang.replace('?chameleon', '').toLowerCase());
  const editorRef = useRef<any>(null);

  const JUDGE0_LANGUAGES: Record<string, number> = {
    javascript: 93, js: 93,
    typescript: 94, ts: 94,
    python: 71, py: 71,
    cpp: 54, c: 50,
    java: 62,
    csharp: 51, cs: 51,
    go: 60, golang: 60,
    rust: 73, rs: 73,
    php: 68, ruby: 72,
    bash: 46, sh: 46
  };

  const getJudge0LanguageId = (l: string) => JUDGE0_LANGUAGES[l] || 71;

  const handleRun = async () => {
    if (!isModalOpen) setIsModalOpen(true);
    setIsRunning(true);
    setOutput("Initializing execution environment...\n");

    try {
      const languageId = getJudge0LanguageId(currentLang);

      const response = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language_id: languageId,
          source_code: editorRef.current ? editorRef.current.getValue() : editableCode
        }),
      });

      const data = await response.json();
      
      if (data.compile_output) {
        setOutput((prev) => prev + "\n[Compilation Error]\n" + data.compile_output);
      } else if (data.stderr) {
        setOutput((prev) => prev + "\n[Execution Error]\n" + data.stderr);
      } else if (data.stdout !== undefined && data.stdout !== null) {
        setOutput((prev) => prev + "\n" + (data.stdout || "[No Console Output]"));
      } else {
        setOutput((prev) => prev + "\n[Execution Failed]\n" + JSON.stringify(data));
      }
    } catch (error: any) {
      setOutput((prev) => prev + "\n[Network Error]\n" + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const isRunnable = Object.keys(JUDGE0_LANGUAGES).includes(lang.replace('?chameleon', '').toLowerCase());


  return (
    <>
      <div className="relative my-4 w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-0">
        <div className="bg-[#111113] px-3 py-2 text-[10px] sm:text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center rounded-t-xl z-20 relative">
          <span className="font-bold tracking-wider uppercase text-zinc-500 truncate mr-2">
            {lang.replace('?chameleon', '') || 'code'}
          </span>
          <div className="flex items-center gap-2">
            {isRunnable && (
              <button onClick={handleRun} className="flex items-center gap-1.5 px-2 py-1 text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all rounded-md shrink-0 border border-transparent hover:border-blue-500/30">
                <Play size={11} fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Run Code</span>
              </button>
            )}
            <CodeCopyButton text={text} />
          </div>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={lang.replace('?chameleon', '')}
          PreTag="div"
          className="!m-0 !bg-[#0c0c0e] !p-3 sm:!p-4 custom-scrollbar overflow-x-auto w-full rounded-b-xl"
          codeTagProps={{ className: "text-[12px] sm:text-[13px] font-mono leading-relaxed text-zinc-200" }}
        >
          {text}
        </SyntaxHighlighter>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-6xl h-full max-h-[95vh] bg-[#0c0c0e] border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-zinc-800/80 bg-[#111113] rounded-t-2xl shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Play size={14} className="text-blue-400" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-white tracking-wide truncate">Live Console Execution</h3>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest truncate hidden xs:block">Compiler (Judge0 Engine)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[12px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-zinc-700"
              >
                <X size={16} className="sm:w-[14px] sm:h-[14px]" /> 
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 border-b md:border-b-0 md:border-r border-[#333] bg-[#1e1e1e] flex flex-col">
                 <div className="px-4 py-2 bg-[#252526] border-b border-[#1e1e1e] flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-3">
                     <span className="text-[12px] font-mono text-[#9cdcfe]">index.code</span>
                     <select 
                       value={currentLang}
                       onChange={(e) => setCurrentLang(e.target.value)}
                       className="bg-[#3c3c3c] border-none text-[#cccccc] rounded px-2 py-1 outline-none font-sans text-[11px] cursor-pointer"
                     >
                       <option value="python">Python</option>
                       <option value="javascript">JavaScript</option>
                       <option value="typescript">TypeScript</option>
                       <option value="java">Java</option>
                       <option value="cpp">C++</option>
                       <option value="c">C</option>
                       <option value="csharp">C#</option>
                       <option value="go">Go</option>
                       <option value="rust">Rust</option>
                     </select>
                   </div>
                   <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-1.5 px-3 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-colors disabled:opacity-50 text-[11px] font-sans font-medium">
                     {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                     {isRunning ? "Running..." : "Run (F5)"}
                   </button>
                 </div>
                 
                 <div className="flex-1 w-full overflow-hidden flex relative bg-[#1e1e1e]">
                   <MonacoEditor
                     height="100%"
                     theme="vs-dark"
                     language={currentLang === 'c' || currentLang === 'cpp' ? 'cpp' : currentLang === 'bash' ? 'shell' : currentLang}
                     defaultValue={editableCode}
                     onChange={(val) => setEditableCode(val || '')}
                     onMount={(editor) => { editorRef.current = editor; }}
                     options={{
                       minimap: { enabled: false },
                       fontSize: 14,
                       lineHeight: 21,
                       padding: { top: 20 },
                       scrollBeyondLastLine: false,
                       smoothScrolling: true,
                       cursorBlinking: 'smooth',
                       cursorSmoothCaretAnimation: 'on'
                     }}
                     loading={<div className="flex items-center justify-center w-full h-full text-zinc-500 font-sans text-sm"><Loader2 className="animate-spin mr-2" size={16} /> Loading VS Code Engine...</div>}
                   />
                 </div>
              </div>
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar font-mono text-[13.5px] sm:text-[14.5px] leading-relaxed text-zinc-300 whitespace-pre-wrap relative min-h-[300px] md:min-h-0 bg-[#08080a]">
                {isRunning && !output?.includes('[Execution Failed]') && !output?.includes('[No Console Output]') && !output?.includes('[Network Error]') && !output?.includes('[Compilation Error]') && !output?.includes('[Execution Error]') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-[#08080a]/80 backdrop-blur-sm z-10 animate-in fade-in duration-300 shadow-inner">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold text-blue-400">Executing Payload...</span>
                  </div>
                ) : null}
                <div className="font-bold text-emerald-400 opacity-50 mb-4 select-none">$&gt; executing {currentLang}...</div>
                {output}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const getCustomComponents = ({ sessionId, onAnswerSubmitted, isLast, isTyping }: { sessionId?: string | null, onAnswerSubmitted?: any, isLast?: boolean, isTyping?: boolean }) => {
  return {
    table: ({ children }: any) => (
      <div className="my-5 w-full max-w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e] shadow-sm custom-scrollbar">
        <table className="w-full text-left border-collapse text-[12px] sm:text-[13px] font-outfit min-w-[400px]">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-zinc-50 dark:bg-[#111113] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">{children}</thead>,
    th: ({ children }: any) => <th className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 border-b border-zinc-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-300 font-medium whitespace-pre-wrap break-words">{children}</td>,
    
    h1: ({ children }: any) => <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 sm:mt-8 mb-3 sm:mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 break-words">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-6 sm:mt-8 mb-3 sm:mb-4 break-words">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-[16px] sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-5 sm:mt-6 mb-2 sm:mb-3 break-words">{children}</h3>,
    
    ul: ({ children }: any) => <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-4 font-outfit text-[14.5px] sm:text-[15px] text-zinc-800 dark:text-zinc-300 w-full break-words">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-4 font-outfit text-[14.5px] sm:text-[15px] text-zinc-800 dark:text-zinc-300 w-full break-words">{children}</ol>,
    
    li: ({ children, ...props }: any) => <li className="pl-1 leading-relaxed marker:text-zinc-400 dark:marker:text-zinc-600 break-words" {...props}>{children}</li>,
    p: ({ children, ...props }: any) => <p className="text-[14.5px] sm:text-[15px] leading-relaxed mb-3 sm:mb-4 break-words w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1" {...props}>{children}</p>,
    strong: ({ children }: any) => <strong className="font-bold text-zinc-900 dark:text-white break-words">{children}</strong>,
    
    a: ({ node, href, children, ...props }: any) => (
      <a 
        href={href} target="_blank" rel="noopener noreferrer" 
        className="inline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 decoration-blue-500/30 font-semibold transition-colors break-words" {...props}
      >
        {children}
        <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ml-1 align-middle whitespace-nowrap">
          Source
        </span>
      </a>
    ),

    blockquote: ({ children }: any) => {
      const text = extractTextFromNode(children).trim();
      return (
        <div className="w-full mt-3 mb-3 p-3 sm:p-4 bg-blue-50/50 dark:bg-[#111113] border border-blue-200/50 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 shadow-sm min-w-0">
          <Sparkles size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <span className="leading-snug text-[13.5px] sm:text-[14.5px] font-outfit font-semibold text-zinc-700 dark:text-zinc-300 break-words w-full">{text}</span>
        </div>
      )
    },

    img: ({ src, alt }: any) => <InteractiveImage src={src} alt={alt} />,

    code: ({ node, className, inline, children, ...props }: any) => {
      const text = String(children).replace(/\n$/, '');
      const match = /language-([a-zA-Z0-9_?\-]+)/.exec(className || '');
      let lang = match ? match[1] : '';

      if (lang === '' && text.trim().startsWith('{') && text.trim().includes('"component"')) {
        lang = 'json';
      }

      if (!inline && (lang === 'json?chameleon' || lang === 'json')) {
        let parsed = null;

        try {
          parsed = JSON.parse(text);
        } catch (err) {
          try {
            const fixedStr = text.replace(/\\(?!["\\/bfnrt])/g, '\\\\');
            parsed = JSON.parse(fixedStr);
          } catch (err2) {
            parsed = null;
          }
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
            <div className="my-4 p-4 sm:p-5 rounded-xl border border-blue-200/50 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 flex items-center gap-2.5 text-blue-600 dark:text-blue-400 shadow-inner animate-pulse w-full">
              <Loader2 className="animate-spin shrink-0" size={18} />
              <span className="font-bold text-[11px] sm:text-[12px] uppercase tracking-widest break-words">Generating Module...</span>
            </div>
          );
        }
      }

      if (!inline && lang) {
        return <RunnableCodeBlock lang={lang} text={text} />;
      }

      return (
        <code className={`${inline ? 'bg-zinc-100 dark:bg-[#1f1f22] text-zinc-900 dark:text-zinc-200 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800/50 break-words' : 'block p-3 bg-[#0c0c0e] text-zinc-200 overflow-x-auto rounded-xl custom-scrollbar w-full'} font-mono text-[0.8em] font-semibold`} {...props}>
          {children}
        </code>
      );
    }
  }
}

export const StudyMarkdown = ({ content, role, sessionId, onAnswerSubmitted, isLast, isTyping }: any) => {
  const components = getCustomComponents({ sessionId, onAnswerSubmitted, isLast, isTyping });
  
  // 🚀 Apply math sanitization pre-processing before handing it to ReactMarkdown
  const sanitizedContent = preprocessMath(content);

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