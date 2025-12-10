import React, { useEffect, useRef } from 'react';
import { ReasoningRow, RowStatus } from '../types';

interface WorksheetRowProps {
  row: ReasoningRow;
  onChange: (id: string, value: string) => void;
  onSubmit: (id: string) => void;
  isLast: boolean;
  autoFocus?: boolean;
}

export const WorksheetRow: React.FC<WorksheetRowProps> = ({
  row,
  onChange,
  onSubmit,
  isLast,
  autoFocus
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current && row.status === RowStatus.Active) {
      textareaRef.current.focus();
    }
  }, [autoFocus, row.status]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [row.content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (row.content.trim().length > 0) {
        onSubmit(row.id);
      }
    }
  };

  const isLocked = row.status === RowStatus.Completed || row.status === RowStatus.Analyzing || row.status === RowStatus.Locked;
  const isActive = row.status === RowStatus.Active;

  return (
    <div className={`relative flex gap-6 md:gap-8 pb-8 ${isLast ? 'last-item' : ''}`}>
      {/* Timeline Connector */}
      <div className="timeline-line"></div>

      {/* Left: Step Indicator */}
      <div className="relative z-10 shrink-0 flex flex-col items-center w-16 pt-2">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full border-2 font-mono text-sm transition-all duration-300
          ${isActive 
            ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110' 
            : 'bg-white border-brand-200 text-brand-400'}
        `}>
          {String(row.stepNumber).padStart(2, '0')}
        </div>
        
        {row.depthScore && !isActive && (
          <div className="mt-2 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
             <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
               row.depthScore >= 8 ? 'text-brand-600' : 
               row.depthScore >= 5 ? 'text-brand-400' : 'text-slate-400'
             }`}>Depth</div>
             <div className={`text-sm font-black ${
               row.depthScore >= 8 ? 'text-brand-700' : 'text-slate-500'
             }`}>{row.depthScore}/10</div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`flex-1 grid md:grid-cols-2 gap-6 items-start ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
        
        {/* User Input */}
        <div className={`
          relative rounded-xl border p-5 transition-all duration-300
          ${isActive 
            ? 'bg-white border-brand-300 shadow-xl shadow-brand-100 ring-4 ring-brand-50' 
            : 'bg-white border-brand-100 shadow-sm'}
        `}>
          <textarea
            ref={textareaRef}
            value={row.content}
            onChange={(e) => onChange(row.id, e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLocked}
            placeholder={isLast ? "Example: I'll use Redis for the hot cache due to..." : ""}
            className={`w-full bg-transparent resize-none outline-none font-mono text-sm md:text-base leading-relaxed
              ${isLocked ? 'text-brand-900 cursor-default' : 'text-brand-950 placeholder:text-brand-200'}
            `}
            rows={1}
            spellCheck={false}
          />
          {isActive && (
             <div className="absolute right-3 bottom-3 text-[10px] text-brand-300 font-mono border border-brand-100 rounded px-1.5 py-0.5 bg-brand-50">
               PRESS ENTER
             </div>
          )}
        </div>

        {/* AI Interrogation */}
        <div className="pt-2">
           {row.status === RowStatus.Analyzing && (
            <div className="flex items-center gap-3 text-brand-500 font-medium animate-pulse">
              <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
              <span className="text-sm">Principal Engineer is reviewing...</span>
            </div>
           )}

           {row.aiInterrogation && (
             <div className="relative animate-in fade-in slide-in-from-left-4 duration-500">
               {/* Speech Bubble Arrow */}
               <div className="absolute top-6 -left-2 w-4 h-4 bg-brand-50 border-l border-b border-brand-200 transform rotate-45 hidden md:block"></div>
               
               <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 text-brand-900 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">Interrogation</span>
                 </div>
                 <p className="font-medium leading-relaxed text-sm">
                   "{row.aiInterrogation}"
                 </p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};