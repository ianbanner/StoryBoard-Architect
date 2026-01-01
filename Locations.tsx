
import React, { useState } from 'react';
import { MapPin, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { Location } from './types';
import { STCEditorField } from './CommonUI';

interface Props {
  locations: Record<string, Location>;
  locationOrder: string[];
  onUpdate: (id: string, updates: Partial<Location>) => void;
  onDelete: (id: string) => void;
}

const Locations: React.FC<Props> = ({ locations, locationOrder, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {locationOrder.map(id => (
          <LocationCard 
            key={id} 
            location={locations[id]} 
            onEdit={() => setEditingId(id)}
            onDelete={() => onDelete(id)}
          />
        ))}
      </div>
      {editingId && locations[editingId] && (
        <LocationEditor 
          location={locations[editingId]} 
          onClose={() => setEditingId(null)} 
          onUpdate={(updates: Partial<Location>) => onUpdate(editingId, updates)} 
        />
      )}
    </div>
  );
};

const LocationCard = ({ location, onEdit, onDelete }: any) => (
  <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col group transition-all relative hover:shadow-2xl hover:border-indigo-100">
    <div className="flex items-center justify-between mb-6">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
        <MapPin size={28} />
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Edit3 size={16} /></button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400"><Trash2 size={16} /></button>
      </div>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">{location.name}</h3>
    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Asset Registry</p>
    <p className="mt-4 text-xs text-slate-500 font-desc italic leading-relaxed line-clamp-3">{location.description}</p>
    <div className="mt-6 pt-6 border-t border-slate-100">
       <span className="text-[9px] font-black uppercase text-slate-400">Significance</span>
       <p className="text-[10px] font-bold text-slate-700">{location.significance}</p>
    </div>
  </div>
);

const LocationEditor = ({ location, onClose, onUpdate }: any) => {
  return (
    <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={32} /></button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{location.name}</h3>
            <span className="text-base font-black uppercase text-slate-400 tracking-widest">Location Details</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
        <STCEditorField label="Name" value={location.name} onChange={(v: string) => onUpdate({ name: v })} />
        <div className="space-y-4">
           <label className="text-base font-black uppercase text-slate-400 tracking-widest">Physical Description</label>
           <textarea 
             value={location.description} 
             onChange={e => onUpdate({ description: e.target.value })} 
             className="w-full h-64 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none font-desc leading-relaxed placeholder:text-slate-200" 
             placeholder="What does it look, smell, and feel like?" 
           />
        </div>
        <div className="space-y-4">
           <label className="text-base font-black uppercase text-slate-400 tracking-widest">Narrative Significance</label>
           <textarea 
             value={location.significance} 
             onChange={e => onUpdate({ significance: e.target.value })} 
             className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-200" 
             placeholder="Why does this place matter to the story?" 
           />
        </div>
      </div>
    </div>
  );
};

export default Locations;
