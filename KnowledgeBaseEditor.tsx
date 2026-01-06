
import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Edit3, Save, ChevronRight, Clock, Sparkles, BrainCircuit, Layout } from 'lucide-react';
import { KBArticle } from './types';

interface Props {
  knowledgeBase: Record<string, KBArticle>;
  onUpdateKB: (updatedKB: Record<string, KBArticle>) => void;
}

const STC_BEAT_ORDER = [
  "Beats overview",
  "setup and pay off overview",
  "Theme and Meaning",
  "The Finale Blueprint",
  "1. Opening Image", 
  "2. Theme Stated", 
  "3. Set-Up", 
  "4. Catalyst", 
  "5. Debate", 
  "6. Break into Two", 
  "7. B Story", 
  "8. Fun and Games", 
  "9. Midpoint", 
  "10. Bad Guys Close In", 
  "11. All Is Lost", 
  "12. Dark Night of the Soul", 
  "13. Break into Three", 
  "14. Finale", 
  "15. Final Image"
];

// Local TabButton implementation to support the amber theme
const KBTabButton = ({ active, label, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 py-6 text-lg font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'border-amber-500 text-amber-600 bg-amber-50/10' : 'border-transparent text-slate-400 hover:bg-slate-50'}`}
  >
    {label}
  </button>
);

const KnowledgeBaseEditor: React.FC<Props> = ({ knowledgeBase = {}, onUpdateKB }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const safeKB = knowledgeBase || {};
  
  const sortedArticles = useMemo(() => {
    const articles = Object.values(safeKB) as KBArticle[];
    return articles.sort((a, b) => {
      const indexA = STC_BEAT_ORDER.indexOf(a.title);
      const indexB = STC_BEAT_ORDER.indexOf(b.title);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [safeKB]);

  const filtered = sortedArticles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  const handleUpdate = (id: string, updates: Partial<KBArticle>) => {
    const entry = (Object.entries(safeKB) as [string, KBArticle][]).find(([_, article]) => article.id === id);
    if (!entry) return;
    const [key, article] = entry;
    
    onUpdateKB({
      ...safeKB,
      [key]: { ...article, ...updates, lastUpdated: Date.now() }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-500 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-amber-100">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Knowledge Base for Save The Cat</h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Global Narrative Knowledge Base</p>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search methodology..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {sortedArticles.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[40px] opacity-40">
           <BookOpen size={64} className="text-slate-200 mb-6" />
           <p className="font-desc italic text-slate-400">Knowledge base is uninitialized for this project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(article => (
            <KBArticleCard 
              key={article.id} 
              article={article} 
              onEdit={() => setEditingId(article.id)} 
            />
          ))}
        </div>
      )}

      {editingId && sortedArticles.find(a => a.id === editingId) && (
        <KBArticleEditor 
          article={sortedArticles.find(a => a.id === editingId)!}
          onClose={() => setEditingId(null)}
          onUpdate={(updates) => handleUpdate(editingId, updates)}
        />
      )}
    </div>
  );
};

const KBArticleCard = ({ article, onEdit }: { article: KBArticle, onEdit: () => void }) => {
  const orderIndex = STC_BEAT_ORDER.indexOf(article.title);
  const isMeta = orderIndex < 4; // First 4 items are Meta-Articles
  const displayIndex = isMeta ? null : orderIndex - 3; // Subtracting the 4 meta items

  return (
    <div 
      onClick={onEdit}
      className={`bg-white border-2 border-slate-100 rounded-[32px] p-8 flex flex-col group transition-all relative hover:shadow-2xl hover:border-amber-100 cursor-pointer h-[320px] ${isMeta ? 'bg-amber-50/5' : ''}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
            {isMeta ? <Layout size={20} /> : <Edit3 size={20} />}
          </div>
          {displayIndex && (
            <span className="text-xl font-black text-slate-200 group-hover:text-amber-200 transition-colors">
              {displayIndex.toString().padStart(2, '0')}
            </span>
          )}
          {isMeta && (
            <span className="text-[8px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 tracking-[0.2em]">Architecture</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Clock size={12} />
          <span className="text-[9px] font-black uppercase tracking-widest">{new Date(article.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>
      <h3 className={`text-xl font-black mb-6 ${isMeta ? 'text-slate-900' : 'text-amber-500'}`}>{article.title}</h3>
      <p className="text-xs text-slate-500 font-desc italic leading-relaxed line-clamp-5">{article.content}</p>
      
      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-black uppercase text-amber-500">View Article Details</span>
         <ChevronRight size={14} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

const KBArticleEditor = ({ article, onClose, onUpdate }: { article: KBArticle, onClose: () => void, onUpdate: (u: Partial<KBArticle>) => void }) => {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'AI_COACH'>('CONTENT');

  return (
    <div className="fixed inset-y-0 right-0 w-[600px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={32} /></button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{article.title}</h3>
            <span className="text-base font-black uppercase text-slate-400 tracking-widest">Article Editor</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="bg-amber-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 flex items-center gap-2 shadow-lg shadow-amber-100"
        >
          <Save size={16} /> Save & Close
        </button>
      </div>

      <div className="flex border-b">
        <KBTabButton active={activeTab === 'CONTENT'} label="General Notes and Advice" onClick={() => setActiveTab('CONTENT')} />
        <KBTabButton active={activeTab === 'AI_COACH'} label="Coach Blueprint" onClick={() => setActiveTab('AI_COACH')} />
      </div>

      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
        {activeTab === 'CONTENT' ? (
          <div className="space-y-4">
            <label className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">General Notes and Advice</label>
            <textarea 
              value={article.content} 
              onChange={e => onUpdate({ content: e.target.value })} 
              className="w-full h-[500px] bg-amber-50/10 border-none rounded-[32px] p-10 text-xl font-desc italic leading-relaxed focus:ring-4 focus:ring-amber-50 resize-none shadow-inner" 
              placeholder="Enter Methodology Advice..." 
            />
          </div>
        ) : (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <BrainCircuit size={20} />
                <label className="text-sm font-black uppercase tracking-[0.2em]">AI System Persona</label>
              </div>
              <textarea 
                value={article.aiScript || ''} 
                onChange={e => onUpdate({ aiScript: e.target.value })} 
                className="w-full h-[400px] bg-amber-50/30 border-2 border-amber-100 rounded-[32px] p-10 text-base font-mono text-amber-900 leading-relaxed focus:ring-4 focus:ring-amber-100 resize-none" 
                placeholder="Example: You are a structural analyst specializing in movie midpoints. Your goal is to tell the user if their scene represents a False Victory or False Defeat and how it raises the stakes." 
              />
            </div>
            
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 space-y-2">
              <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
                <Sparkles size={14} />
                Coach Logic Tips
              </div>
              <p className="text-xs leading-relaxed opacity-80">
                The script above defines the AI's "brain" for this specific beat. When the user clicks "Chat with a coach" on the storyboard, the AI will combine this script with the user's actual scene content to provide feedback.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBaseEditor;
