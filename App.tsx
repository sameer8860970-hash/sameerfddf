import React, { useState, useEffect, useCallback } from 'react';
import { ReasoningRow, RowStatus, Challenge, SessionResult } from './types';
import { WorksheetRow } from './components/WorksheetRow';
import { SessionReport } from './components/SessionReport';
import { getSuggestedChallenges, interrogateRow, evaluateSession } from './services/geminiService';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | undefined>(process.env.API_KEY);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  
  const [rows, setRows] = useState<ReasoningRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    // Initial load of challenges
    if (apiKey) {
      setIsLoading(true);
      getSuggestedChallenges()
        .then(setChallenges)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [apiKey]);

  const startChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setSessionResult(null);
    setRows([
      {
        id: crypto.randomUUID(),
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

    // 1. Lock current row and set to analyzing
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: RowStatus.Analyzing } : r));

    try {
      // 2. Call AI
      const previousRows = rows.filter(r => r.stepNumber < row.stepNumber);
      const analysis = await interrogateRow(row.content, previousRows, activeChallenge);

      // 3. Update row with analysis
      setRows(prev => prev.map(r => r.id === id ? {
        ...r,
        status: RowStatus.Completed,
        aiInterrogation: analysis.text,
        depthScore: analysis.depthScore
      } : r));

      // 4. Create next row
      const newRow: ReasoningRow = {
        id: crypto.randomUUID(),
        stepNumber: row.stepNumber + 1,
        content: '',
        aiInterrogation: null,
        status: RowStatus.Active
      };

      setRows(prev => [...prev, newRow]);

    } catch (error) {
      console.error(error);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: RowStatus.Active } : r));
    }
  };

  const finishSession = async () => {
    if (!activeChallenge) return;
    setIsLoading(true);
    
    // Remove the last empty active row if it exists
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4">API Key Required</h2>
            <p className="text-slate-600 mb-4">Please configure the environment variable correctly.</p>
        </div>
      </div>
    );
  }

  // 1. Landing / Challenge Selection
  if (!activeChallenge) {
    return (
      <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-100 to-transparent -z-10 opacity-50"></div>
        
        <div className="max-w-5xl mx-auto px-6 py-20">
          <header className="mb-16 text-center">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              DeepThink <span className="text-brand-600">Canvas</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Test your engineering intuition. An AI Principal Engineer watches every line you write and interrogates your reasoning in real-time.
            </p>
          </header>

          <div className="grid md:grid-cols-3 gap-6">
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="h-64 bg-white/50 rounded-xl animate-pulse border border-slate-200"></div>
               ))
            ) : (
              challenges.map(challenge => (
                <div 
                  key={challenge.id} 
                  onClick={() => startChallenge(challenge)}
                  className="group bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide
                      ${challenge.difficulty === 'Principal' ? 'bg-purple-100 text-purple-700' :
                        challenge.difficulty === 'Staff' ? 'bg-brand-100 text-brand-700' :
                        'bg-slate-100 text-slate-700'}
                    `}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-brand-600 transition-colors">
                    {challenge.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {challenge.description}
                  </p>
                  <div className="flex items-center text-brand-600 text-sm font-medium">
                    Start Challenge 
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Report View
  if (sessionResult) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div onClick={() => setActiveChallenge(null)} className="cursor-pointer font-bold text-xl text-slate-900">
               DeepThink <span className="text-brand-600">Canvas</span>
             </div>
             <div className="h-6 w-px bg-slate-300 mx-2 hidden md:block"></div>
             <div className="text-sm hidden md:block">
               <span className="text-slate-500">Challenge:</span> <span className="font-medium text-slate-800">{activeChallenge.title}</span>
             </div>
          </div>
          <button 
            onClick={finishSession}
            disabled={isLoading || rows.filter(r => r.status === RowStatus.Completed).length < 2}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Grading...' : 'Complete Session'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
          
          {/* Instructions Banner */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Context</h3>
            <p className="text-slate-800 font-medium leading-relaxed">
              {activeChallenge.context}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Start typing your solution below. Press <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">Enter</kbd> to submit a line for analysis.
            </p>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-y-auto">
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
            
            {/* Empty State / Bottom Padding */}
            {rows.length === 0 && (
               <div className="p-12 text-center text-slate-400">
                 Initializing workspace...
               </div>
            )}
            <div className="h-32"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
