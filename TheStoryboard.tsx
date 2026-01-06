
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Edit3, Trash2, Swords, Plus, ChevronRight, MapPin, User, X, BookOpen, 
    Sparkles, BrainCircuit, Loader2, MessageSquare, ListTree, ChevronDown, 
    ChevronUp, FileText, Type, CheckCircle2, Users, Layout, Activity, 
    ArrowUpRight, TrendingUp, TrendingDown, Book, Anchor, PanelLeftClose, 
    PanelLeftOpen, Search, Info, Link as LinkIcon, Flag, Repeat
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CardType, StoryCard, Character, Location, KBArticle, BeatType, SetupPayoff } from './types';
import { TabButton } from './CommonUI';

interface Props {
  cards: Record<string, StoryCard>;
  sceneOrder: string[];
  characters: Character[];
  locations: Location[];
  setupPayoffs: SetupPayoff[];
  knowledgeBase: Record<string, KBArticle>;
  onUpdateCard: (id: string, updates: Partial<StoryCard>) => void;
  onDeleteCard: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (id: string) => void;
  onAssignBeat: (cardId: string, beat: BeatType) => void;
  onUnassignBeat: (cardId: string, beat: BeatType) => void;
  cardScale: number;
  isHydrated: boolean;
  currentProjectId: string;
}

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const TheStoryboard: React.FC<Props> = ({ 
  cards, sceneOrder, characters = [], locations = [], setupPayoffs = [], knowledgeBase = {}, 
  onUpdateCard, onDeleteCard, onAddChild, onAddSibling, onAssignBeat, onUnassignBeat,
  cardScale, isHydrated, currentProjectId
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [kbBeatType, setKbBeatType] = useState<BeatType | null>(null);
  const [writingCardId, setWritingCardId] = useState<string | null>(null);

  const charactersMap = useMemo(() => 
    characters.reduce((acc, char) => ({ ...acc, [char.id]: char }), {} as Record<string, Character>),
    [characters]
  );
  
  const locationsMap = useMemo(() => 
    locations.reduce((acc, loc) => ({ ...acc, [loc.id]: loc }), {} as Record<string, Location>),
    [locations]
  );

  const setupPayoffsMap = useMemo(() => 
    setupPayoffs.reduce((acc, sp) => ({ ...acc, [sp.id]: sp }), {} as Record<string, SetupPayoff>),
    [setupPayoffs]
  );

  const beatAssignments = useMemo(() => {
    const map: Partial<Record<BeatType, string>> = {};
    Object.values(cards).forEach(card => {
        card.associatedBeats?.forEach(beat => {
            map[beat] = card.id;
        });
    });
    return map;
  }, [cards]);

  const handleDragStart = (e: React.DragEvent, beat: BeatType) => {
    e.dataTransfer.setData('text/plain', beat);
    e.dataTransfer.effectAllowed = 'link';
  };

  const acts = useMemo(() => {
    return [
      { name: 'ACT 1', scenes: sceneOrder.slice(0, 10), startIdx: 1 },
      { name: 'ACT 2A', scenes: sceneOrder.slice(10, 20), startIdx: 11 },
      { name: 'ACT 2B', scenes: sceneOrder.slice(20, 30), startIdx: 21 },
      { name: 'ACT 3', scenes: sceneOrder.slice(30), startIdx: 31 }
    ];
  }, [sceneOrder]);

  return (
    <div className="h-full w-full flex bg-[#f8fafc] relative overflow-hidden">
      <aside className="h-full bg-white/90 backdrop-blur-xl border-r border-slate-200 w-16 group hover:w-80 transition-all duration-500 ease-in-out flex flex-col z-30 shadow-2xl shadow-slate-100 overflow-hidden">
        <div className="p-4 flex items-center gap-4 border-b border-slate-100 shrink-0 h-20">
          <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-amber-100 shrink-0">
             <Anchor size={16} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Beats Registry</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 group-hover:p-4 space-y-2">
            {Object.values(BeatType).map((beat) => {
                const assignedCardId = beatAssignments[beat];
                const isAssigned = !!assignedCardId;

                return (
                    <div 
                        key={beat} 
                        draggable={!isAssigned}
                        onDragStart={(e) => handleDragStart(e, beat)}
                        className={`group/item relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                            isAssigned ? 'bg-slate-50 border-slate-100 cursor-default' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg cursor-grab active:cursor-grabbing'
                        } ${isAssigned ? 'h-auto p-2 group-hover:p-4' : 'h-12 group-hover:h-auto p-2 group-hover:p-4'}`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-[10px] font-black uppercase tracking-tight truncate ${
                                    isAssigned ? 'text-slate-300 line-through' : 'text-amber-500'
                                }`}>
                                    {beat.split('. ')[1]}
                                </h3>
                                
                                <div className="hidden group-hover:block mt-2">
                                    {isAssigned ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                            <span className="text-[9px] font-bold text-indigo-400 truncate uppercase tracking-widest">
                                                Linked: {cards[assignedCardId!]?.title}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-[9px] text-slate-400 font-medium">Drag to assign beat</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => setKbBeatType(beat)}
                                    className="p-1.5 rounded-lg transition-all bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 shadow-sm"
                                >
                                    <BookOpen size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </aside>

      <div className="flex-1 overflow-auto custom-scrollbar dot-grid relative transition-all duration-500">
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-32 p-32 min-w-max">
            {acts.map((act, actIdx) => (
              <div key={act.name} className="flex flex-col gap-12 border-t-2 border-slate-100 pt-16 first:border-t-0 first:pt-0">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${actIdx === 0 ? 'bg-indigo-600' : actIdx === 1 ? 'bg-emerald-600' : actIdx === 2 ? 'bg-amber-600' : 'bg-rose-600'}`}>
                    <Flag size={28} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{act.name}</h2>
                  </div>
                </div>

                <div className="flex flex-row gap-32 items-start">
                  {act.scenes.map((sceneId, idx) => (
                    <StoryboardSceneColumn 
                        key={sceneId}
                        sceneId={sceneId}
                        index={act.startIdx + idx}
                        cards={cards}
                        charactersMap={charactersMap}
                        locationsMap={locationsMap}
                        setupPayoffsMap={setupPayoffsMap}
                        onUpdate={onUpdateCard}
                        onDelete={onDeleteCard}
                        onAddChild={onAddChild}
                        onAddSibling={onAddSibling}
                        onEdit={setEditingCardId}
                        onOpenWriter={setWritingCardId}
                        onAssign={onAssignBeat}
                        onUnassignBeat={onUnassignBeat}
                        cardScale={cardScale}
                    />
                  ))}

                  {act.scenes.length > 0 && act.scenes[act.scenes.length - 1] === sceneOrder[sceneOrder.length - 1] && (
                    <button 
                      onClick={() => onAddSibling(sceneOrder[sceneOrder.length - 1])}
                      className="w-80 h-[260px] border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-200 hover:bg-white transition-all group shrink-0 mt-0 self-start"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                          <Plus size={32} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Add Scene</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingCardId && cards[editingCardId] && (
        <STCCardEditor 
          card={cards[editingCardId]} 
          characters={characters} 
          locations={locations}
          setupPayoffs={setupPayoffs}
          onClose={() => setEditingCardId(null)} 
          onUpdate={(updates: any) => onUpdateCard(editingCardId, updates)} 
        />
      )}
      {kbBeatType && (
        <KBViewer 
          beatType={kbBeatType} 
          knowledgeBase={knowledgeBase}
          onClose={() => setKbBeatType(null)} 
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

const StoryboardSceneColumn = ({ 
    sceneId, index, cards, charactersMap, locationsMap, setupPayoffsMap, onUpdate, onDelete, onAddChild, 
    onAddSibling, onEdit, onOpenWriter, onAssign, onUnassignBeat, cardScale 
}: any) => {
  const scene = cards[sceneId];
  if (!scene) return null;

  const childChapters = scene.children || [];

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="relative mb-16 w-[400px] flex flex-col items-center">
        <NarrativeCard 
          card={scene}
          index={index}
          cards={cards}
          charactersMap={charactersMap}
          locationsMap={locationsMap}
          setupPayoffsMap={setupPayoffsMap}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenWriter={onOpenWriter}
          onAddChild={() => onAddChild(sceneId)}
          onAddSibling={() => onAddSibling(sceneId)}
          onAssign={onAssign}
          onUnassignBeat={onUnassignBeat}
          cardScale={cardScale}
          isSceneRoot
        />
        
        {childChapters.length > 0 && (
          <div className="w-0.5 h-16 bg-slate-200" />
        )}
      </div>

      <div className="relative">
        {childChapters.length > 0 && (
          <>
            {childChapters.length > 1 && (
              <div 
                className="absolute top-0 h-0.5 bg-slate-200" 
                style={{ 
                  left: '170px', 
                  right: '170px' 
                }} 
              />
            )}
            
            <div className="flex flex-row gap-12 items-start relative">
                {childChapters.map((chapterId: string, cIdx: number) => (
                    <div key={chapterId} className="flex flex-col items-center relative">
                        <div className="w-0.5 h-8 bg-slate-200" />
                        
                        <div className="w-[340px]">
                            <NarrativeCard 
                                card={cards[chapterId]}
                                index={`${index}.${cIdx + 1}`}
                                cards={cards}
                                charactersMap={charactersMap}
                                locationsMap={locationsMap}
                                setupPayoffsMap={setupPayoffsMap}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onOpenWriter={onOpenWriter}
                                onAddSibling={() => onAddSibling(chapterId)}
                                onAssign={onAssign}
                                onUnassignBeat={onUnassignBeat}
                                cardScale={cardScale}
                            />
                        </div>
                    </div>
                ))}
            </div>
          </>
        )}

        {childChapters.length === 0 && (
           <div className="flex flex-col items-center">
             <div className="w-0.5 h-8 bg-slate-200 opacity-40" />
             <button 
               onClick={() => onAddChild(sceneId)}
               className="w-[340px] h-20 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-100 hover:bg-white transition-all opacity-40 hover:opacity-100"
             >
               <Plus size={16} className="mr-2" />
               <span className="text-[10px] font-black uppercase tracking-widest">Add Action Chapter</span>
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

const NarrativeCard = ({ 
    card, index, cards, onEdit, onDelete, onOpenWriter, onAddChild, onAddSibling, 
    onAssign, onUnassignBeat, cardScale, isSceneRoot, charactersMap, locationsMap, setupPayoffsMap 
}: any) => {
  if (!card) return null;
  const [isDragOver, setIsDragOver] = useState(false);

  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;
  const associatedSPs = (card.associatedSetupPayoffIds || []).map((id: string) => setupPayoffsMap[id]).filter(Boolean);
  
  const wordCount = useMemo(() => {
    const getCount = (content?: string) => (content || '').split(/\s+/).filter(Boolean).length;
    
    if (isSceneRoot) {
      return (card.children || []).reduce((acc: number, childId: string) => {
        const child = cards[childId];
        return acc + getCount(child?.draftContent);
      }, 0);
    }
    return getCount(card.draftContent);
  }, [card, cards, isSceneRoot]);

  const chapterSummary = useMemo(() => {
    if (!isSceneRoot || !card.children || card.children.length === 0) return null;
    return card.children
      .map((childId: string) => cards[childId]?.title)
      .filter(Boolean)
      .join(" • ");
  }, [card.children, cards, isSceneRoot]);

  const defaultDesc = isSceneRoot ? "Enter blueprint details..." : "Enter narrative details...";
  const isDescriptionDefault = !card.description || card.description === defaultDesc;
  
  const displayDescription = (isDescriptionDefault && chapterSummary) 
    ? chapterSummary 
    : (card.description || defaultDesc);

  const isShowingSummary = isDescriptionDefault && !!chapterSummary;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const beat = e.dataTransfer.getData('text/plain') as BeatType;
    if (beat && onAssign) {
      onAssign(card.id, beat);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full ${isSceneRoot ? 'min-h-[220px]' : 'min-h-[180px]'} border bg-white border-slate-200 rounded-[24px] p-4 flex flex-col group transition-all relative z-10 overflow-hidden cursor-pointer ${
        isSceneRoot ? 'border-l-indigo-600 border-l-4 shadow-beat' : 'border-l-teal-400 border-l-4 shadow-scene'
      } ${isDragOver ? 'ring-4 ring-amber-400 ring-offset-2 scale-[1.02] shadow-2xl' : 'hover:shadow-2xl hover:-translate-y-1'}`}
      onClick={() => onEdit(card.id)}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur-sm rounded-lg p-1">
         <button onClick={(e) => { e.stopPropagation(); onOpenWriter(card.id); }} className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"><FileText size={12} /></button>
         <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={12} /></button>
      </div>

      <div className="flex flex-col gap-1 mb-2 flex-1 min-h-0">
        <h3 className="font-black text-slate-900 uppercase tracking-tight leading-tight flex items-center gap-2 mb-1" style={{ fontSize: `${12 * cardScale}px` }}>
          <span className={`shrink-0 min-w-[22px] h-5 rounded-md flex items-center justify-center text-[9px] font-black tracking-tighter ${isSceneRoot ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
            {index}
          </span>
          <span className="truncate">{card.title}</span>
        </h3>
        <p className={`font-desc leading-relaxed italic opacity-80 overflow-hidden line-clamp-2 mb-2 ${isShowingSummary ? 'text-indigo-600 font-bold' : 'text-slate-500'}`} style={{ fontSize: `${10 * cardScale}px` }}>
          {isShowingSummary && <span className="text-[8px] font-black uppercase tracking-widest mr-2 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 not-italic">Summary</span>}
          {displayDescription}
        </p>
      </div>

      {/* Relational Tickets (Badges) Layer */}
      {( (card.tags && card.tags.length > 0) || primaryLoc || associatedSPs.length > 0 ) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {primaryLoc && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
              <MapPin size={8} />
              {primaryLoc.name}
            </div>
          )}
          {associatedSPs.map((sp: SetupPayoff) => (
            <div key={sp.id} className="flex items-center gap-1 px-2 py-0.5 bg-sky-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm">
              <Repeat size={8} />
              {sp.title}
            </div>
          ))}
          {card.tags?.map((tag: any) => (
            <div key={tag.id} className={`flex items-center gap-1 px-2 py-0.5 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm ${tag.category === 'character' ? 'bg-emerald-600' : 'bg-slate-500'}`}>
              <User size={8} />
              {tag.label}
            </div>
          ))}
        </div>
      )}

      {card.associatedBeats && card.associatedBeats.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
            {card.associatedBeats.map((beat: BeatType) => (
                <div 
                    key={beat} 
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-md shadow-amber-200"
                    onClick={(e) => { e.stopPropagation(); onUnassignBeat(card.id, beat); }}
                >
                    <Anchor size={8} />
                    {beat.split('. ')[1]}
                    <X size={7} className="opacity-60 hover:opacity-100" />
                </div>
            ))}
        </div>
      )}
      
      <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
           {charA && (
             <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white ${charA.isVillain ? 'bg-rose-500' : 'bg-emerald-500'} shadow-sm border border-white tracking-tighter`}>
               {getInitials(charA.name)}
             </div>
           )}
           {charB && (
             <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black text-white ${charB.isVillain ? 'bg-rose-500' : 'bg-emerald-500'} shadow-sm border border-white -ml-1 tracking-tighter`}>
               {getInitials(charB.name)}
             </div>
           )}
        </div>

        <div className="flex items-center gap-1.5">
            {card.emotionalValue && (
                <div className={`p-0.5 rounded-md ${card.emotionalValue === 'POSITIVE' ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                    {card.emotionalValue === 'POSITIVE' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                </div>
            )}
            <span className={`text-[8px] font-black px-1 py-0.5 rounded-md uppercase tracking-widest ${wordCount > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-slate-300'}`}>
                {wordCount} W
            </span>
        </div>
      </div>

      <>
          <button 
              onClick={(e) => { e.stopPropagation(); onAddSibling(card.id); }} 
              className="absolute top-1/2 -right-3 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1 rounded-full shadow-lg hover:scale-110 transition-all z-40 text-slate-400 hover:text-indigo-600 active:scale-90"
          >
              <Plus size={10} />
          </button>
          {isSceneRoot && (
              <button 
                  onClick={(e) => { e.stopPropagation(); onAddChild(card.id); }} 
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1 rounded-full shadow-lg hover:scale-110 transition-all z-40 text-slate-400 hover:text-indigo-600 active:scale-90"
              >
                  <Plus size={10} />
              </button>
          )}
      </>
    </div>
  );
};

const DraftingRoom = ({ card, cards, onClose, onUpdate, charactersMap, locationsMap }: { card: StoryCard, cards: Record<string, StoryCard>, onClose: () => void, onUpdate: (u: Partial<StoryCard>) => void, charactersMap: Record<string, Character>, locationsMap: Record<string, Location> }) => {
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;
  const wordCount = (card.draftContent || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-y-0 right-0 w-full bg-white shadow-2xl z-[2000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b flex items-center justify-between shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ChevronRight size={32} /></button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{card.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X size={24} /></button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white flex flex-col">
          <div className="w-full px-12 py-16 flex flex-col gap-10">
            <div className="flex items-center justify-between text-slate-300 border-b border-slate-50 pb-6">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Live Vault Sync</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">{wordCount} words</span>
            </div>
            <input value={card.chapterTitle || ''} onChange={e => onUpdate({ chapterTitle: e.target.value })} placeholder="Reader Facing Chapter Title..." className="w-full bg-transparent border-none p-0 text-5xl font-black text-slate-900 tracking-tight focus:ring-0 placeholder:text-slate-100 font-desc" />
            <textarea autoFocus value={card.draftContent || ''} onChange={e => onUpdate({ draftContent: e.target.value })} placeholder="The scene begins..." className="flex-1 w-full bg-transparent border-none focus:ring-0 p-0 text-3xl font-desc leading-[1.8] text-slate-800 resize-none placeholder:text-slate-50 min-h-[600px] pb-40" />
          </div>
        </div>
        <aside className="w-80 bg-slate-50/50 border-l border-slate-100 flex flex-col p-8 gap-8 shrink-0 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-slate-400"><Sparkles size={16} /><h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Blueprint</h4></div>
             <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden">
               <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">{card.title}</h5>
               <p className="text-xs font-desc italic leading-relaxed text-slate-500">{card.description || "No narrative blueprint defined."}</p>
             </div>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-rose-400"><Swords size={16} /><h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Conflict</h4></div>
             <div className="p-5 bg-rose-50/30 rounded-3xl border border-rose-100/30">
               {charA && charB ? (
                 <p className="text-[11px] font-black uppercase text-rose-600">{charA.name} vs {charB.name}</p>
               ) : (
                 <p className="text-xs font-bold text-slate-700">{card.conflict || "Internal Struggle"}</p>
               )}
             </div>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-indigo-500"><MapPin size={16} /><h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Setting</h4></div>
             <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm"><MapPin size={14} className="text-indigo-400"/><span className="text-xs font-black text-slate-700">{primaryLoc?.name || "Unset Location"}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const KBViewer = ({ beatType, knowledgeBase = {}, onClose }: { beatType: BeatType, knowledgeBase?: Record<string, KBArticle>, onClose: () => void }) => {
  const article = knowledgeBase[beatType];
  const [coachingAdvice, setCoachingAdvice] = useState<string | null>(null);
  const [isCoaching, setIsCoaching] = useState(false);

  const handleCallCoach = async () => {
    setIsCoaching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Coaching Request for ${beatType}. Context: ${article?.content}`,
      });
      setCoachingAdvice(response.text);
    } catch (err: any) {
      alert("Mentor is offline.");
    } finally {
      setIsCoaching(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white text-slate-900 shadow-2xl z-[2001] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-5">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><ChevronRight size={32} /></button>
          <div><h3 className="text-2xl font-bold tracking-tight text-slate-900">{beatType}</h3><span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Master Methodology</span></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-10">
        <div className="p-6 bg-amber-50/30 border border-amber-100 rounded-[32px] space-y-4">
          <div className="flex items-center gap-3 text-amber-600"><Sparkles size={24} /><h4 className="text-sm font-black uppercase tracking-[0.2em]">Insight</h4></div>
          <p className="text-xl font-desc italic leading-relaxed text-slate-700">{article?.content || "No advice found."}</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-indigo-600"><BrainCircuit size={24} /><h4 className="text-sm font-black uppercase tracking-[0.2em]">Mentor AI</h4></div>
          <button onClick={handleCallCoach} disabled={isCoaching} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
            {isCoaching ? <Loader2 size={12} className="animate-spin" /> : <MessageSquare size={12} />} Call Coach
          </button>
          {coachingAdvice && <div className="p-8 bg-indigo-50 border-2 border-indigo-100 rounded-[32px] animate-in fade-in zoom-in-95 duration-500"><p className="text-lg font-desc italic leading-relaxed text-slate-800">{coachingAdvice}</p></div>}
        </div>
      </div>
    </div>
  );
};

const STCCardEditor = ({ card, onClose, onUpdate, characters, locations, setupPayoffs }: any) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'STC' | 'TAGS'>('STORY');
  
  const toggleTag = (tagId: string, label: string, category: 'character' | 'location' | 'setuppayoff') => {
    if (category === 'setuppayoff') {
        const isLinked = card.associatedSetupPayoffIds?.includes(tagId);
        const newList = isLinked 
          ? (card.associatedSetupPayoffIds || []).filter((id: string) => id !== tagId) 
          : [...(card.associatedSetupPayoffIds || []), tagId];
        onUpdate({ associatedSetupPayoffIds: newList });
        return;
    }
    const isTagged = card.tags?.some((t: any) => t.id === tagId);
    const newTags = isTagged 
      ? (card.tags || []).filter((t: any) => t.id !== tagId) 
      : [...(card.tags || []), { id: tagId, label, category }];
    onUpdate({ tags: newTags });
  };

  const setLocation = (locId: string) => {
    onUpdate({ primaryLocationId: card.primaryLocationId === locId ? null : locId });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full text-slate-500"><ChevronRight size={32} /></button>
          <div><h3 className="text-2xl font-bold text-slate-900">{card.title}</h3><span className="text-base font-black uppercase text-slate-400 tracking-widest">Chapter Context</span></div>
        </div>
      </div>
      <div className="flex border-b">
        <TabButton active={activeTab === 'STORY'} label="Blueprint" onClick={() => setActiveTab('STORY')} />
        <TabButton active={activeTab === 'STC'} label="Transition" onClick={() => setActiveTab('STC')} />
        <TabButton active={activeTab === 'TAGS'} label="Relational" onClick={() => setActiveTab('TAGS')} />
      </div>
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
        {activeTab === 'STORY' && (
          <div className="space-y-10">
            <div className="space-y-4"><label className="text-base font-black uppercase text-slate-400 tracking-widest">Internal Title</label><input value={card.title} onChange={e => onUpdate({ title: e.target.value })} className="w-full text-2xl font-bold border-none p-0 focus:ring-0" /></div>
            <div className="space-y-4"><label className="text-base font-black uppercase text-slate-400 tracking-widest">Reader Facing Title</label><input value={card.chapterTitle || ''} onChange={e => onUpdate({ chapterTitle: e.target.value })} className="w-full text-2xl font-desc italic border-none p-0 focus:ring-0" placeholder="e.g. The Quiet Dawn" /></div>
            <div className="space-y-4"><label className="text-base font-black uppercase text-slate-400 tracking-widest">Narrative Action</label><textarea value={card.description} onChange={e => onUpdate({ description: e.target.value })} className="w-full h-64 text-xl text-slate-600 border-none p-0 focus:ring-0 resize-none font-desc leading-relaxed" /></div>
          </div>
        )}
        {activeTab === 'STC' && (
          <div className="space-y-12">
            <div className="space-y-6"><label className="text-base font-black uppercase text-slate-400 tracking-widest">Emotional Arc (+/-)</label><div className="flex bg-slate-100 p-2 rounded-3xl border border-slate-200"><button onClick={() => onUpdate({ emotionalValue: 'POSITIVE' })} className={`flex-1 py-5 rounded-2xl text-lg font-bold transition-all ${card.emotionalValue === 'POSITIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Positive (+)</button><button onClick={() => onUpdate({ emotionalValue: 'NEGATIVE' })} className={`flex-1 py-5 rounded-2xl text-lg font-bold transition-all ${card.emotionalValue === 'NEGATIVE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Negative (-)</button></div></div>
            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-3"><Swords size={20} /> Narrative Tension</label>
              <div className="grid grid-cols-2 gap-6">
                <select value={card.conflictSubjectAId || ''} onChange={e => onUpdate({ conflictSubjectAId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold appearance-none"><option value="">Side A...</option>{characters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={card.conflictSubjectBId || ''} onChange={e => onUpdate({ conflictSubjectBId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold appearance-none"><option value="">Side B...</option>{characters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'TAGS' && (
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Primary Setting</label>
              <div className="grid grid-cols-2 gap-3">
                {locations.map((loc: any) => (
                  <button key={loc.id} onClick={() => setLocation(loc.id)} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${card.primaryLocationId === loc.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-100'}`}>{loc.name}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-8 border-t border-slate-50">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Repeat size={14} className="text-sky-500" /> Setup & Payoff Loops</label>
              <div className="grid grid-cols-2 gap-3">
                {setupPayoffs.map((sp: any) => (
                  <button key={sp.id} onClick={() => toggleTag(sp.id, sp.title, 'setuppayoff')} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${card.associatedSetupPayoffIds?.includes(sp.id) ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-sky-100'}`}>{sp.title}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-8 border-t border-slate-50">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Users size={14} className="text-emerald-500" /> Cast Engagement</label>
              <div className="grid grid-cols-2 gap-3">
                {characters.map((char: any) => (
                  <button key={char.id} onClick={() => toggleTag(char.id, char.name, 'character')} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${card.tags?.some((t: any) => t.id === char.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-100'}`}>{char.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheStoryboard;
