
import React, { useState, useMemo } from 'react';
import { Sparkles, Loader2, CheckCircle2, X, AlertTriangle, ArrowRight, Save, Trash2, Search, Wand2, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardState, Project, CardType, Character, Location, StoryCard } from './types';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
  onSync: () => Promise<void>;
}

interface Suggestion {
  id: string;
  path: string; // e.g., 'cards.id123.description'
  original: string;
  suggested: string;
  reason: string;
  hash: string;
  selected: boolean;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
};

const AICleanup: React.FC<Props> = ({ state, onUpdateState, onSync }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [summaryCount, setSummaryCount] = useState<number | null>(null);

  const activeProject = state.projects[state.activeProjectId];

  const handleScan = async () => {
    setIsScanning(true);
    setSuggestions([]);
    setSummaryCount(null);

    try {
      // 1. Prepare Data Payload
      // Fixed: Cast Object.values results to fix property access on unknown types
      const payload: any = {
        projectName: activeProject.name,
        planning: activeProject.planning,
        characters: (Object.values(activeProject.characters || {}) as Character[]).map(c => ({
          id: c.id,
          name: c.name,
          oneSentence: c.oneSentence,
          primalGoal: c.primalGoal,
          saveTheCatMoment: c.saveTheCatMoment,
          signaturePhrases: c.signaturePhrases
        })),
        locations: (Object.values(activeProject.locations || {}) as Location[]).map(l => ({
          id: l.id,
          name: l.name,
          description: l.description,
          significance: l.significance
        })),
        cards: (Object.values(activeProject.cards || {}) as StoryCard[]).map(c => ({
          id: c.id,
          title: c.title,
          description: c.description,
          conflict: c.conflict
        }))
      };

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this storyboard project data for spelling, grammar, and punctuation errors. Return a JSON array of suggestions.
        Focus strictly on errors. Avoid changing the creative tone unless it's objectively wrong.
        Project Data: ${JSON.stringify(payload)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING, description: "Dot notation path to the property like 'cards.ID.description'" },
                original: { type: Type.STRING, description: "The segment containing the error" },
                suggested: { type: Type.STRING, description: "The corrected segment" },
                reason: { type: Type.STRING, description: "Brief explanation of the fix" }
              },
              required: ["path", "original", "suggested", "reason"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || '[]');
      
      const ignoredHashes = state.ignoredCleanupHashes || [];
      const filteredResults = results
        .map((r: any) => {
          const hash = hashString(`${r.path}:${r.original}:${r.suggested}`);
          return { ...r, id: Math.random().toString(36).substr(2, 9), hash, selected: true };
        })
        .filter((r: any) => !ignoredHashes.includes(r.hash));

      setSuggestions(filteredResults);
      setShowResults(true);
    } catch (err) {
      console.error("Cleanup Scan Failed", err);
      alert("AI Scan failed. Please check your connection and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    const selected = suggestions.filter(s => s.selected);
    const unselectedHashes = suggestions.filter(s => !s.selected).map(s => s.hash);

    const newState = JSON.parse(JSON.stringify(state)) as StoryboardState;
    const project = newState.projects[newState.activeProjectId];

    // Apply selected changes
    selected.forEach(s => {
      const parts = s.path.split('.');
      let current: any = project;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
        if (!current) break;
      }
      if (current && typeof current[parts[parts.length - 1]] === 'string') {
        const field = parts[parts.length - 1];
        // Replace the specific original text in the field if it exists
        current[field] = current[field].replace(s.original, s.suggested);
      }
    });

    // Save ignored hashes
    const existingIgnored = newState.ignoredCleanupHashes || [];
    newState.ignoredCleanupHashes = [...new Set([...existingIgnored, ...unselectedHashes])];
    
    onUpdateState(newState);
    setSummaryCount(selected.length);
    
    // Sync to cloud
    await onSync();
    
    setIsApplying(false);
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-40">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm text-center space-y-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center shadow-xl shadow-indigo-100 animate-pulse">
            <Sparkles size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Narrative Cleanup</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Precision Structural Auditing</p>
          </div>
        </div>

        <p className="text-xl text-slate-500 font-desc italic max-w-2xl mx-auto">
          Scan your entire project for spelling errors, grammar slips, and punctuation inconsistencies. Our Writing Mentor will suggest refinements while preserving your unique voice.
        </p>

        <div className="pt-6">
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="group relative bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition-all flex items-center gap-4 mx-auto shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Wand2 className="group-hover:rotate-12 transition-transform" size={20} />
            )}
            {isScanning ? 'Analyzing Narrative Structure...' : 'Initiate Project Scan'}
          </button>
        </div>

        {summaryCount !== null && (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center justify-center gap-4 text-emerald-700 animate-in zoom-in-95 duration-300">
            <CheckCircle2 size={24} />
            <span className="font-bold text-lg">Successfully applied {summaryCount} narrative refinements!</span>
          </div>
        )}
      </div>

      {showResults && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowResults(false)}></div>
          <div className="relative bg-white w-full max-w-5xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            
            <header className="p-8 border-b flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Review Suggestions</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{suggestions.length} Improvements Identified</p>
                </div>
              </div>
              <button onClick={() => setShowResults(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 space-y-6 custom-scrollbar">
              {suggestions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <CheckCircle2 size={64} className="text-emerald-500" />
                  <p className="text-2xl font-bold">Your narrative is already perfect!</p>
                  <p className="font-desc italic">No errors were found in the current project.</p>
                </div>
              ) : (
                suggestions.map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => {
                      setSuggestions(prev => prev.map(item => item.id === s.id ? { ...item, selected: !item.selected } : item));
                    }}
                    className={`p-8 rounded-3xl border-2 transition-all cursor-pointer flex items-start gap-6 ${s.selected ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50/50 border-slate-100 grayscale'}`}
                  >
                    <div className={`mt-1 transition-colors ${s.selected ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {s.selected ? <CheckSquare size={24} /> : <Square size={24} />}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-white px-3 py-1 rounded-full border border-indigo-100">Path: {s.path}</span>
                        <span className="text-xs font-bold text-slate-400 italic">"{s.reason}"</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Original</span>
                          <p className="text-sm font-desc italic text-slate-500 line-through decoration-rose-400/50">{s.original}</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <ArrowRight className="text-slate-300 shrink-0" size={20} />
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Corrected</span>
                            <p className="text-sm font-bold text-slate-900">{s.suggested}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <footer className="p-8 border-t bg-slate-50 flex items-center justify-between">
               <div className="text-slate-400 text-sm font-medium">
                {suggestions.filter(s => s.selected).length} corrections selected to apply.
               </div>
               <div className="flex items-center gap-4">
                 <button onClick={() => setShowResults(false)} className="px-8 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-white transition-all">Cancel</button>
                 <button 
                  onClick={handleApply}
                  disabled={isApplying || suggestions.filter(s => s.selected).length === 0}
                  className="bg-indigo-600 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:opacity-50"
                 >
                   {isApplying ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   Apply Selected Refinements
                 </button>
               </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICleanup;
