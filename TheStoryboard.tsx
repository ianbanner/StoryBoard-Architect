
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Edit3, Trash2, Swords, Plus, ChevronRight, MapPin, User, X, BookOpen, Sparkles, BrainCircuit, Loader2, MessageSquare, ListTree, ChevronDown, ChevronUp, FileText, Type, CheckCircle2, Users, Layout, Activity, ArrowUpRight, TrendingUp, TrendingDown, Book } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CardType, StoryCard, Character, Location, KBArticle } from './types';
import { TabButton } from './CommonUI';

interface Props {
  cards: Record<string, StoryCard>;
  beatOrder: string[];
  characters: Character[];
  locations: Location[];
  knowledgeBase: Record<string, KBArticle>;
  onUpdateCard: (id: string, updates: Partial<StoryCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (id: string) => void;
  shouldRenderCard: (id: string) => boolean;
  isCardMatching: (id: string) => boolean;
  visibilityMode: 'FOCUS' | 'HIDDEN';
  cardScale: number;
}

const TheStoryboard: React.FC<Props> = ({ 
  cards, beatOrder, characters = [], locations = [], knowledgeBase = {}, onUpdateCard, onDeleteCard, onAddChild, onAddSibling, shouldRenderCard, isCardMatching, visibilityMode, cardScale 
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [kbCardId, setKbCardId] = useState<string | null>(null);
  const [writingCardId, setWritingCardId] = useState<string | null>(null);

  const charactersMap = useMemo(() => 
    characters.reduce((acc, char) => ({ ...acc, [char.id]: char }), {} as Record<string, Character>),
    [characters]
  );
  
  const locationsMap = useMemo(() => 
    locations.reduce((acc, loc) => ({ ...acc, [loc.id]: loc }), {} as Record<string, Location>),
    [locations]
  );

  return (
    <div className="h-full w-full bg-[#f8fafc] relative overflow-auto custom-scrollbar dot-grid">
      <div className="flex flex-row gap-24 p-24 min-w-max h-full items-start">
        {beatOrder.filter(id => shouldRenderCard(id)).map((beatId) => (
          <StoryboardBranch 
            key={beatId}
            beatId={beatId}
            cards={cards}
            charactersMap={charactersMap}
            locationsMap={locationsMap}
            onUpdate={onUpdateCard}
            onDelete={onDeleteCard}
            onAddChild={onAddChild}
            onAddSibling={onAddSibling}
            onEdit={setEditingCardId}
            onOpenKB={setKbCardId}
            onOpenWriter={setWritingCardId}
            isCardMatching={isCardMatching}
            shouldRenderCard={shouldRenderCard}
            cardScale={cardScale}
          />
        ))}
      </div>

      {editingCardId && cards[editingCardId] && (
        <STCCardEditor 
          card={cards[editingCardId]} 
          characters={characters} 
          locations={locations}
          onClose={() => setEditingCardId(null)} 
          onUpdate={(updates: any) => onUpdateCard(editingCardId, updates)} 
        />
      )}
      {kbCardId && cards[kbCardId] && (
        <KBViewer 
          card={cards[kbCardId]} 
          cards={cards}
          knowledgeBase={knowledgeBase}
          onClose={() => setKbCardId(null)} 
        />
      )}

      {writingCardId && cards[writingCardId] && (
        <DraftingRoom 
          card={cards[writingCardId]}
          cards={cards}
          onClose={() => setWritingCardId(null)}
          onUpdate={(updates: any) => onUpdateCard(writingCardId, updates)}
          charactersMap={charactersMap}
          locationsMap={locationsMap}
        />
      )}
    </div>
  );
};

const StoryboardBranch = ({ beatId, cards, charactersMap, locationsMap, onUpdate, onDelete, onAddChild, onAddSibling, onEdit, onOpenKB, onOpenWriter, isCardMatching, shouldRenderCard, cardScale }: any) => {
  const beat = cards[beatId];
  if (!beat) return null;

  const sceneIds = (beat.children || []).filter((id: string) => shouldRenderCard(id));
  const isHighlighted = isCardMatching(beatId);

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative mb-20 w-[380px]">
        <NarrativeCard 
          card={beat}
          cards={cards}
          charactersMap={charactersMap}
          locationsMap={locationsMap}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenKB={onOpenKB}
          onOpenWriter={onOpenWriter}
          onAddChild={() => onAddChild(beatId)}
          onAddSibling={() => onAddSibling(beatId)}
          isHighlighted={isHighlighted}
          cardScale={cardScale}
          isColumnHeader
        />
        {sceneIds.length > 0 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-200" />
        )}
      </div>

      <div className="flex flex-row gap-12 items-start relative pt-10">
        {sceneIds.length > 1 && (
          <div className="absolute top-0 h-0.5 bg-slate-200" style={{
            left: `${100 / (sceneIds.length * 2)}%`,
            right: `${100 / (sceneIds.length * 2)}%`
          }} />
        )}
        
        {sceneIds.map((sceneId: string) => {
          const scene = cards[sceneId];
          if (!scene) return null;
          const childChapters = (scene.children || []).filter((id: string) => shouldRenderCard(id));
          
          return (
            <div key={sceneId} className="flex flex-col items-center">
              <div className="w-0.5 h-10 bg-slate-200 -mt-10 mb-0" />
              <div className="w-[360px] relative">
                <NarrativeCard 
                  card={scene}
                  cards={cards}
                  charactersMap={charactersMap}
                  locationsMap={locationsMap}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onOpenKB={onOpenKB}
                  onOpenWriter={onOpenWriter}
                  onAddChild={() => onAddChild(sceneId)}
                  onAddSibling={() => onAddSibling(sceneId)}
                  isHighlighted={isCardMatching(sceneId)}
                  cardScale={cardScale}
                />
                {childChapters.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-200" />
                )}
              </div>

              <div className="mt-20 flex flex-row gap-6 items-start relative">
                {childChapters.length > 1 && (
                   <div className="absolute top-[-10px] h-0.5 bg-slate-200" style={{
                     left: `${100 / (childChapters.length * 2)}%`,
                     right: `${100 / (childChapters.length * 2)}%`
                   }} />
                )}

                {childChapters.map((chapterId: string) => (
                  <div key={chapterId} className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-slate-200 -mt-10 mb-0" />
                    <div className="w-[320px]">
                      <NarrativeCard 
                        card={cards[chapterId]}
                        cards={cards}
                        charactersMap={charactersMap}
                        locationsMap={locationsMap}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onOpenKB={onOpenKB}
                        onOpenWriter={onOpenWriter}
                        onAddSibling={() => onAddSibling(chapterId)}
                        isHighlighted={isCardMatching(chapterId)}
                        cardScale={cardScale}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {sceneIds.length === 0 && (
          <div className="w-[360px] h-40 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 opacity-40">
            <Plus size={24} className="mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">No Scenes Yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

const NarrativeCard = ({ card, cards, charactersMap, locationsMap, onEdit, onDelete, onOpenKB, onOpenWriter, onAddChild, onAddSibling, isHighlighted, cardScale, isColumnHeader }: any) => {
  if (!card) return null;
  const typeLabels = { 
    [CardType.BEAT]: 'STRUCTURE / ARCHITECT', 
    [CardType.SCENE]: 'NARRATIVE / SCENE',
    [CardType.CHAPTER]: 'LITERARY / CHAPTER'
  };

  const borderColors = {
    [CardType.BEAT]: 'border-l-amber-500',
    [CardType.SCENE]: 'border-l-blue-500',
    [CardType.CHAPTER]: 'border-l-teal-500'
  };
  
  const visualClasses = isHighlighted 
    ? "opacity-100 scale-100 shadow-xl border-indigo-500 ring-2 ring-indigo-50" 
    : "opacity-100 scale-100 hover:shadow-2xl hover:border-indigo-400";
  
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;

  const parentTitle = useMemo(() => {
    if (!card.parentId) return null;
    return cards[card.parentId]?.title;
  }, [card.parentId, cards]);

  const stopPropagation = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  const wordCount = (card.draftContent || '').split(/\s+/).filter(Boolean).length;

  return (
    <div 
      className={`w-full ${isColumnHeader ? 'h-[260px]' : 'h-[240px]'} border bg-white border-slate-200 rounded-3xl p-6 flex flex-col group transition-all relative z-10 overflow-hidden ${borderColors[card.type]} border-l-4 ${visualClasses} cursor-pointer`}
      onClick={() => onEdit(card.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider shrink-0">
            {typeLabels[card.type]}
          </span>
          {parentTitle && (
            <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
              <ChevronRight size={10} strokeWidth={3} />
              <span className="text-[9px] font-bold uppercase truncate max-w-[120px]">{parentTitle}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={stopPropagation(() => onOpenWriter(card.id))} className="text-slate-400 hover:text-indigo-600"><FileText size={14} /></button>
           <button onClick={stopPropagation(() => onEdit(card.id))} className="text-slate-400 hover:text-indigo-600"><Edit3 size={14} /></button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mb-4 flex-1 min-h-0">
        <h3 className="font-black text-slate-900 uppercase tracking-tight leading-tight truncate" style={{ fontSize: `${13 * cardScale}px` }}>
          {card.title}
        </h3>
        {card.chapterTitle && (
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest truncate">Public: {card.chapterTitle}</p>
        )}
        <p className="font-desc text-slate-500 leading-relaxed italic opacity-80 overflow-hidden line-clamp-2 mt-1" style={{ fontSize: `${11 * cardScale}px` }}>
          {card.description || "Define the core narrative movement..."}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4 shrink-0 h-8 overflow-hidden">
        {card.emotionalValue && (
           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${card.emotionalValue === 'POSITIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
              {card.emotionalValue === 'POSITIVE' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {card.emotionalValue} SHIFT
           </div>
        )}
        {primaryLoc && (
           <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-100">
              <MapPin size={10} />
              {primaryLoc.name}
           </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 max-w-[60%] overflow-hidden">
           {charA && charB ? (
             <div className="flex items-center gap-1">
               <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white ${charA.isVillain ? 'bg-rose-500' : 'bg-emerald-500'}`}>{charA.name[0]}</div>
               <Swords size={10} className="text-slate-300 shrink-0" />
               <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white ${charB.isVillain ? 'bg-rose-500' : 'bg-emerald-500'}`}>{charB.name[0]}</div>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-slate-300">
                <Users size={12} />
                <span className="text-[9px] font-bold uppercase">Neutral Interaction</span>
             </div>
           )}
        </div>

        <div className="text-right">
           <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm ${wordCount > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-300'}`}>
             W: {wordCount}
           </span>
        </div>
      </div>

      <div className="absolute inset-0 bg-indigo-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <button 
        onClick={stopPropagation(onAddSibling)} 
        className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-2 rounded-full shadow-2xl hover:scale-110 transition-all z-40 text-slate-400 hover:text-indigo-600 active:scale-90"
      >
        <Plus size={14} />
      </button>
      {onAddChild && (
        <button 
          onClick={stopPropagation(onAddChild)} 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-2 rounded-full shadow-2xl hover:scale-110 transition-all z-40 text-slate-400 hover:text-indigo-600 active:scale-90"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};

const DraftingRoom = ({ card, cards, onClose, onUpdate, charactersMap, locationsMap }: { card: StoryCard, cards: Record<string, StoryCard>, onClose: () => void, onUpdate: (u: Partial<StoryCard>) => void, charactersMap: Record<string, Character>, locationsMap: Record<string, Location> }) => {
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;

  const attendance = useMemo(() => {
    return (card.tags || []).filter(t => t.category === 'character').map(t => charactersMap[t.id]).filter(Boolean);
  }, [card.tags, charactersMap]);

  const ancestorBeat = useMemo(() => {
    const findAncestorBeat = (currentCard: StoryCard): StoryCard | null => {
      if (currentCard.type === CardType.BEAT) return currentCard;
      if (!currentCard.parentId) return null;
      const parent = cards[currentCard.parentId];
      if (!parent) return null;
      return findAncestorBeat(parent);
    };
    return findAncestorBeat(card);
  }, [card, cards]);

  const wordCount = (card.draftContent || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-y-0 right-0 w-[calc(100vw-10px)] bg-white shadow-2xl z-[2000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header Bar */}
      <div className="p-6 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <ChevronRight size={32} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight truncate max-w-md">{card.title}</h2>
              <p className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.3em]">Architectural View • Drafting Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Writing Area (EXPANSIVE) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-stretch bg-white">
          <div className="w-full px-12 py-16 min-h-full flex flex-col gap-10">
            
            {/* Status Strip */}
            <div className="flex items-center justify-between text-slate-300 border-b border-slate-50 pb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Live Vault Sync • Garamond / Serif
                </span>
                {ancestorBeat && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Structural Anchor: <span className="text-amber-500">{ancestorBeat.title}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase text-slate-400">Word Count</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${wordCount > 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-900'}`}>
                      {wordCount} words
                    </span>
                 </div>
                 <div className="flex flex-col items-end border-l border-slate-100 pl-4">
                    <span className="text-[8px] font-black uppercase text-slate-400">Internal Reference Title</span>
                    <input 
                      value={card.title} 
                      onChange={e => onUpdate({ title: e.target.value })} 
                      className="text-[10px] font-bold text-indigo-600 bg-transparent border-none p-0 focus:ring-0 text-right w-40"
                    />
                 </div>
              </div>
            </div>

            {/* Public Chapter Title (What the reader sees) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <Book size={14} className="text-indigo-400" />
                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Public Chapter Title (Reader Facing)</label>
              </div>
              <input 
                value={card.chapterTitle || ''} 
                onChange={e => onUpdate({ chapterTitle: e.target.value })} 
                placeholder="Enter the title your readers will see (e.g. Chapter One: The Arrival)"
                className="w-full bg-transparent border-none p-0 text-5xl font-black text-slate-900 tracking-tight focus:ring-0 placeholder:text-slate-100 font-desc"
              />
            </div>

            {/* Expansive Writing Area */}
            <div className="flex-1 flex flex-col">
              <textarea 
                autoFocus
                value={card.draftContent || ''} 
                onChange={e => onUpdate({ draftContent: e.target.value })} 
                placeholder="The first draft is just you telling yourself the story. Begin writing here..."
                className="flex-1 w-full bg-transparent border-none focus:ring-0 p-0 text-3xl font-desc leading-[1.8] text-slate-800 resize-none placeholder:text-slate-50 min-h-[600px] pb-40"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Metadata Sidebar */}
        <aside className="w-80 bg-slate-50/50 border-l border-slate-100 flex flex-col overflow-y-auto custom-scrollbar p-8 gap-8 shrink-0">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-slate-400">
               <Sparkles size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Scene Blueprint</h4>
             </div>
             <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
               {card.emotionalValue && (
                 <div className={`absolute top-0 right-0 px-2 py-1 rounded-bl-xl text-[10px] font-black ${card.emotionalValue === 'POSITIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {card.emotionalValue === 'POSITIVE' ? 'POS' : 'NEG'}
                 </div>
               )}
               <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-tight pr-8">{card.title}</h5>
               <p className="text-xs font-desc italic leading-relaxed text-slate-500">
                 {card.description || "No narrative blueprint defined."}
               </p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-rose-400">
               <Swords size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Core Conflict</h4>
             </div>
             <div className="p-5 bg-rose-50/30 rounded-3xl border border-rose-100/30 space-y-3">
               {charA && charB ? (
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase">
                      <span className={charA.isVillain ? 'text-rose-600' : 'text-emerald-600'}>{charA.name}</span>
                      <span className="text-slate-300 mx-2">vs</span>
                      <span className={charB.isVillain ? 'text-rose-600' : 'text-emerald-600'}>{charB.name}</span>
                    </div>
                    {card.conflict && <p className="text-[10px] font-bold text-slate-500 border-t border-rose-100/50 pt-2">{card.conflict}</p>}
                 </div>
               ) : (
                 <p className="text-xs font-bold text-slate-700">{card.conflict || "Internal Struggle / Tension"}</p>
               )}
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-emerald-500">
               <Users size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Cast in Attendance</h4>
             </div>
             <div className="flex flex-wrap gap-2">
               {attendance.length > 0 ? attendance.map(char => (
                 <div key={char.id} className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase flex items-center gap-1.5 ${char.isVillain ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                   <User size={10} />
                   {char.name}
                 </div>
               )) : (
                 <p className="text-[10px] font-bold text-slate-400 italic">No cast members linked.</p>
               )}
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500">
               <MapPin size={16} />
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Setting</h4>
             </div>
             <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                 <MapPin size={14} />
               </div>
               <span className="text-xs font-black text-slate-700 truncate">{primaryLoc?.name || "Unset Location"}</span>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const KBViewer = ({ card, cards, knowledgeBase = {}, onClose }: { card: StoryCard, cards: Record<string, StoryCard>, knowledgeBase?: Record<string, KBArticle>, onClose: () => void }) => {
  const [coachingAdvice, setCoachingAdvice] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findAncestorBeat = (currentCard: StoryCard): StoryCard | null => {
    if (currentCard.type === CardType.BEAT) return currentCard;
    if (!currentCard.parentId) return null;
    const parent = cards[currentCard.parentId];
    if (!parent) return null;
    return findAncestorBeat(parent);
  };

  const beat = findAncestorBeat(card);
  const baseTitle = beat ? beat.title : "Unknown Beat";
  const article = knowledgeBase[baseTitle];

  const handleCallCoach = async () => {
    if (!article?.aiScript) {
      setError("This methodology unit doesn't have an AI Blueprint defined.");
      return;
    }

    setIsCoaching(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Coaching Request for ${card.title}. Instructions: ${article.aiScript}. Content: ${card.description}`,
      });
      setCoachingAdvice(response.text);
    } catch (err: any) {
      setError("The coach is unavailable right now.");
    } finally {
      setIsCoaching(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white text-slate-900 shadow-2xl z-[1001] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><ChevronRight size={32} /></button>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">{baseTitle}</h3>
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Master Methodology</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-10">
        <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[32px] space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <Sparkles size={24} />
            <h4 className="text-sm font-black uppercase tracking-[0.2em]">Methodology Insight</h4>
          </div>
          <p className="text-xl font-desc italic leading-relaxed text-slate-700">
            {article?.content || "No advice found for this beat."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-600">
              <BrainCircuit size={24} />
              <h4 className="text-sm font-black uppercase tracking-[0.2em]">AI Mentor</h4>
            </div>
            <button 
              onClick={handleCallCoach}
              disabled={isCoaching}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
            >
              {isCoaching ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />}
              Call Coach
            </button>
          </div>
          {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
          {coachingAdvice && (
            <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[32px] relative animate-in fade-in zoom-in-95 duration-500">
              <p className="text-lg font-desc italic leading-relaxed text-slate-800">{coachingAdvice}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const STCCardEditor = ({ card, onClose, onUpdate, characters, locations }: any) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'STC' | 'TAGS'>('STORY');
  const stopPropagation = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };

  const toggleTag = (tagId: string, label: string, category: 'character' | 'location') => {
    const isTagged = card.tags?.some((t: any) => t.id === tagId);
    const newTags = isTagged 
      ? (card.tags || []).filter((t: any) => t.id !== tagId) 
      : [...(card.tags || []), { id: tagId, label, category }];
    onUpdate({ tags: newTags });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={32} /></button>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{card.title}</h3>
            <span className="text-base font-black uppercase text-slate-400 tracking-widest">{card.type} Architect</span>
          </div>
        </div>
      </div>
      <div className="flex border-b">
        <TabButton active={activeTab === 'STORY'} label="Narrative" onClick={() => setActiveTab('STORY')} />
        <TabButton active={activeTab === 'STC'} label="STC Metadata" onClick={() => setActiveTab('STC')} />
        <TabButton active={activeTab === 'TAGS'} label="Cast & World" onClick={() => setActiveTab('TAGS')} />
      </div>
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
        {activeTab === 'STORY' && (
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Architectural Title (Internal Reference)</label>
              <input value={card.title} onChange={e => onUpdate({ title: e.target.value })} className="w-full text-2xl font-bold border-none p-0 focus:ring-0 placeholder:text-slate-200" />
            </div>
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Chapter Title (Reader Facing)</label>
              <input value={card.chapterTitle || ''} onChange={e => onUpdate({ chapterTitle: e.target.value })} className="w-full text-2xl font-desc italic border-none p-0 focus:ring-0 placeholder:text-slate-200" placeholder="e.g. Chapter One: The Void" />
            </div>
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Narrative Action</label>
              <textarea value={card.description} onChange={e => onUpdate({ description: e.target.value })} className="w-full h-64 text-xl text-slate-600 border-none p-0 focus:ring-0 resize-none font-desc leading-relaxed" />
            </div>
          </div>
        )}
        {activeTab === 'STC' && (
          <div className="space-y-12">
            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Emotional Sign Flip (+/-)</label>
              <div className="flex bg-slate-100 p-2 rounded-3xl border border-slate-200">
                <button onClick={() => onUpdate({ emotionalValue: 'POSITIVE' })} className={`flex-1 py-5 rounded-2xl text-lg font-bold transition-all ${card.emotionalValue === 'POSITIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Positive (+)</button>
                <button onClick={() => onUpdate({ emotionalValue: 'NEGATIVE' })} className={`flex-1 py-5 rounded-2xl text-lg font-bold transition-all ${card.emotionalValue === 'NEGATIVE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Negative (-)</button>
              </div>
            </div>
            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-3"><Swords size={20} /> Conflict</label>
              <div className="grid grid-cols-2 gap-6">
                <select value={card.conflictSubjectAId || ''} onChange={e => onUpdate({ conflictSubjectAId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-600">
                  <option value="">Subject A</option>
                  {(characters || []).map((char: any) => <option key={char.id} value={char.id}>{char.name}</option>)}
                </select>
                <select value={card.conflictSubjectBId || ''} onChange={e => onUpdate({ conflictSubjectBId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-600">
                  <option value="">Subject B</option>
                  {(characters || []).map((char: any) => <option key={char.id} value={char.id}>{char.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'TAGS' && (
          <div className="space-y-12">
            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Cast In Attendance</label>
              <div className="flex flex-wrap gap-3">
                {(characters || []).map((char: any) => {
                  const isTagged = card.tags?.some((t: any) => t.id === char.id);
                  return (
                    <button key={char.id} onClick={stopPropagation(() => toggleTag(char.id, char.name, 'character'))} className={`px-6 py-3 rounded-2xl text-base font-bold border transition-all ${isTagged ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>{char.name}</button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Primary Location</label>
              <select value={card.primaryLocationId || ''} onChange={e => onUpdate({ primaryLocationId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-lg font-bold text-slate-600">
                <option value="">Select Location...</option>
                {(locations || []).map((loc: any) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheStoryboard;
