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

  return (
    <div className={`group flex flex-col md:flex-row border-b border-slate-200 transition-colors duration-300 ${isLocked ? 'bg-slate-50' : 'bg-white'}`}>
      {/* Left: Step Indicator */}
      <div className="w-full md:w-16 p-4 flex md:flex-col items-center md:items-start justify-between md:justify-start text-slate-400 font-mono text-sm select-none border-b md:border-b-0 md:border-r border-slate-100">
        <span className={isLocked ? "text-slate-400" : "text-brand-600 font-bold"}>
          {String(row.stepNumber).padStart(2, '0')}
        </span>
        {row.depthScore && (
          <div className="flex items-center gap-1 mt-2 text-xs" title="Depth Score">
             <span className={`w-2 h-2 rounded-full ${
               row.depthScore >= 8 ? 'bg-green-500' : 
               row.depthScore >= 5 ? 'bg-yellow-500' : 'bg-red-400'
             }`}></span>
             <span>{row.depthScore}/10</span>
          </div>
        )}
      </div>

      {/* Middle: User Input */}
      <div className="flex-1 p-4 relative">
        <textarea
          ref={textareaRef}
          value={row.content}
          onChange={(e) => onChange(row.id, e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
          placeholder={isLast ? "Describe your next engineering step... (Enter to submit)" : ""}
          className={`w-full bg-transparent resize-none outline-none font-mono text-slate-800 text-sm md:text-base placeholder:text-slate-300 leading-relaxed ${isLocked ? 'cursor-default' : ''}`}
          rows={1}
        />
        {row.status === RowStatus.Active && (
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-brand-400 font-medium px-2 py-1 bg-brand-50 rounded border border-brand-100">
              ⏎ to Analyze
            </span>
          </div>
        )}
      </div>

      {/* Right: AI Interrogation */}
      <div className={`w-full md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-slate-100 transition-all duration-500 ${row.aiInterrogation ? 'bg-brand-50/30' : ''}`}>
        {row.status === RowStatus.Analyzing && (
          <div className="flex items-center gap-2 text-brand-600 text-sm font-medium animate-pulse">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Reviewing logic...
          </div>
        )}
        
        {row.aiInterrogation && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="flex items-start gap-2">
              <span className="mt-1 text-brand-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </span>
              <div>
                <p className="text-sm text-brand-900 font-medium leading-relaxed">
                  {row.aiInterrogation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
