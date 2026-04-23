'use client'

import React, { useState, useRef } from 'react'
import { 
  BookOpen, ArrowRight, X, Square, 
  Loader2, Zap, ShieldCheck, Database, Cloud, Paperclip
} from 'lucide-react'

const SUGGESTIONS = [
  { subject: 'Operating Systems', level: 'Expert', icon: <Database size={14} className="text-blue-500" /> },
  { subject: 'Cloud Architecture', level: 'Intermediate', icon: <Cloud size={14} className="text-blue-500" /> },
  { subject: 'Web Security', level: 'Intermediate', icon: <ShieldCheck size={14} className="text-blue-500" /> },
  { subject: 'Data Science', level: 'Beginner', icon: <Zap size={14} className="text-blue-500" /> },
];

export const WelcomeHero = ({ 
  onInitSubmit, 
  loading, 
  isUploading, 
  onStop, 
  uploadedFiles, 
  removeFile,
  setUploadedFiles 
}: any) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [query, setQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestion = (s: any) => {
    setSelectedTopic(s.subject);
    setSelectedLevel(s.level);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && setUploadedFiles) {
      setUploadedFiles((prev: File[]) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isUploading) return;
    const formData = new FormData();
    formData.append('subject', selectedTopic);
    formData.append('level', selectedLevel);
    formData.append('question', query);
    onInitSubmit(e, uploadedFiles, formData);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto font-inter bg-transparent w-full min-w-0">
      
      <div className="w-full max-w-3xl space-y-8 md:space-y-10 animate-in fade-in duration-500 min-w-0">
        
        {/* Header Text */}
        <div className="text-center space-y-3 sm:space-y-3 w-full min-w-0 px-2">
           {/* 🚀 FIXED: Removed truncate, added leading-tight for proper mobile wrapping */}
           <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight break-words">
             What do you want to <span className="text-blue-600 dark:text-blue-500">learn?</span>
           </h1>
           <p className="text-[14px] sm:text-[15px] text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto font-medium break-words leading-relaxed">
             Enter a subject and your specific goals to generate a personalized, interactive study roadmap.
           </p>
        </div>

        {/* Main Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl p-5 sm:p-6 md:p-8 w-full min-w-0 flex flex-col"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-6 w-full min-w-0">
            
            {/* Subject Input */}
            <div className="space-y-2 min-w-0">
              <label className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <div className="relative w-full min-w-0">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                <input 
                  required 
                  name="subject" 
                  placeholder="e.g., Quantum Physics" 
                  value={selectedTopic} 
                  onChange={(e) => setSelectedTopic(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-[14px] outline-none transition-all dark:text-white placeholder:text-zinc-500 min-w-0" 
                />
              </div>
            </div>

            {/* Experience Level Toggle */}
            <div className="space-y-2 min-w-0">
              <label className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                Experience Level
              </label>
              <div className="flex p-1 bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full min-w-0 overflow-x-auto no-scrollbar">
                 {['Beginner', 'Intermediate', 'Expert'].map((lvl) => (
                   <button 
                     key={lvl} 
                     type="button" 
                     onClick={() => setSelectedLevel(lvl)} 
                     className={`flex-1 py-1.5 px-2 rounded-md text-[13px] font-medium transition-colors min-w-[80px] shrink-0 ${selectedLevel === lvl ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 border border-transparent'}`}
                   >
                     {lvl}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Goal / Question Textarea */}
          <div className="space-y-2 mb-6 w-full min-w-0">
             <label className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
               Specific Goals or Questions
             </label>
             <div className="relative flex flex-col bg-zinc-50 dark:bg-[#111113] border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-lg transition-all w-full min-w-0">
               <textarea 
                 required 
                 name="question" 
                 placeholder="Describe exactly what you want to master..." 
                 value={query} 
                 onChange={(e) => setQuery(e.target.value)} 
                 className="w-full min-h-[100px] p-3.5 bg-transparent text-[14px] outline-none dark:text-white resize-y placeholder:text-zinc-500 min-w-0" 
               />
               
               {/* Toolbar for Textarea */}
               <div className="flex items-center justify-between px-2 pb-2">
                 <input 
                   type="file" 
                   multiple 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleFileSelect} 
                 />
               </div>
               
               {/* Uploaded Files Preview */}
               {uploadedFiles?.length > 0 && (
                 <div className="px-3 pb-3 flex flex-wrap gap-2 w-full min-w-0 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                   {uploadedFiles.map((file: any, idx: number) => (
                     <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm max-w-full min-w-0">
                        <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                           <X size={12} />
                        </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-5 pt-5 border-t border-zinc-200 dark:border-zinc-800/80 w-full min-w-0">
            
            {/* Quick Suggestions */}
            <div className="w-full sm:w-auto min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2">Suggestions</span>
              <div className="flex flex-wrap gap-2 w-full min-w-0">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => handleSuggestion(s)} 
                    disabled={loading || isUploading} 
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 dark:bg-[#111113] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 rounded-md text-[12px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {s.icon} {s.subject}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <button 
              type={isUploading || loading ? "button" : "submit"} 
              onClick={() => { if (isUploading || loading) onStop(); }}
              className="w-full sm:w-auto min-w-[160px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 shrink-0 border border-blue-700 shadow-sm"
            >
              {isUploading ? (
                <><Square size={14} className="fill-current" /><span>Cancel Upload</span></>
              ) : loading ? (
                <><Loader2 size={16} className="animate-spin" /><span>Starting...</span></>
              ) : (
                <><span>Start Learning</span><ArrowRight size={16} /></>
              )}
            </button>

          </div>
        </form>

      </div>
    </div>
  )
}