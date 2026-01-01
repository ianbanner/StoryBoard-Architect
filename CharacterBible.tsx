
import React, { useState } from 'react';
import { User, Edit3, Trash2, RefreshCcw, ChevronRight } from 'lucide-react';
import { Character } from './types';
import { STCEditorField, TabButton } from './CommonUI';

interface Props {
  characters: Record<string, Character>;
  characterOrder: string[];
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onDelete: (id: string) => void;
}

const CharacterBible: React.FC<Props> = ({ characters, characterOrder, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-8">
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
      {editingId && characters[editingId] && (
        <CharacterEditor 
          character={characters[editingId]} 
          onClose={() => setEditingId(null)} 
          onUpdate={(updates) => onUpdate(editingId, updates)} 
        />
      )}
    </div>
  );
};

const CharacterCard = ({ character, onEdit, onDelete }: any) => (
  <div className={`bg-white border-2 rounded-3xl p-8 flex flex-col group transition-all relative hover:shadow-2xl ${character.isVillain ? 'border-red-400/30' : 'border-emerald-400/30'}`}>
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
  const [activeTab, setActiveTab] = useState<'BIO' | 'STC'>('BIO');
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
      <div className="flex border-b">
        <TabButton active={activeTab === 'BIO'} label="Biography" onClick={() => setActiveTab('BIO')} />
        <TabButton active={activeTab === 'STC'} label="STC Profile" onClick={() => setActiveTab('STC')} />
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
          </div>
        )}
        {activeTab === 'STC' && (
          <div className="space-y-10">
            <div className="space-y-5">
               <label className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-3 text-emerald-600">
                 <RefreshCcw size={16} /> Six Things That Need Fixing
               </label>
               <div className="grid grid-cols-1 gap-3">
                 {(character.sixThingsToFix || []).map((thing: string, i: number) => (
                   <div key={i} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-sm font-black text-slate-300 w-6">{i + 1}.</span>
                     <input 
                       value={thing} 
                       onChange={e => {
                        const newThings = [...character.sixThingsToFix]; 
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
            <STCEditorField label="Save The Cat Moment" value={character.saveTheCatMoment} onChange={(v: string) => onUpdate({ saveTheCatMoment: v })} placeholder="A moment that makes the audience love them..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterBible;
