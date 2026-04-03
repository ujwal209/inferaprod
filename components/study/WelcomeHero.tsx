'use client'

import React, { useState } from 'react'
import { 
  BookOpen, ArrowRight, X, Square, 
  Loader2, Zap, ShieldCheck, Database, Cloud
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
  removeFile 
}: any) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [query, setQuery] = useState('');

  const handleSuggestion = (s: any) => {
    setSelectedTopic(s.subject);
    setSelectedLevel(s.level);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('subject', selectedTopic);
    formData.append('level', selectedLevel);
    formData.append('question', query);
    onInitSubmit(e, uploadedFiles, formData);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto font-outfit bg-[#fafafa] dark:bg-[#050505]">
      
      <div className="w-full max-w-3xl space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Text */}
        <div className="text-center space-y-3 sm:space-y-4">
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white">
             What do you want to <span className="text-blue-600 dark:text-blue-500">learn?</span>
           </h1>
           <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto font-medium">
             Enter a subject and your specific goals to generate a personalized, interactive study roadmap.
           </p>
        </div>

        {/* Main Form */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800/80 shadow-sm rounded-2xl p-5 sm:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Subject Input */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  required 
                  name="subject" 
                  placeholder="e.g., Quantum Physics" 
                  value={selectedTopic} 
                  onChange={(e) => setSelectedTopic(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm outline-none transition-all dark:text-white placeholder:text-zinc-400" 
                />
              </div>
            </div>

            {/* Experience Level Toggle */}
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                Experience Level
              </label>
              <div className="flex p-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                 {['Beginner', 'Intermediate', 'Expert'].map((lvl) => (
                   <button 
                     key={lvl} 
                     type="button" 
                     onClick={() => setSelectedLevel(lvl)} 
                     className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all ${selectedLevel === lvl ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 border border-transparent'}`}
                   >
                     {lvl}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Goal / Question Textarea */}
          <div className="space-y-2 mb-6">
             <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
               Specific Goals or Questions
             </label>
             <div className="relative flex flex-col bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-lg transition-all">
               <textarea 
                 required 
                 name="question" 
                 placeholder="Describe exactly what you want to master..." 
                 value={query} 
                 onChange={(e) => setQuery(e.target.value)} 
                 className="w-full min-h-[100px] p-3.5 bg-transparent text-sm outline-none dark:text-white resize-none placeholder:text-zinc-400" 
               />
               
               {/* Uploaded Files Preview */}
               {uploadedFiles?.length > 0 && (
                 <div className="p-3 pt-0 flex flex-wrap gap-2">
                   {uploadedFiles.map((file: any, idx: number) => (
                     <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-sm">
                        <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-zinc-400 hover:text-red-500 transition-colors">
                           <X size={12} />
                        </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
            
            {/* Quick Suggestions */}
            <div className="w-full sm:w-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2 sm:mb-1.5">Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    onClick={() => handleSuggestion(s)} 
                    disabled={loading || isUploading} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[12px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
              className="w-full sm:w-auto min-w-[160px] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
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