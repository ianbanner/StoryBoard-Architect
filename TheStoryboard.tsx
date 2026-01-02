
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Edit3, Trash2, Swords, Plus, ChevronRight, MapPin, User, X, BookOpen, Sparkles, BrainCircuit, Loader2, MessageSquare } from 'lucide-react';
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
  cards, beatOrder, characters, locations, knowledgeBase = {}, onUpdateCard, onDeleteCard, onAddChild, onAddSibling, shouldRenderCard, isCardMatching, visibilityMode, cardScale 
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [kbCardId, setKbCardId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const targetId = editingCardId || kbCardId;
    if (targetId && cardRefs.current[targetId]) {
      cardRefs.current[targetId]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest'
      });
    }
  }, [editingCardId, kbCardId]);

  const safeKB = knowledgeBase || {};
  const charactersMap = useMemo(() => 
    characters.reduce((acc, char) => ({ ...acc, [char.id]: char }), {} as Record<string, Character>),
    [characters]
  );
  
  const locationsMap = useMemo(() => 
    locations.reduce((acc, loc) => ({ ...acc, [loc.id]: loc }), {} as Record<string, Location>),
    [locations]
  );

  return (
    <div className="min-w-max pb-40">
      <div className="flex flex-row items-start gap-16 relative">
        {beatOrder.filter(id => shouldRenderCard(id)).map(id => (
          <HierarchyGroup 
            key={id} 
            id={id} 
            cards={cards} 
            charactersMap={charactersMap}
            locationsMap={locationsMap}
            onUpdate={onUpdateCard} 
            onDelete={onDeleteCard} 
            onAddChild={onAddChild} 
            onAddSibling={onAddSibling} 
            onEdit={setEditingCardId} 
            onOpenKB={setKbCardId}
            isHighlighted={isCardMatching(id)} 
            visibilityMode={visibilityMode} 
            shouldRenderCard={shouldRenderCard}
            cardScale={cardScale} 
            cardRefs={cardRefs}
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
          knowledgeBase={safeKB}
          onClose={() => setKbCardId(null)} 
        />
      )}
    </div>
  );
};

const HierarchyGroup = ({ id, cards, charactersMap, locationsMap, onUpdate, onDelete, onAddChild, onAddSibling, onEdit, onOpenKB, isHighlighted, visibilityMode, shouldRenderCard, cardScale, cardRefs }: any) => {
  const card = cards[id];
  if (!card) return null;
  const children = (card.children || []).filter((cid: string) => shouldRenderCard(cid));
  return (
    <div className="flex flex-col items-center">
      <NarrativeCard 
        card={card} 
        charactersMap={charactersMap}
        locationsMap={locationsMap}
        onUpdate={onUpdate} 
        onDelete={onDelete} 
        onEdit={onEdit} 
        onOpenKB={onOpenKB}
        onAddChild={card.type !== CardType.CHAPTER ? () => onAddChild(id) : undefined} 
        onAddSibling={() => onAddSibling(id)} 
        isHighlighted={isHighlighted}
        cardScale={cardScale} 
        setRef={(el: HTMLDivElement | null) => {
          if (cardRefs) cardRefs.current[id] = el;
        }}
      />
      {children.length > 0 && (
        <div className="flex flex-col items-center mt-12 w-full">
          <div className="w-0.5 h-12 bg-slate-200" />
          <div className="flex flex-row items-start gap-12 relative">
            {children.length > 1 && <div className="absolute top-0 h-0.5 bg-slate-200" style={{ left: '170px', right: '170px' }} />}
            {children.map((cid: string) => (
              <HierarchyGroup key={cid} id={cid} cards={cards} charactersMap={charactersMap} locationsMap={locationsMap} onUpdate={onUpdate} onDelete={onDelete} onEdit={onEdit} onOpenKB={onOpenKB} onAddChild={onAddChild} onAddSibling={onAddSibling} isHighlighted={isHighlighted} visibilityMode={visibilityMode} shouldRenderCard={shouldRenderCard} cardScale={cardScale} cardRefs={cardRefs} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NarrativeCard = ({ card, charactersMap, locationsMap, onEdit, onDelete, onOpenKB, onAddChild, onAddSibling, isHighlighted, cardScale, setRef }: any) => {
  const colors = { 
    [CardType.BEAT]: 'border-amber-400 bg-amber-50 text-amber-900 shadow-beat', 
    [CardType.SCENE]: 'border-blue-400 bg-blue-50 text-blue-900 shadow-scene',
    [CardType.CHAPTER]: 'border-teal-400 bg-teal-50 text-teal-900 shadow-chapter'
  };
  
  // Restoration fix: visualClasses should always be saturated unless specifically being filtered out
  const visualClasses = isHighlighted ? "opacity-100 saturate-100 scale-100 shadow-lg" : "opacity-30 grayscale scale-95 pointer-events-none";
  
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;

  const ribbonTags = useMemo(() => {
    const list: any[] = [];
    if (primaryLoc) list.push({ id: primaryLoc.id, label: primaryLoc.name, category: 'location', isPrimary: true });
    if (charA) list.push({ id: charA.id, label: charA.name, category: 'character', isConflict: true });
    if (charB) list.push({ id: charB.id, label: charB.name, category: 'character', isConflict: true });
    (card.tags || []).forEach((tag: any) => {
      if (!list.find(item => item.id === tag.id)) list.push(tag);
    });
    return list;
  }, [card.tags, charA, charB, primaryLoc]);

  const stopPropagation = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div 
      ref={setRef}
      className={`w-[340px] h-[240px] border-2 rounded-3xl p-6 flex flex-col group transition-all relative ${colors[card.type]} ${visualClasses} hover:z-10 cursor-pointer`}
      onClick={() => onEdit(card.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-black uppercase tracking-widest truncate max-w-[70%]" style={{ fontSize: `${12 * cardScale}px` }}>
          {card.title}
        </h3>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={stopPropagation(() => onOpenKB(card.id))} className="p-1.5 bg-indigo-500 text-white rounded-lg shadow-sm hover:scale-110 transition-transform">
            <BookOpen size={14} />
          </button>
          <button onClick={stopPropagation(() => onEdit(card.id))} className="p-1.5 bg-white border border-slate-100 text-slate-400 rounded-lg hover:text-indigo-600 transition-colors"><Edit3 size={14} /></button>
          <button onClick={stopPropagation(() => onDelete(card.id))} className="p-1.5 bg-white border border-slate-100 text-slate-400 rounded-lg hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>
      
      <p className="flex-1 font-desc line-clamp-2 leading-relaxed italic opacity-80 mb-2" style={{ fontSize: `${11 * cardScale}px` }}>
        {card.description}
      </p>
      
      <div className="flex flex-wrap gap-1.5 mb-3 overflow-hidden">
        {ribbonTags.map((tag: any) => (
          <div key={tag.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase transition-all shadow-sm ${tag.category === 'character' ? (charactersMap[tag.id]?.isVillain ? 'bg-red-500 border-red-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white') : 'bg-indigo-600 border-indigo-700 text-white'}`}>
            {tag.category === 'character' ? <User size={8} /> : <MapPin size={8} />}
            {tag.label}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-auto pt-3 border-t border-black/5">
        <div className="flex items-center gap-2 flex-1 truncate text-slate-500">
          <Swords size={12} className="shrink-0" />
          <span className="text-[10px] font-bold truncate">
            {charA && charB ? (
              <span className="flex items-center gap-1">
                <span className={charA.isVillain ? 'text-red-600' : 'text-emerald-600'}>{charA.name}</span>
                <span className="text-slate-300">vs</span>
                <span className={charB.isVillain ? 'text-red-600' : 'text-emerald-600'}>{charB.name}</span>
              </span>
            ) : card.conflict || "No conflict"}
          </span>
        </div>
        {card.emotionalValue && (
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 shadow-sm ${card.emotionalValue === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
            {card.emotionalValue === 'POSITIVE' ? '+ Transition' : '- Transition'}
          </div>
        )}
      </div>

      <button onClick={stopPropagation(onAddSibling)} className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1.5 rounded-full shadow-lg hover:scale-110 transition-all z-20"><Plus size={12} className="text-slate-400" /></button>
      {onAddChild && <button onClick={stopPropagation(onAddChild)} className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1.5 rounded-full shadow-lg hover:scale-110 transition-all z-20"><Plus size={12} className="text-slate-400" /></button>}
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
  const safeKB = knowledgeBase || {};
  const article = safeKB[baseTitle];

  const handleCallCoach = async () => {
    if (!article?.aiScript) {
      setError("This methodology unit doesn't have an AI Blueprint defined.");
      return;
    }

    setIsCoaching(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        System Instructions: ${article.aiScript}
        Context: ${card.title} - ${card.description}
        Review and provide coaching advice.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
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
            {article?.content || "No advice found."}
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
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Title</label>
              <input value={card.title} onChange={e => onUpdate({ title: e.target.value })} className="w-full text-4xl font-bold border-none p-0 focus:ring-0 placeholder:text-slate-200" />
            </div>
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Narrative Action</label>
              <textarea value={card.description} onChange={e => onUpdate({ description: e.target.value })} className="w-full h-64 text-2xl text-slate-600 border-none p-0 focus:ring-0 resize-none font-desc leading-relaxed" />
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
                  {characters.map((char: any) => <option key={char.id} value={char.id}>{char.name}</option>)}
                </select>
                <select value={card.conflictSubjectBId || ''} onChange={e => onUpdate({ conflictSubjectBId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-600">
                  <option value="">Subject B</option>
                  {characters.map((char: any) => <option key={char.id} value={char.id}>{char.name}</option>)}
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
                {characters.map((char: any) => {
                  const isTagged = card.tags?.some((t: any) => t.id === char.id);
                  return (
                    <button key={char.id} onClick={stopPropagation(() => toggleTag(char.id, char.name, 'character'))} className={`px-6 py-3 rounded-2xl text-base font-bold border transition-all ${isTagged ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}>{char.name}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheStoryboard;
