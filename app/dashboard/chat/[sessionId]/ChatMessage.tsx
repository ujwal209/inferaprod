'use client'

import React, { useState } from 'react'
import { Copy, PenLine, CheckCircle2, RefreshCw, Terminal, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { preprocessMath, extractTextFromNode } from './chat-utils'

const CodeCopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button 
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors border border-zinc-700"
      aria-label="Copy code"
    >
      {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

export const ChatMessageItem = ({ m, index, isLast, loading, isTypingGlobal, displayedContent, onRegenerate, onEditSubmit }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(m.content);

  const isUser = m.role === 'user';

  // 🚀 BULLETPROOF PARSER: Handles Cloudinary URLs, Optimistic UI, and hides Backend Context
  const renderUserMessage = (rawText: string) => {
    
    // 1. Hide the massive extracted PDF text from the UI (Keep it hidden for the AI only)
    let cleanText = rawText.replace(/\[AUTO-EXTRACTED DOCUMENT CONTEXT FOR .*?\][\s\S]*?\[END OF DOCUMENT CONTEXT\]/g, '');
    
    // 2. Split by Markdown Image ![alt](url) OR File [alt](url)
    const regex = /(!?\[[^\]]*\]\([^)]+\))/g;
    const parts = cleanText.split(regex);
    
    return (
      <div className="text-[15px] leading-relaxed">
        {parts.map((part, i) => {
          
          const trimmedPart = part.trim();

          // A. Detect Image Markdown
          const imgMatch = trimmedPart.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            return (
              <div key={i} className="my-3 flex flex-col items-start">
                <img 
                  src={imgMatch[2]} 
                  alt={imgMatch[1]} 
                  className="w-full max-w-full sm:max-w-md h-auto rounded-lg border border-black/10 dark:border-white/10 shadow-sm object-contain bg-white dark:bg-zinc-900" 
                  loading="lazy"
                />
              </div>
            );
          }
          
          // B. Detect File/Document Markdown
          const fileMatch = trimmedPart.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
          if (fileMatch) {
            let displayName = fileMatch[1];
            const fileUrl = fileMatch[2];
            const isOptimistic = fileUrl === 'attachment';

            // Clean up the display name if it says "Attached File" but we have a real Cloudinary URL
            if (!isOptimistic && (displayName.includes('Attached File') || displayName.includes('Attached Document'))) {
                const urlParts = fileUrl.split('/');
                const lastSegment = urlParts[urlParts.length - 1].split('?')[0];
                if (lastSegment && lastSegment.includes('.')) {
                    displayName = lastSegment; // Shows the actual filename (e.g. document.pdf)
                }
            }

            return (
              <div key={i} className="my-2">
                <a 
                  href={isOptimistic ? '#' : fileUrl} 
                  target={isOptimistic ? '_self' : '_blank'} 
                  rel="noopener noreferrer" 
                  onClick={(e) => isOptimistic && e.preventDefault()}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg text-sm font-medium transition-colors break-all ${isOptimistic ? 'opacity-70 cursor-wait' : 'hover:bg-black/10 dark:hover:bg-white/20'}`}
                >
                  <FileText size={16} className={isUser ? "text-white dark:text-zinc-900 shrink-0" : "text-blue-600 dark:text-blue-400 shrink-0"} /> 
                  <span className="truncate">{displayName}</span>
                </a>
              </div>
            );
          }
          
          // C. Regular Text
          return <span key={i} className="whitespace-pre-wrap font-inter">{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-6 font-inter ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col w-full max-w-[95%] md:max-w-[85%] lg:max-w-[75%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className={`
          px-4 py-3.5 rounded-xl w-fit max-w-full min-w-0 overflow-hidden shadow-sm border
          ${isUser 
            ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' 
            : 'bg-white border-zinc-200 text-zinc-900 dark:bg-[#0c0c0e] dark:border-zinc-800 dark:text-zinc-100'
          }
        `}>
          
          {isUser ? (
            isEditing ? (
              <div className="flex flex-col gap-3 w-full sm:w-[400px] max-w-full">
                <textarea 
                  value={editValue} 
                  onChange={(e) => setEditValue(e.target.value)} 
                  className="w-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg p-3 text-sm outline-none resize-y min-h-[100px] text-white dark:text-zinc-900 focus:border-blue-500 transition-colors" 
                  placeholder="Edit your message..."
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1.5 font-medium rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={() => { onEditSubmit(index, editValue); setIsEditing(false); }} className="text-xs px-3 py-1.5 font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-blue-700">Save & Send</button>
                </div>
              </div>
            ) : (
              renderUserMessage(m.content)
            )
          ) : (
            <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed break-words prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-img:rounded-lg prose-img:border prose-img:border-zinc-200 dark:prose-img:border-zinc-800 font-inter">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      const codeText = extractTextFromNode(children);
                      return (
                        <div className="my-5 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-[#0d0d0d] shadow-sm font-sans w-full">
                          <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-zinc-800">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <Terminal size={14} />
                              <span className="text-xs font-mono font-medium">{match[1]}</span>
                            </div>
                            <CodeCopyButton text={codeText} />
                          </div>
                          <div className="p-4 overflow-x-auto text-[13px] sm:text-[14px]">
                            <code className={className} {...props}>{children}</code>
                          </div>
                        </div>
                      );
                    }
                    return <code className="bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 px-1.5 py-0.5 rounded-md font-mono text-[13px] text-blue-600 dark:text-blue-400" {...props}>{children}</code>;
                  },
                  img({node, ...props}) {
                    return <img {...props} className="w-full max-w-full sm:max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm my-4 object-contain" loading="lazy" />;
                  },
                  a({node, ...props}) {
                    return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all" />;
                  },
                  p({children}) {
                    return <p className="mb-4 last:mb-0">{children}</p>;
                  },
                  ul({children}) {
                    return <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>;
                  },
                  ol({children}) {
                    return <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>;
                  }
                }}
              >
                {preprocessMath(displayedContent)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className={`flex items-center gap-1 mt-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {isUser ? (
            !isEditing && (
              <button 
                onClick={() => { setEditValue(m.content); setIsEditing(true); }} 
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Edit message"
              >
                <PenLine size={14} />
              </button>
            )
          ) : (
            <>
              <button 
                onClick={() => { navigator.clipboard.writeText(extractTextFromNode(displayedContent)); toast.success("Copied to clipboard"); }} 
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Copy message"
              >
                <Copy size={14} />
              </button>
              {isLast && !loading && !isTypingGlobal && (
                <button 
                  onClick={onRegenerate} 
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Regenerate response"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}