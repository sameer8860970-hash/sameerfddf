import React from 'react';
import { SessionResult, Challenge } from '../types';

interface SessionReportProps {
  result: SessionResult;
  challenge: Challenge;
  onRestart: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({ result, challenge, onRestart }) => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass-panel rounded-2xl p-8 shadow-2xl border-t-4 border-brand-600">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">Session Analysis</h2>
            <p className="text-slate-500">{challenge.title} • {challenge.difficulty}</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100">
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Technical Score</div>
              <div className="text-4xl font-black text-brand-600">{result.score}/100</div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Summary
          </h3>
          <p className="text-slate-700 leading-relaxed bg-brand-50/50 p-4 rounded-lg border border-brand-100">
            {result.summary}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Strengths
            </h3>
            <ul className="space-y-3">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                  <span className="mt-1 text-green-500 text-xs">●</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                  <span className="mt-1 text-orange-500 text-xs">●</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Start New Challenge
        </button>
      </div>
    </div>
  );
};
