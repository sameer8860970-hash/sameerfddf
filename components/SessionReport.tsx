import React from 'react';
import { SessionResult, Challenge } from '../types';

interface SessionReportProps {
  result: SessionResult;
  challenge: Challenge;
  onRestart: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({ result, challenge, onRestart }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 animate-in fade-in zoom-in-95 duration-700">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-brand-950 mb-2">Technical Review</h2>
        <p className="text-brand-500 font-mono text-sm uppercase tracking-widest">{challenge.title}</p>
      </div>

      <div className="glass-panel bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-brand-100 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-12 border-b border-brand-50 pb-12">
           <div className="flex-1">
              <h3 className="text-sm font-bold text-brand-400 uppercase tracking-wider mb-4">Executive Summary</h3>
              <p className="text-lg text-brand-900 leading-relaxed font-light">
                {result.summary}
              </p>
           </div>
           
           {/* Score Circle */}
           <div className="relative shrink-0">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-brand-50" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * result.score) / 100} className="text-brand-600 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-brand-900">{result.score}</span>
                <span className="text-xs font-bold text-brand-400 uppercase">Score</span>
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="flex items-center gap-2 text-brand-700 font-bold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Key Strengths
            </h3>
            <ul className="space-y-4">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-brand-900 text-sm p-3 bg-brand-50/50 rounded-lg border border-brand-50">
                  <span className="text-brand-500 font-mono font-bold">0{i+1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-brand-700 font-bold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Growth Areas
            </h3>
            <ul className="space-y-4">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-3 text-slate-700 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-mono font-bold">0{i+1}</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 bg-brand-950 text-white font-semibold rounded-xl hover:bg-brand-900 transition-all shadow-lg shadow-brand-900/10 transform active:scale-[0.99]"
        >
          Start New Challenge
        </button>
      </div>
    </div>
  );
};