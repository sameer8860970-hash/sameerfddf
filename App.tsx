import React, { useState, useEffect } from 'react';
import { ReasoningRow, RowStatus, Challenge, SessionResult } from './types';
import { WorksheetRow } from './components/WorksheetRow';
import { SessionReport } from './components/SessionReport';
import { getSuggestedChallenges, interrogateRow, evaluateSession } from './services/geminiService';

// Safe UUID generator
const safeUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const App: React.FC = () => {
  const [apiKey] = useState<string | undefined>(process.env.API_KEY);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  
  const [rows, setRows] = useState<ReasoningRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey) {
      setIsLoading(true);
      getSuggestedChallenges()
        .then(data => {
            if (data && data.length > 0) {
                setChallenges(data);
            }
        })
        .catch(err => {
            console.error("Initialization error:", err);
            setInitError("Failed to load challenges.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [apiKey]);

  const startChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setSessionResult(null);
    setRows([
      {
        id: safeUUID(),
        stepNumber: 1,
        content: '',
        aiInterrogation: null,
        status: RowStatus.Active
      }
    ]);
  };

  const updateRow = (id: string, content: string) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, content } : row));
  };

  const submitRow = async (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row || !activeChallenge) return;
    if (row.status !== RowStatus.Active) return;

    setRows(prev => prev.map(r => r.id === id ? { ...r, status: RowStatus.Analyzing } : r));

    try {
      const previousRows = rows.filter(r => r.stepNumber < row.stepNumber);
      const analysis = await interrogateRow(row.content, previousRows, activeChallenge);

      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        status: RowStatus.Completed,
        aiInterrogation: analysis.text,
        depthScore: analysis.depthScore
      } : r));

      const newRow: ReasoningRow = {
        id: safeUUID(),
        stepNumber: row.stepNumber + 1,
        content: '',
        aiInterrogation: null,
        status: RowStatus.Active
      };

      setRows(prev => [...prev, newRow]);

    } catch (error) {
      console.error(error);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: RowStatus.Active } : r));
      alert("Something went wrong analyzing your step. Please try again.");
    }
  };

  const finishSession = async () => {
    if (!activeChallenge) return;
    setIsLoading(true);
    
    const validRows = rows.filter(r => r.status === RowStatus.Completed || r.content.trim().length > 0);
    
    try {
      const result = await evaluateSession(validRows, activeChallenge);
      setSessionResult(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center border border-brand-200 shadow-xl">
            <h2 className="text-xl font-bold text-brand-900 mb-4">Configuration Error</h2>
            <p className="text-brand-700 mb-4">API Key is missing.</p>
        </div>
      </div>
    );
  }

  // 1. Landing / Challenge Selection
  if (!activeChallenge) {
    return (
      <div className="min-h-screen bg-white relative font-sans text-slate-900 selection:bg-brand-100">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f7ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f7ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 py-24 relative z-10">
          <header className="mb-20 text-center">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 font-mono text-xs font-semibold tracking-wider uppercase">
              System Design Interview Trainer
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-brand-950 tracking-tight mb-6">
              DeepThink <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">Canvas</span>
            </h1>
            <p className="text-xl text-brand-800/70 max-w-2xl mx-auto leading-relaxed">
              Demonstrate your engineering depth in real-time. An AI Principal Engineer interrogates your reasoning line-by-line.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-8">
            {isLoading && challenges.length === 0 ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="h-80 bg-brand-50/50 rounded-2xl animate-pulse border border-brand-100"></div>
               ))
            ) : (
              challenges.map((challenge, idx) => (
                <div 
                  key={challenge.id} 
                  onClick={() => startChallenge(challenge)}
                  className="group bg-white rounded-2xl p-8 border border-brand-100 hover:border-brand-300 shadow-sm hover:shadow-2xl hover:shadow-brand-200/50 transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-brand-300 text-5xl font-light opacity-30 group-hover:opacity-100 transition-opacity">
                      0{idx + 1}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border
                      ${challenge.difficulty === 'Principal' ? 'bg-brand-50 text-brand-700 border-brand-200' :
                        challenge.difficulty === 'Staff' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        'bg-slate-50 text-slate-500 border-slate-100'}
                    `}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-brand-950 mb-4 group-hover:text-brand-600 transition-colors">
                    {challenge.title}
                  </h3>
                  
                  <p className="text-brand-900/60 text-sm leading-relaxed mb-8 flex-grow">
                    {challenge.description}
                  </p>
                  
                  <div className="flex items-center text-brand-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Start Session
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {initError && (
              <div className="text-center mt-12 text-red-500 bg-red-50 inline-block px-4 py-2 rounded-lg mx-auto">
                  {initError} <button onClick={() => window.location.reload()} className="underline font-bold ml-2">Retry</button>
              </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Report View
  if (sessionResult) {
    return (
      <div className="min-h-screen bg-white py-12">
        <SessionReport 
          result={sessionResult} 
          challenge={activeChallenge} 
          onRestart={() => {
            setActiveChallenge(null);
            setRows([]);
            setSessionResult(null);
          }} 
        />
      </div>
    );
  }

  // 2. Active Worksheet View
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white/80 border-b border-brand-100 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div onClick={() => setActiveChallenge(null)} className="cursor-pointer font-bold text-lg text-brand-950 tracking-tight flex items-center gap-2">
               <span className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center text-white text-xs font-mono">DT</span>
               DeepThink
             </div>
             <div className="hidden md:flex items-center text-sm gap-2 px-3 py-1 bg-brand-50 rounded-full border border-brand-100">
               <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
               <span className="text-brand-900 font-medium">{activeChallenge.title}</span>
             </div>
          </div>
          <button 
            onClick={finishSession}
            disabled={isLoading || rows.filter(r => r.status === RowStatus.Completed).length < 2}
            className="px-5 py-2 bg-brand-950 text-white text-sm font-medium rounded-lg hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-900/20"
          >
            {isLoading ? 'Grading Session...' : 'Submit Session'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-8">
        
        {/* Context Card */}
        <div className="mb-8 p-6 bg-brand-50/50 rounded-xl border border-brand-100/50 flex flex-col md:flex-row gap-6 items-start">
           <div className="w-full md:w-2/3">
             <h3 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Technical Context</h3>
             <p className="text-brand-950 font-medium leading-relaxed font-mono text-sm">
               {activeChallenge.context}
             </p>
           </div>
           <div className="w-full md:w-1/3 text-xs text-brand-500 bg-white p-4 rounded-lg border border-brand-100 shadow-sm">
             <span className="font-bold block mb-1">Instructions:</span>
             Type your engineering approach step-by-step. The AI will challenge your trade-offs in real-time.
           </div>
        </div>

        {/* Canvas Area */}
        <div className="space-y-0 relative">
          {rows.map((row, index) => (
            <WorksheetRow
              key={row.id}
              row={row}
              onChange={updateRow}
              onSubmit={submitRow}
              isLast={index === rows.length - 1}
              autoFocus={index === rows.length - 1}
            />
          ))}
          
          <div className="h-32"></div>
        </div>
      </main>
    </div>
  );
};

export default App;