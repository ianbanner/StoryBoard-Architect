import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, Save, Trash2, Plus, Sparkles, AlertCircle, 
  ShieldCheck, ChevronRight, Edit3, Play, Loader2, X, 
  Cpu, MessageSquare, Database, FileJson, BrainCircuit
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AIScript, Project, Character, Location, StoryCard } from './types';
import { TabButton } from './CommonUI';

interface Props {
  project: Project;
  scripts: Record<string, AIScript>;
  onUpdateScripts: (updated: Record<string, AIScript>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const AIScriptsEditor: React.FC<Props> = ({ project, scripts = {}, onUpdateScripts }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Execution State
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const resultEndRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    const id = generateId();
    const newScript: AIScript = {
      id,
      title: "New Logic Unit",
      content: "Define the behavioral parameters here..."
    };
    onUpdateScripts({ ...scripts, [id]: newScript });
    setEditingId(id);
  };

  const handleUpdate = (id: string, updates: Partial<AIScript>) => {
    onUpdateScripts({
      ...scripts,
      [id]: { ...scripts[id], ...updates }
    });
  };

  const handleDelete = (id: string) => {
    if (scripts[id]?.isDefault) {
      alert("The Master Persona cannot be deleted.");
      return;
    }
    if (!confirm("Remove this AI logic script?")) return;
    const newScripts = { ...scripts };
    delete newScripts[id];
    onUpdateScripts(newScripts);
    if (editingId === id) setEditingId(null);
  };

  const handleRunScript = async (script: AIScript) => {
    setExecutingId(script.id);
    setExecutionResult(null);
    setIsResultModalOpen(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Package project context for the AI
      const context = {
        projectName: project.name,
        planning: project.planning,
        // Fix: Explicitly cast Object.values to appropriate types to avoid 'unknown' errors
        characters: (Object.values(project.characters || {}) as Character[]).map(c => ({
            name: c.name,
            role: c.oneWord,
            bio: c.oneSentence,
            goals: c.primalGoal
        })),
        locations: (Object.values(project.locations || {}) as Location[]).map(l => ({
            name: l.name,
            description: l.description
        })),
        narrativeUnits: (Object.values(project.cards || {}) as StoryCard[]).map(c => ({
            title: c.title,
            beats: c.associatedBeats || [],
            description: c.description
        }))
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Execute your assigned Logic Script on the following project context. Provide a high-fidelity narrative audit or execution as instructed. 
        
        PROJECT DATA:
        ${JSON.stringify(context, null, 2)}`,
        config: {
          systemInstruction: script.content,
          temperature: 0.7,
        }
      });

      const text = response.text;
      setExecutionResult(text || "Execution completed with no output.");
    } catch (err: any) {
      setExecutionResult(`CRITICAL EXECUTION FAILURE: ${err.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  useEffect(() => {
    if (resultEndRef.current) resultEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [executionResult]);

  const scriptList = Object.values(scripts) as AIScript[];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 to-indigo-900"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-violet-100">
              <Terminal size={40} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Logic Hub</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Behavioral Personas & Automated Audits</p>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-3 bg-violet-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
          >
            <Plus size={18} /> New Logic Unit
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {scriptList.map(s => (
             <div 
               key={s.id} 
               className={`p-8 border-2 rounded-[32px] flex items-center justify-between group transition-all relative overflow-hidden ${editingId === s.id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100 hover:border-violet-100'}`}
             >
               <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => setEditingId(s.id)}>
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${s.isDefault ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-100 text-slate-400'}`}>
                   {s.isDefault ? <ShieldCheck size={24} /> : <Terminal size={24} />}
                 </div>
                 <div className="min-w-0 flex-1">
                   <div className="flex items-center gap-3">
                     <span className="text-xl font-black text-slate-800">{s.title}</span>
                     {s.isDefault && <span className="text-[8px] font-black uppercase bg-violet-600 text-white px-2 py-0.5 rounded tracking-widest">MASTER</span>}
                   </div>
                   <p className="text-xs text-slate-400 font-desc italic mt-1 line-clamp-1">{s.content}</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 shrink-0 pl-8 ml-auto border-l border-slate-50">
                  <button 
                    onClick={() => handleRunScript(s)}
                    className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-emerald-500 hover:shadow-emerald-100 transition-all hover:scale-110 active:scale-95"
                    title="Execute Logic"
                  >
                    <Play size={20} fill="currentColor" />
                  </button>
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    className={`p-4 rounded-2xl transition-all ${s.isDefault ? 'text-slate-200 cursor-not-allowed' : 'text-slate-200 hover:text-rose-500 hover:bg-rose-50'}`}
                  >
                    <Trash2 size={20} />
                  </button>
               </div>
             </div>
           ))}
        </div>
      </div>

      {/* Editor Sidebar */}
      {editingId && scripts[editingId] && (
        <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-6">
              <button onClick={() => setEditingId(null)} className="p-3 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={32} /></button>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{scripts[editingId].title}</h3>
                <span className="text-base font-black uppercase text-slate-400 tracking-widest">Logic Editor</span>
              </div>
            </div>
            <button 
              onClick={() => setEditingId(null)}
              className="bg-violet-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 flex items-center gap-2"
            >
              <Save size={16} /> Finish
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logic Unit Title</label>
               <div className="relative">
                 <Edit3 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input 
                   value={scripts[editingId].title} 
                   onChange={e => handleUpdate(editingId, { title: e.target.value })} 
                   readOnly={scripts[editingId].isDefault}
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] pl-16 pr-8 py-5 text-xl font-black text-slate-900 focus:ring-4 focus:ring-violet-50 transition-all outline-none"
                 />
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Script Content / Prompt</label>
                 <Sparkles size={14} className="text-violet-400" />
               </div>
               <textarea 
                 value={scripts[editingId].content} 
                 onChange={e => handleUpdate(editingId, { content: e.target.value })} 
                 className="w-full h-[400px] bg-violet-50 border-2 border-violet-100 rounded-[32px] p-10 text-lg font-mono text-violet-900 leading-relaxed focus:ring-8 focus:ring-violet-100 resize-none shadow-inner"
                 placeholder="Enter system instructions..."
               />
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {isResultModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !executingId && setIsResultModalOpen(false)}></div>
          <div className="relative bg-[#0a0f1e] w-full max-w-4xl h-[75vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-300">
            
            <header className="px-10 py-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${executingId ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-600'}`}>
                   {executingId ? <Cpu className="animate-spin" size={28} /> : <BrainCircuit size={28} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Logic <span className="text-indigo-400">Result</span></h3>
                  <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.3em]">Execution on {project.name}</p>
                </div>
              </div>
              <button onClick={() => setIsResultModalOpen(false)} disabled={!!executingId} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all disabled:opacity-30">
                <X size={24} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 font-desc text-lg custom-scrollbar bg-black/40 text-slate-200">
              {executingId ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-60">
                   <Loader2 className="animate-spin text-indigo-500" size={48} />
                   <p className="font-desc italic text-slate-400 text-xl">The AI is processing your narrative logic...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed animate-in fade-in duration-500">
                  {executionResult}
                </div>
              )}
              <div ref={resultEndRef} />
            </div>

            <footer className="px-10 py-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${executingId ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                   {executingId ? 'Computation in progress' : 'Analysis Finalized'}
                 </span>
               </div>
               <button 
                onClick={() => setIsResultModalOpen(false)}
                className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all shadow-xl"
               >
                 Close Analysis
               </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScriptsEditor;