import React, { useState } from 'react';
import { Repeat, Edit3, Trash2, ChevronRight, Plus, Sparkles, Footprints, Target, Zap, Box, BrainCircuit } from 'lucide-react';
import { SetupPayoff } from './types';
import { STCEditorField } from './CommonUI';

interface Props {
  setupPayoffs: Record<string, SetupPayoff>;
  setupPayoffOrder: string[];
  onUpdate: (id: string, updates: Partial<SetupPayoff>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const CATEGORIES = [
  { id: 'FLAW', label: 'Character Flaw', icon: <Zap size={12}/>, color: 'text-rose-500 bg-rose-50' },
  { id: 'THEME', label: 'Theme Payoff', icon: <BrainCircuit size={12}/>, color: 'text-amber-600 bg-amber-50' },
  { id: 'PROBLEM', label: 'Main Problem', icon: <Target size={12}/>, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'OBJECT', label: 'Aha! Object', icon: <Box size={12}/>, color: 'text-sky-600 bg-sky-50' },
  { id: 'SKILL', label: 'Skill/Dialogue', icon: <Edit3 size={12}/>, color: 'text-violet-600 bg-violet-50' },
  { id: 'OTHER', label: 'Other', icon: <Repeat size={12}/>, color: 'text-slate-600 bg-slate-50' },
];

const SetupPayoffBible: React.FC<Props> = ({ setupPayoffs, setupPayoffOrder, onUpdate, onDelete, onAdd }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
            <Repeat size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Setup & Payoff Registry</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Architectural Loop Manager</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-xl shadow-sky-100"
        >
          <Plus size={18} /> Add Loop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
         <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Sparkles size={20}/></div>
            <div className="space-y-1">
               <h4 className="text-xs font-black uppercase tracking-widest text-amber-800">The Golden Rule: The Double Bump</h4>
               <p className="text-[11px] text-amber-700 font-desc italic leading-relaxed opacity-80">
                 "If you mention a detail in Act 1, don't just use it once in Act 3. Give it a 'bump' in Act 2 to remind the audience it exists."
               </p>
            </div>
         </div>
         <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Target size={20}/></div>
            <div className="space-y-1">
               <h4 className="text-xs font-black uppercase tracking-widest text-indigo-800">The "Stasis = Death" Connection</h4>
               <p className="text-[11px] text-indigo-700 font-desc italic leading-relaxed opacity-80">
                 "Act 1 setups are often the 'broken things' in the hero's life. Act 3 is the proof they've been fixed or replaced."
               </p>
            </div>
         </div>
      </div>

      {setupPayoffOrder.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[40px] opacity-40">
           <Repeat size={64} className="text-slate-200 mb-6" />
           <p className="font-desc italic text-slate-400">Your narrative loops are empty. Every payoff needs a setup, and every setup deserves a payoff.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {setupPayoffOrder.map(id => (
            <SetupPayoffCard 
              key={id} 
              sp={setupPayoffs[id]} 
              onEdit={() => setEditingId(id)} 
              onDelete={() => onDelete(id)} 
            />
          ))}
        </div>
      )}

      {editingId && setupPayoffs[editingId] && (
        <SetupPayoffEditor 
          sp={setupPayoffs[editingId]} 
          onClose={() => setEditingId(null)} 
          onUpdate={(updates: Partial<SetupPayoff>) => onUpdate(editingId, updates)} 
        />
      )}
    </div>
  );
};

// Fix: Changed props to any to avoid TypeScript errors with 'key' and standard props mapping
const SetupPayoffCard = ({ sp, onEdit, onDelete }: any) => {
  const category = CATEGORIES.find(c => c.id === (sp.category || 'OTHER')) || CATEGORIES[5];
  
  return (
    <div className="bg-white border-2 border-sky-400/20 rounded-[32px] p-8 flex flex-col group transition-all relative hover:shadow-2xl shadow-sky-50 min-h-[460px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest w-fit border ${category.color}`}>
             {category.icon}
             {category.label}
           </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Edit3 size={16} /></button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Trash2 size={16} /></button>
        </div>
      </div>
      
      <h3 className="text-xl font-black text-slate-900 mb-6 leading-tight">{sp.title}</h3>
      
      <div className="space-y-4 flex-1">
        <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100/50">
          <span className="text-[9px] font-black uppercase text-sky-600 tracking-widest block mb-1">Setup (Act 1)</span>
          <p className="text-xs text-slate-600 font-desc italic leading-relaxed line-clamp-2">{sp.setupDescription || "Pending..."}</p>
        </div>
        
        <div className="p-4 bg-violet-50/40 rounded-2xl border border-violet-100/50">
          <span className="text-[9px] font-black uppercase text-violet-600 tracking-widest block mb-1">The Bump (Act 2)</span>
          <p className="text-xs text-slate-600 font-desc italic leading-relaxed line-clamp-2">{sp.bumpDescription || "Pending..."}</p>
        </div>

        <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50">
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Payoff (Act 3)</span>
          <p className="text-xs text-slate-600 font-desc italic leading-relaxed line-clamp-2">{sp.payoffDescription || "Pending..."}</p>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-black uppercase text-sky-500">Edit Narrative Loop</span>
         <ChevronRight size={14} className="text-sky-500 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

const SetupPayoffEditor = ({ sp, onClose, onUpdate }: { sp: SetupPayoff, onClose: () => void, onUpdate: (u: Partial<SetupPayoff>) => void }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[560px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={24} /></button>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{sp.title || "Untiled Loop"}</h3>
            <span className="text-sm font-black uppercase text-slate-400 tracking-widest">Architectural Loop Editor</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        <STCEditorField label="Loop Title" value={sp.title} onChange={(v: string) => onUpdate({ title: v })} />
        
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Logic Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => onUpdate({ category: cat.id as any })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${sp.category === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-100'}`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black uppercase text-sky-600 tracking-widest flex items-center gap-2">
            <Footprints size={14} /> The Setup (Act 1)
          </label>
          <textarea 
            value={sp.setupDescription} 
            onChange={e => onUpdate({ setupDescription: e.target.value })} 
            className="w-full h-32 bg-sky-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-sky-100 resize-none font-desc italic leading-relaxed" 
            placeholder="Introduce the element early. It shouldn't feel like a setup—just a messy detail of life."
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black uppercase text-violet-600 tracking-widest flex items-center gap-2">
            <Repeat size={14} /> The Bump (Act 2)
          </label>
          <textarea 
            value={sp.bumpDescription} 
            onChange={e => onUpdate({ bumpDescription: e.target.value })} 
            className="w-full h-32 bg-violet-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-violet-100 resize-none font-desc italic leading-relaxed" 
            placeholder="Remind the audience the detail exists. Use it to cause a minor setback or a reminder of the hero's flaw."
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2">
            <Sparkles size={14} /> The Payoff (Act 3)
          </label>
          <textarea 
            value={sp.payoffDescription} 
            onChange={e => onUpdate({ payoffDescription: e.target.value })} 
            className="w-full h-32 bg-emerald-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-emerald-100 resize-none font-desc italic leading-relaxed" 
            placeholder="The harvest. That minor detail becomes the secret weapon that solves the problem."
          />
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-50">
          <label className="text-sm font-black uppercase text-slate-400 tracking-widest">Developer Notes</label>
          <textarea 
            value={sp.notes || ''} 
            onChange={e => onUpdate({ notes: e.target.value })} 
            className="w-full h-32 bg-slate-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-slate-100 resize-none" 
            placeholder="Internal metadata or structural thoughts..."
          />
        </div>
      </div>
    </div>
  );
};

export default SetupPayoffBible;