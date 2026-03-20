'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, CheckCircle2, PenLine, User, Sparkles } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const CodeCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  return (
    <button 
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800"
    >
      {copied ? (
        <>
          <CheckCircle2 size={12} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Copied</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Copy</span>
        </>
      )}
    </button>
  );
};

export const MessageItem = React.memo(({ 
  m, 
  index, 
  loading, 
  isTypingGlobal, 
  onEditSubmit, 
  isNewAssistant, 
  displayedContent 
}: any) => {
  const isUser = m.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setEditValue(m.content); }, [m.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(m.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#0c0c0e] border border-blue-500/30 rounded-2xl p-6 shadow-2xl shadow-blue-500/5">
          <textarea 
            value={editValue} 
            onChange={(e) => setEditValue(e.target.value)} 
            className="w-full bg-transparent text-[16px] font-medium text-zinc-900 dark:text-zinc-100 outline-none resize-none min-h-[150px] leading-relaxed font-sans" 
            autoFocus 
          />
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={() => { setIsEditing(false); setEditValue(m.content); }} 
              className="px-4 py-2 text-[13px] font-bold text-zinc-500 hover:text-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => { setIsEditing(false); onEditSubmit(index, editValue); }} 
              disabled={loading || isTypingGlobal || !editValue.trim()} 
              className="px-6 py-2 text-[13px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contentToRender = isNewAssistant && displayedContent !== undefined ? displayedContent : m.content;

  return (
    <div className="group w-full py-10 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-5xl mx-auto flex gap-5 md:gap-8 px-5">
        
        {/* AVATAR BOX */}
        <div className={`mt-1 h-10 w-10 md:h-12 md:w-12 shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-300 ${
          isUser 
          ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500' 
          : 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
        }`}>
          {isUser ? <User size={20} /> : <Sparkles size={20} className="fill-current" />}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
              {isUser ? 'Request' : 'Analysis Report'}
            </span>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isUser && (
                <button 
                  onClick={handleCopy} 
                  className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                >
                  {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              )}
              {isUser && !loading && !isTypingGlobal && (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                >
                  <PenLine size={16} />
                </button>
              )}
            </div>
          </div>

          {/* MARKDOWN RENDERER */}
          <div className="prose dark:prose-invert max-w-none w-full text-[15px] md:text-[17px] font-medium leading-[1.7] text-zinc-800 dark:text-zinc-200 font-sans antialiased">
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap">{m.content}</p>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-8 mb-4 tracking-tight" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-7 mb-3 tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-6 mb-2 tracking-tight" {...props} />,
                  p: ({node, ...props}) => <p className="mb-5 last:mb-0 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="space-y-3 my-5 list-none p-0" {...props} />,
                  li: ({node, ...props}) => (
                    <li className="flex items-start gap-3 pl-1">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
                      <span className="flex-1" {...props} />
                    </li>
                  ),
                  strong: ({node, ...props}) => <strong className="font-bold text-zinc-900 dark:text-white" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-500/5 px-6 py-4 rounded-r-xl my-6 italic text-zinc-700 dark:text-zinc-300" {...props} />
                  ),
                  code: ({node, className, inline, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="rounded-xl overflow-hidden my-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative group/code bg-[#282c34]">
                        <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-xs font-mono text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                          <span>{match[1]}</span>
                          <CodeCopyButton text={String(children).replace(/\n$/, '')} />
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="!m-0 !bg-[#282c34] !p-4 custom-scrollbar"
                          codeTagProps={{
                            className: "text-[14px] font-mono leading-relaxed"
                          }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={`${inline ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-zinc-100 dark:bg-zinc-800 block p-4'} px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-[0.9em]`} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {contentToRender}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';