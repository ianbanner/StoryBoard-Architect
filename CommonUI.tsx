
import React from 'react';

export const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${active ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-slate-800 text-slate-400'}`}>
    <div className="shrink-0">{icon}</div>
    <span className="font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
  </button>
);

export const STCInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-base font-black uppercase text-slate-400 tracking-tight">{label}</label>
    <textarea 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-200 transition-all h-40 resize-none" 
      placeholder={placeholder} 
    />
  </div>
);

export const STCEditorField = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-base font-black uppercase text-slate-400 tracking-widest">{label}</label>
    <input 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border-none rounded-2xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100" 
      placeholder={placeholder} 
    />
  </div>
);

export const TabButton = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 py-6 text-lg font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-400 hover:bg-slate-50'}`}
  >
    {label}
  </button>
);
