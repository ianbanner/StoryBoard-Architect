import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Edit3, Trash2, Swords, Plus, ChevronRight, MapPin, User, X, BookOpen, 
    Sparkles, BrainCircuit, Loader2, MessageSquare, ListTree, ChevronDown, 
    ChevronUp, FileText, Type, CheckCircle2, Users, Layout, Activity, 
    ArrowUpRight, TrendingUp, TrendingDown, Book, Anchor, PanelLeftClose, 
    PanelLeftOpen, Search, Info, Link as LinkIcon, Flag, Repeat, Footprints, Target,
    PlusCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { CardType, StoryCard, Character, Location, KBArticle, BeatType, SetupPayoff, SPPart } from './types';
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
  onAssignSPPart: (cardId: string, spId: string, part: SPPart) => void;
  onUnassignSPPart: (cardId: string, spId: string, part: SPPart) => void;
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
  onAssignSPPart, onUnassignSPPart,
  cardScale, isHydrated, currentProjectId
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [kbBeatType, setKbBeatType] = useState<BeatType | string | null>(null);
  const [assigningBeat, setAssigningBeat] = useState<BeatType | null>(null);
  const [assigningSP, setAssigningSP] = useState<{ id: string, part: SPPart, title: string } | null>(null);
  const [writingCardId, setWritingCardId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic: position the card on the left to clear the editor panel
  useEffect(() => {
    if (editingCardId && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`card-anchor-${editingCardId}`);
        const container = scrollContainerRef.current;
        if (element && container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeLeft = elementRect.left - containerRect.left;
          container.scrollBy({ 
            left: relativeLeft - 80, 
            behavior: 'smooth' 
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [editingCardId]);

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
    // Fix: Explicitly cast Object.values to StoryCard[] to avoid 'unknown' type errors
    (Object.values(cards) as StoryCard[]).forEach(card => {
        card.associatedBeats?.forEach(beat => {
            map[beat] = card.id;
        });
    });
    return map;
  }, [cards]);

  const spAssignments = useMemo(() => {
    const map: Record<string, string> = {};
    // Fix: Explicitly cast Object.values to StoryCard[] to avoid 'unknown' type errors
    (Object.values(cards) as StoryCard[]).forEach(card => {
        card.linkedSetupPayoffs?.forEach(link => {
            map[`${link.id}:${link.part}`] = card.id;
        });
    });
    return map;
  }, [cards]);

  const acts = useMemo(() => {
    return [
      { name: 'ACT 1', scenes: sceneOrder.slice(0, 10), startIdx: 1, color: 'bg-indigo-600' },
      { name: 'ACT 2A', scenes: sceneOrder.slice(10, 20), startIdx: 11, color: 'bg-emerald-600' },
      { name: 'ACT 2B', scenes: sceneOrder.slice(20, 30), startIdx: 21, color: 'bg-amber-600' },
      { name: 'ACT 3', scenes: sceneOrder.slice(30), startIdx: 31, color: 'bg-rose-600' }
    ];
  }, [sceneOrder]);

  return (
    <div className="h-full w-full flex bg-[#f8fafc] relative overflow-hidden">
      
      {/* Sidebars for Beats and Setup/Payoff */}
      <div className="h-full flex z-30 shrink-0">
        
        {/* Beats Registry Sidebar */}
        <aside className="h-full bg-white border-r border-slate-100 w-16 group/left hover:w-80 transition-all duration-500 ease-in-out flex flex-col shadow-2xl shadow-slate-100 overflow-hidden relative">
          <div className="p-4 flex items-center gap-4 border-b border-slate-100 shrink-0 h-20">
            <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-amber-100 shrink-0">
               <Anchor size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 opacity-0 group-hover/left:opacity-100 transition-opacity duration-300 whitespace-nowrap">Beats Registry</h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 group-hover/left:p-4 space-y-2">
              {Object.values(BeatType).map((beat) => {
                  const assignedCardId = beatAssignments[beat];
                  const isAssigned = !!assignedCardId;
                  return (
                      <div 
                          key={beat} 
                          className={`group/item relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                              isAssigned ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg'
                          } ${isAssigned ? 'h-auto p-2 group-hover/left:p-4' : 'h-12 group-hover/left:h-auto p-2 group-hover/left:p-4'}`}
                      >
                          <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                  <h3 className={`text-[10px] font-black uppercase tracking-tight truncate ${
                                      isAssigned ? 'text-slate-300 line-through' : 'text-amber-500'
                                  }`}>
                                      {beat.split('. ')[1]}
                                  </h3>
                                  <div className="hidden group-hover/left:block mt-2">
                                      {isAssigned ? (
                                          <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                              <span className="text-[9px] font-bold text-indigo-400 truncate uppercase tracking-widest">
                                                  Linked: {cards[assignedCardId!]?.title}
                                              </span>
                                          </div>
                                      ) : (
                                          <p className="text-[9px] text-slate-400 font-medium">Click Link to assign</p>
                                      )}
                                  </div>
                              </div>
                              <div className="opacity-0 group-hover/left:opacity-100 transition-opacity flex gap-1">
                                  {!isAssigned && (
                                      <button 
                                          onClick={() => setAssigningBeat(beat)}
                                          className="p-1.5 rounded-lg transition-all bg-amber-500 border border-amber-600 text-white hover:bg-amber-600 shadow-sm"
                                          title="Link to Narrative Unit"
                                      >
                                          <LinkIcon size={12} />
                                      </button>
                                  )}
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

        {/* Setup/Payoff Sidebar */}
        <aside className="h-full bg-white border-r border-slate-100 w-16 group/right hover:w-80 transition-all duration-500 ease-in-out flex flex-col shadow-2xl shadow-slate-100 overflow-hidden relative">
          <div className="p-4 flex items-center gap-4 border-b border-slate-100 shrink-0 h-20">
            <div className="w-8 h-8 bg-sky-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-sky-100 shrink-0">
               <Repeat size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 opacity-0 group-hover/right:opacity-100 transition-opacity duration-300 whitespace-nowrap">Loops</h2>
            <button 
                onClick={() => setKbBeatType("setup and pay off overview")}
                className="ml-auto opacity-0 group-hover/right:opacity-100 p-1.5 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-sky-600 transition-all shadow-sm"
            >
                <BookOpen size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 group-hover/right:p-4 space-y-8">
              {setupPayoffs.map((sp) => {
                  const parts: SPPart[] = ['SETUP', 'BUMP', 'PAYOFF'];
                  return (
                      <div key={sp.id} className="space-y-3">
                          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest truncate group-hover/right:block hidden px-1">
                             {sp.title}
                          </h3>
                          <div className="space-y-2">
                              {parts.map(part => {
                                  const assignedId = spAssignments[`${sp.id}:${part}`];
                                  const isAssigned = !!assignedId;
                                  const colorClass = part === 'SETUP' ? 'bg-sky-500' : part === 'BUMP' ? 'bg-violet-500' : 'bg-emerald-500';
                                  return (
                                      <div key={part} className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${isAssigned ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-sky-300'}`}>
                                          <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded text-white ${colorClass}`}>{part[0]}</span>
                                                  <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isAssigned ? 'line-through text-slate-300' : 'text-slate-700'}`}>{sp.title}</span>
                                              </div>
                                          </div>
                                          {!isAssigned && (
                                              <button 
                                                  onClick={() => setAssigningSP({ id: sp.id, part, title: sp.title })}
                                                  className="opacity-0 group-hover/right:opacity-100 p-1.5 rounded-lg bg-sky-500 text-white"
                                              >
                                                  <LinkIcon size={10} />
                                              </button>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })}
          </div>
        </aside>
      </div>

      {/* Main Canvas with Kanban Scrolling Acts */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar dot-grid relative transition-all duration-500">
        <div className="flex flex-col gap-32 p-32 min-w-max">
          {acts.map((act) => (
            <div key={act.name} className="flex flex-col gap-12 border-t-2 border-slate-100 pt-16 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${act.color}`}>
                  <Flag size={28} />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{act.name}</h2>
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
                      onUnassignSPPart={onUnassignSPPart}
                      cardScale={cardScale}
                  />
                ))}
                
                {act.scenes.length > 0 && act.scenes[act.scenes.length - 1] === sceneOrder[sceneOrder.length - 1] && (
                  <button 
                    onClick={() => onAddSibling(sceneOrder[sceneOrder.length - 1])}
                    className="w-80 h-48 border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-200 transition-all shrink-0 self-start"
                  >
                    <Plus size={32} />
                    <span className="text-xs font-black uppercase tracking-widest mt-2">New Scene</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlays and Editors */}
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
      {assigningBeat && (
        <BeatAssignmentSelector 
          beat={assigningBeat}
          cards={cards}
          sceneOrder={sceneOrder}
          onAssign={(cardId) => {
            onAssignBeat(cardId, assigningBeat);
            setAssigningBeat(null);
          }}
          onClose={() => setAssigningBeat(null)}
        />
      )}
      {assigningSP && (
        <SPAssignmentSelector 
          sp={assigningSP}
          cards={cards}
          sceneOrder={sceneOrder}
          onAssign={(cardId) => {
            onAssignSPPart(cardId, assigningSP.id, assigningSP.part);
            setAssigningSP(null);
          }}
          onClose={() => setAssigningSP(null)}
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

const StoryboardSceneColumn = ({ sceneId, index, cards, charactersMap, locationsMap, setupPayoffsMap, onUpdate, onDelete, onAddChild, onAddSibling, onEdit, onOpenWriter, onAssign, onUnassignBeat, onUnassignSPPart, cardScale }: any) => {
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
          onUnassignSPPart={onUnassignSPPart}
          cardScale={cardScale}
          isSceneRoot
        />
        {childChapters.length > 0 && <div className="w-0.5 h-16 bg-slate-200" />}
      </div>

      <div className="flex flex-row gap-12 items-start relative">
          {childChapters.map((chapterId: string, cIdx: number) => (
              <div key={chapterId} className="flex flex-col items-center relative w-[340px]">
                  <div className="w-0.5 h-8 bg-slate-200" />
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
                      onUnassignSPPart={onUnassignSPPart}
                      cardScale={cardScale}
                  />
              </div>
          ))}
          {childChapters.length === 0 && (
             <button 
               onClick={() => onAddChild(sceneId)}
               className="w-full mt-8 p-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
             >
               <Plus size={16} /> Add Action Chapter
             </button>
          )}
      </div>
    </div>
  );
};

const NarrativeCard = ({ card, index, cards, onEdit, onDelete, onOpenWriter, onAddChild, onAddSibling, onAssign, onUnassignBeat, onUnassignSPPart, cardScale, isSceneRoot, charactersMap, locationsMap, setupPayoffsMap }: any) => {
  if (!card) return null;
  const wordCount = (card.draftContent || '').split(/\s+/).filter(Boolean).length;
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;

  return (
    <div 
      id={`card-anchor-${card.id}`}
      className={`w-full min-h-[200px] bg-white border rounded-[32px] p-6 flex flex-col group transition-all relative cursor-pointer hover:shadow-2xl ${isSceneRoot ? 'border-l-indigo-600 border-l-8' : 'border-l-teal-400 border-l-8 shadow-sm'}`}
      onClick={() => onEdit(card.id)}
    >
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={(e) => { e.stopPropagation(); onOpenWriter(card.id); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><FileText size={14} /></button>
         <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isSceneRoot ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {index}
          </span>
          {card.title}
        </h3>
        <p className="font-desc text-slate-500 italic text-xs leading-relaxed line-clamp-3">
          {card.description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
          {primaryLoc && <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black uppercase flex items-center gap-1"><MapPin size={8}/>{primaryLoc.name}</div>}
          {card.associatedBeats?.map((beat: BeatType) => (
              <div key={beat} className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[8px] font-black uppercase flex items-center gap-1"><Anchor size={8}/>{beat.split('. ')[1]}</div>
          ))}
          {card.linkedSetupPayoffs?.map((link: any) => (
              <div key={`${link.id}:${link.part}`} className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase flex items-center gap-1 text-white ${link.part === 'SETUP' ? 'bg-sky-500' : link.part === 'BUMP' ? 'bg-violet-500' : 'bg-emerald-500'}`}>{link.part[0]}</div>
          ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex -space-x-2">
           {charA && <div className={`w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center text-[9px] font-black text-white ${charA.isVillain ? 'bg-rose-500' : 'bg-emerald-500'}`}>{getInitials(charA.name)}</div>}
           {charB && <div className={`w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center text-[9px] font-black text-white ${charB.isVillain ? 'bg-rose-500' : 'bg-emerald-500'}`}>{getInitials(charB.name)}</div>}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{wordCount} Words</span>
            {card.emotionalValue && (
                <div className={card.emotionalValue === 'POSITIVE' ? 'text-emerald-500' : 'text-rose-500'}>
                    {card.emotionalValue === 'POSITIVE' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                </div>
            )}
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onAddSibling(card.id); }} 
        className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110 active:scale-95"
      >
        <Plus size={20} />
      </button>
    </div>
  );
};

// Simplified sub-components for Modals
const KBViewer = ({ beatType, knowledgeBase, onClose }: any) => {
    const article = knowledgeBase[beatType];
    return (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold">{beatType}</h3>
                <button onClick={onClose}><X size={24}/></button>
            </div>
            <div className="p-10 font-desc text-slate-700 italic leading-relaxed text-lg">
                {article?.content || "No advice available."}
            </div>
        </div>
    );
};

const SPAssignmentSelector = ({ sp, cards, sceneOrder, onAssign, onClose }: any) => {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black">Link {sp.part}: {sp.title}</h3>
                    <button onClick={onClose}><X size={24}/></button>
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                    {sceneOrder.map(id => (
                        <button key={id} onClick={() => onAssign(id)} className="w-full p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl text-left font-bold text-slate-700">
                            {cards[id]?.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BeatAssignmentSelector = ({ beat, cards, sceneOrder, onAssign, onClose }: any) => {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black">Link Beat: {beat.split('. ')[1]}</h3>
                    <button onClick={onClose}><X size={24}/></button>
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                    {sceneOrder.map(id => (
                        <button key={id} onClick={() => onAssign(id)} className="w-full p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl text-left font-bold text-slate-700">
                            {cards[id]?.title}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const STCCardEditor = ({ card, characters, locations, setupPayoffs, onClose, onUpdate }: any) => {
    const [activeTab, setActiveTab] = useState<'CONTENT' | 'STC' | 'RELATIONS'>('CONTENT');
    return (
        <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><ChevronRight size={24}/></button>
                    <h3 className="text-xl font-bold">{card.title}</h3>
                </div>
            </div>
            <div className="flex border-b">
                <TabButton active={activeTab === 'CONTENT'} label="Narrative" onClick={() => setActiveTab('CONTENT')} />
                <TabButton active={activeTab === 'STC'} label="Logic" onClick={() => setActiveTab('STC')} />
                <TabButton active={activeTab === 'RELATIONS'} label="Cast & World" onClick={() => setActiveTab('RELATIONS')} />
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {activeTab === 'CONTENT' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Card Title</label>
                            <input value={card.title} onChange={e => onUpdate({ title: e.target.value })} className="w-full text-2xl font-black border-none focus:ring-0 p-0" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Action Summary</label>
                            <textarea value={card.description} onChange={e => onUpdate({ description: e.target.value })} className="w-full h-40 text-lg font-desc italic border-none focus:ring-0 p-0 resize-none" />
                        </div>
                    </div>
                )}
                {activeTab === 'STC' && (
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Emotional Pivot</label>
                            <div className="flex bg-slate-100 p-2 rounded-2xl">
                                <button onClick={() => onUpdate({ emotionalValue: 'POSITIVE' })} className={`flex-1 py-4 rounded-xl font-black transition-all ${card.emotionalValue === 'POSITIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Positive (+)</button>
                                <button onClick={() => onUpdate({ emotionalValue: 'NEGATIVE' })} className={`flex-1 py-4 rounded-xl font-black transition-all ${card.emotionalValue === 'NEGATIVE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>Negative (-)</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Conflict</label>
                            <div className="grid grid-cols-2 gap-4">
                                <select value={card.conflictSubjectAId || ''} onChange={e => onUpdate({ conflictSubjectAId: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-sm">
                                    <option value="">Side A...</option>
                                    {characters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={card.conflictSubjectBId || ''} onChange={e => onUpdate({ conflictSubjectBId: e.target.value })} className="w-full bg-slate-50 border-none rounded-xl p-4 font-bold text-sm">
                                    <option value="">Side B...</option>
                                    {characters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'RELATIONS' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Setting</label>
                            <div className="flex flex-wrap gap-2">
                                {locations.map((loc: any) => (
                                    <button 
                                        key={loc.id} 
                                        onClick={() => onUpdate({ primaryLocationId: card.primaryLocationId === loc.id ? null : loc.id })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${card.primaryLocationId === loc.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                                    >
                                        {loc.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DraftingRoom = ({ card, onClose, onUpdate }: any) => {
    return (
        <div className="fixed inset-y-0 left-0 w-full bg-white z-[3000] flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="h-20 border-b flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full"><ChevronDown size={28}/></button>
                    <h2 className="text-2xl font-black">{card.title}</h2>
                </div>
                <button onClick={onClose} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs">Save & Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-20 max-w-4xl mx-auto w-full">
                <textarea 
                    autoFocus
                    value={card.draftContent || ''} 
                    onChange={e => onUpdate({ draftContent: e.target.value })} 
                    className="w-full h-full border-none focus:ring-0 p-0 font-desc text-3xl leading-relaxed italic text-slate-800 resize-none min-h-[800px]"
                    placeholder="The scene begins..."
                />
            </div>
        </div>
    );
};

export default TheStoryboard;