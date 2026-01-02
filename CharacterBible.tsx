
import React, { useState } from 'react';
import { User, Edit3, Trash2, RefreshCcw, ChevronRight, MessageSquareQuote, Plus, Users } from 'lucide-react';
import { Character } from './types';
import { STCEditorField, TabButton } from './CommonUI';

interface Props {
  characters: Record<string, Character>;
  characterOrder: string[];
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const CharacterBible: React.FC<Props> = ({ characters, characterOrder, onUpdate, onDelete, onAdd }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Character Bible</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Story Cast Registry</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
        >
          <Plus size={18} /> Add Character
        </button>
      </div>

      {characterOrder.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[40px] opacity-40">
           <User size={64} className="text-slate-200 mb-6" />
           <p className="font-desc italic text-slate-400">Your cast is currently empty. Create a hero or a villain to lead your story.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {characterOrder.map(id => (
            <CharacterCard 
              key={id} 
              character={characters[id]} 
              onEdit={() => setEditingId(id)} 
              onDelete={() => onDelete(id)} 
            />
          ))}
        </div>
      )}

      {editingId && characters[editingId] && (
        <CharacterEditor 
          character={characters[editingId]} 
          onClose={() => setEditingId(null)} 
          onUpdate={(updates: Partial<Character>) => onUpdate(editingId, updates)} 
        />
      )}
    </div>
  );
};

const CharacterCard = ({ character, onEdit, onDelete }: any) => (
  <div className={`bg-white border-2 rounded-3xl p-8 flex flex-col group transition-all relative hover:shadow-2xl ${character.isVillain ? 'border-red-400/30 shadow-red-50' : 'border-emerald-400/30 shadow-emerald-50'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${character.isVillain ? 'bg-red-500 shadow-red-200' : 'bg-emerald-500 shadow-emerald-200'} shadow-lg`}>
        <User size={28} />
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Edit3 size={16} /></button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Trash2 size={16} /></button>
      </div>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">{character.name}</h3>
    <p className={`text-[10px] font-black uppercase tracking-widest ${character.isVillain ? 'text-red-500' : 'text-emerald-500'}`}>{character.oneWord}</p>
    <p className="mt-4 text-xs text-slate-500 font-desc italic leading-relaxed line-clamp-3">{character.oneSentence}</p>
    <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
       <div className="flex-1">
         <span className="text-[9px] font-black uppercase text-slate-400">Primal Goal</span>
         <p className="text-[10px] font-bold text-slate-700 truncate">{character.primalGoal || "Not set"}</p>
       </div>
    </div>
  </div>
);

const CharacterEditor = ({ character, onClose, onUpdate }: any) => {
  const [activeTab, setActiveTab] = useState<'BIO' | 'STC' | 'VOICE'>('BIO');
  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-2.5 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={24} /></button>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{character.name}</h3>
            <span className="text-sm font-black uppercase text-slate-400 tracking-widest">Character Bible</span>
          </div>
        </div>
      </div>
      <div className="flex border-b overflow-x-auto custom-scrollbar">
        <TabButton active={activeTab === 'BIO'} label="Biography" onClick={() => setActiveTab('BIO')} />
        <TabButton active={activeTab === 'STC'} label="STC Profile" onClick={() => setActiveTab('STC')} />
        <TabButton active={activeTab === 'VOICE'} label="Voice" onClick={() => setActiveTab('VOICE')} />
      </div>
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        {activeTab === 'BIO' && (
          <div className="space-y-8">
            <STCEditorField label="Name" value={character.name} onChange={(v: string) => onUpdate({ name: v })} />
            <STCEditorField label="Archetype (One Word)" value={character.oneWord} onChange={(v: string) => onUpdate({ oneWord: v })} />
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-slate-400 tracking-widest">Story Sentence</label>
              <textarea 
                value={character.oneSentence} 
                onChange={e => onUpdate({ oneSentence: e.target.value })} 
                className="w-full h-32 bg-slate-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-indigo-100 resize-none font-desc italic leading-relaxed" 
              />
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <input type="checkbox" checked={character.isVillain} onChange={e => onUpdate({ isVillain: e.target.checked })} className="w-6 h-6 rounded text-red-500 focus:ring-red-200" />
               <span className="text-base font-bold text-slate-600">This is an Antagonist / Villain</span>
            </div>
            <STCEditorField label="Occupation" value={character.occupation || ''} onChange={(v: string) => onUpdate({ occupation: v })} />
            <STCEditorField label="Age" value={character.age?.toString() || ''} onChange={(v: string) => onUpdate({ age: v })} />
          </div>
        )}
        {activeTab === 'STC' && (
          <div className="space-y-10">
            <div className="space-y-5">
               <label className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-3 text-emerald-600">
                 <RefreshCcw size={16} /> Six Things That Need Fixing
               </label>
               <div className="grid grid-cols-1 gap-3">
                 {(character.sixThingsToFix || ["", "", "", "", "", ""]).map((thing: string, i: number) => (
                   <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-sm font-black text-slate-300 w-6">{i + 1}.</span>
                     <input 
                       value={thing} 
                       onChange={e => {
                        const newThings = [...(character.sixThingsToFix || ["", "", "", "", "", ""])]; 
                        newThings[i] = e.target.value; 
                        onUpdate({ sixThingsToFix: newThings });
                       }} 
                       className="flex-1 bg-transparent border-none text-base font-medium focus:ring-0" 
                       placeholder="A flaw or missing piece..." 
                     />
                   </div>
                 ))}
               </div>
            </div>
            <STCEditorField label="Primal Goal" value={character.primalGoal} onChange={(v: string) => onUpdate({ primalGoal: v })} placeholder="Survival, Hunger, Sex, Protection..." />
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-slate-400 tracking-widest">Save The Cat Moment</label>
              <textarea 
                value={character.saveTheCatMoment} 
                onChange={e => onUpdate({ saveTheCatMoment: e.target.value })} 
                className="w-full h-32 bg-slate-50 border-none rounded-2xl p-5 text-base font-medium focus:ring-2 focus:ring-indigo-100 resize-none font-desc italic leading-relaxed" 
                placeholder="A moment that makes the audience love them..."
              />
            </div>
          </div>
        )}
        {activeTab === 'VOICE' && (
          <div className="space-y-10">
            <div className="space-y-5">
               <label className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-3 text-indigo-600">
                 <MessageSquareQuote size={16} /> Signature Phrases
               </label>
               <div className="grid grid-cols-1 gap-4">
                 {(character.signaturePhrases || ["", "", ""]).map((phrase: string, i: number) => (
                   <div key={i} className="flex flex-col gap-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Phrase {i + 1}</span>
                        <button 
                          onClick={() => {
                            const newPhrases = (character.signaturePhrases || []).filter((_: any, idx: number) => idx !== i);
                            onUpdate({ signaturePhrases: newPhrases });
                          }}
                          className="text-slate-300 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                     </div>
                     <textarea 
                        value={phrase} 
                        onChange={e => {
                          const newPhrases = [...(character.signaturePhrases || ["", "", ""])];
                          newPhrases[i] = e.target.value;
                          onUpdate({ signaturePhrases: newPhrases });
                        }}
                        className="w-full bg-transparent border-none text-base font-desc italic leading-relaxed focus:ring-0 p-0 resize-none h-20"
                        placeholder="Enter a line of dialogue that defines this character's voice..."
                     />
                   </div>
                 ))}
                 <button 
                   onClick={() => onUpdate({ signaturePhrases: [...(character.signaturePhrases || []), ""] })}
                   className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold hover:border-indigo-100 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                 >
                   <Edit3 size={14} /> Add Signature Phrase
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterBible;
