
import React, { useState } from 'react';
import { Terminal, Save, Trash2, Plus, Sparkles, AlertCircle, ShieldCheck, ChevronRight, Edit3 } from 'lucide-react';
import { AIScript } from './types';
import { TabButton } from './CommonUI';

interface Props {
  scripts: Record<string, AIScript>;
  onUpdateScripts: (updated: Record<string, AIScript>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const AIScriptsEditor: React.FC<Props> = ({ scripts = {}, onUpdateScripts }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Fixed: Cast Object.values to AIScript[] to resolve property access errors on unknown
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
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Scripts</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Instructional Logic & Personas</p>
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-3 bg-violet-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-100"
          >
            <Plus size={18} /> Add Logic Unit
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
           {scriptList.map(s => (
             <div 
               key={s.id} 
               onClick={() => setEditingId(s.id)}
               className={`p-8 border-2 rounded-[32px] flex items-center justify-between group transition-all cursor-pointer ${editingId === s.id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100 hover:border-violet-100'}`}
             >
               <div className="flex items-center gap-6">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.isDefault ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'bg-slate-100 text-slate-400'}`}>
                   {s.isDefault ? <ShieldCheck size={24} /> : <Terminal size={24} />}
                 </div>
                 <div>
                   <div className="flex items-center gap-3">
                     <span className="text-xl font-black text-slate-800">{s.title}</span>
                     {s.isDefault && <span className="text-[8px] font-black uppercase bg-violet-600 text-white px-2 py-0.5 rounded tracking-widest">MASTER</span>}
                   </div>
                   <p className="text-xs text-slate-400 font-desc italic mt-1 line-clamp-1">{s.content}</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className={`p-4 rounded-2xl transition-all ${s.isDefault ? 'text-slate-200 cursor-not-allowed' : 'text-slate-200 hover:text-rose-500 hover:bg-rose-50'}`}>
                    <Trash2 size={20} />
                  </button>
                  <ChevronRight size={20} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
               </div>
             </div>
           ))}
        </div>
      </div>

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

            {scripts[editingId].isDefault && (
               <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl flex gap-6 items-start">
                 <AlertCircle size={24} className="text-amber-600 shrink-0" />
                 <div className="space-y-1">
                   <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">System Identity</h4>
                   <p className="text-xs text-amber-700 leading-relaxed font-medium">
                     This is the Master Persona for the project. Every AI interaction within this project's context will be prefixed or grounded by this logic unit. Use it to define the global voice, tone, and audience expectations.
                   </p>
                 </div>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIScriptsEditor;
