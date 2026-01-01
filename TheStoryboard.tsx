
import React, { useState, useMemo } from 'react';
import { Edit3, Trash2, Swords, Plus, ChevronRight, MapPin, User, X } from 'lucide-react';
import { CardType, StoryCard, Character, Location } from './types';
import { TabButton } from './CommonUI';

interface Props {
  cards: Record<string, StoryCard>;
  beatOrder: string[];
  characters: Character[];
  locations: Location[];
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
  cards, beatOrder, characters, locations, onUpdateCard, onDeleteCard, onAddChild, onAddSibling, shouldRenderCard, isCardMatching, visibilityMode, cardScale 
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

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
            isHighlighted={isCardMatching(id)} 
            visibilityMode={visibilityMode} 
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
          onUpdate={updates => onUpdateCard(editingCardId, updates)} 
        />
      )}
    </div>
  );
};

const HierarchyGroup = ({ id, cards, charactersMap, locationsMap, onUpdate, onDelete, onAddChild, onAddSibling, onEdit, isHighlighted, visibilityMode, shouldRenderCard, cardScale }: any) => {
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
        // Hierarchy: Beat -> Scene -> Chapter. Chapters are now the leaf nodes.
        onAddChild={card.type !== CardType.CHAPTER ? () => onAddChild(id) : undefined} 
        onAddSibling={() => onAddSibling(id)} 
        isHighlighted={visibilityMode === 'FOCUS' ? isHighlighted : true}
        cardScale={cardScale} 
      />
      {children.length > 0 && (
        <div className="flex flex-col items-center mt-12 w-full">
          <div className="w-0.5 h-12 bg-slate-200" />
          <div className="flex flex-row items-start gap-12 relative">
            {children.length > 1 && <div className="absolute top-0 h-0.5 bg-slate-200" style={{ left: '170px', right: '170px' }} />}
            {children.map((cid: string) => (
              <HierarchyGroup key={cid} id={cid} cards={cards} charactersMap={charactersMap} locationsMap={locationsMap} onUpdate={onUpdate} onDelete={onDelete} onEdit={onEdit} onAddChild={onAddChild} onAddSibling={onAddSibling} isHighlighted={isHighlighted} visibilityMode={visibilityMode} shouldRenderCard={shouldRenderCard} cardScale={cardScale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NarrativeCard = ({ card, charactersMap, locationsMap, onEdit, onDelete, onAddChild, onAddSibling, isHighlighted, cardScale }: any) => {
  const colors = { 
    [CardType.BEAT]: 'border-amber-400 bg-amber-50/20 text-amber-900', 
    [CardType.SCENE]: 'border-blue-400 bg-blue-50/20 text-blue-900',
    [CardType.CHAPTER]: 'border-teal-400 bg-teal-50/20 text-teal-900'
  };
  const visualClasses = isHighlighted ? "opacity-100 saturate-100" : "opacity-30 grayscale-[0.8] scale-95";
  
  const charA = card.conflictSubjectAId ? charactersMap[card.conflictSubjectAId] : null;
  const charB = card.conflictSubjectBId ? charactersMap[card.conflictSubjectBId] : null;
  const primaryLoc = card.primaryLocationId ? locationsMap[card.primaryLocationId] : null;

  // Consolidate all metadata tags for the ribbon
  const ribbonTags = useMemo(() => {
    const list: any[] = [];
    
    // 1. Primary Location (always first)
    if (primaryLoc) {
      list.push({ id: primaryLoc.id, label: primaryLoc.name, category: 'location', isPrimary: true });
    }

    // 2. Conflict Subjects (always shown in ribbon if set)
    if (charA) list.push({ id: charA.id, label: charA.name, category: 'character', isConflict: true });
    if (charB) list.push({ id: charB.id, label: charB.name, category: 'character', isConflict: true });

    // 3. Additional manual tags (avoiding duplicates)
    (card.tags || []).forEach((tag: any) => {
      if (!list.find(item => item.id === tag.id)) {
        list.push(tag);
      }
    });

    return list;
  }, [card.tags, charA, charB, primaryLoc]);

  const handleCardClick = () => {
    onEdit(card.id);
  };

  const stopPropagation = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div 
      className={`w-[340px] h-[240px] bg-white border-2 rounded-3xl p-6 flex flex-col group transition-all relative ${colors[card.type]} ${visualClasses} hover:shadow-2xl hover:border-opacity-100 border-opacity-40 cursor-pointer`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 
          className="font-black uppercase tracking-widest truncate max-w-[80%]"
          style={{ fontSize: `${12 * cardScale}px` }}
        >
          {card.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={stopPropagation(() => onEdit(card.id))} className="p-1 hover:bg-black/5 rounded-md"><Edit3 size={14} /></button>
          <button onClick={stopPropagation(() => onDelete(card.id))} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md"><Trash2 size={14} /></button>
        </div>
      </div>
      
      <p 
        className="flex-1 font-desc line-clamp-2 leading-relaxed italic opacity-80 mb-2"
        style={{ fontSize: `${11 * cardScale}px` }}
      >
        {card.description}
      </p>
      
      {/* Tag Ribbon */}
      <div className="flex flex-wrap gap-1.5 mb-3 overflow-hidden">
        {ribbonTags.map((tag: any) => {
          if (tag.category === 'character') {
            const char = charactersMap[tag.id];
            const isVillain = char?.isVillain;
            return (
              <div key={tag.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase transition-all shadow-sm ${isVillain ? 'bg-red-500 border-red-600 text-white' : 'bg-emerald-500 border-emerald-600 text-white'}`}>
                <User size={8} />
                {char?.name || tag.label}
              </div>
            );
          }
          if (tag.category === 'location') {
            return (
              <div key={tag.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase transition-all shadow-sm ${tag.isPrimary ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                <MapPin size={8} />
                {tag.label}
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center gap-4 mt-auto pt-3 border-t border-black/5">
        <div className="flex items-center gap-2 flex-1 truncate">
          <Swords size={12} className="text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 truncate">
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
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 shadow-sm ${card.emotionalValue === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
            {card.emotionalValue === 'POSITIVE' ? '+ Transition' : '- Transition'}
          </div>
        )}
      </div>

      <button onClick={stopPropagation(onAddSibling)} className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1.5 rounded-full shadow-lg hover:scale-110 transition-all z-20"><Plus size={12} className="text-slate-400" /></button>
      {onAddChild && <button onClick={stopPropagation(onAddChild)} className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-1.5 rounded-full shadow-lg hover:scale-110 transition-all z-20"><Plus size={12} className="text-slate-400" /></button>}
    </div>
  );
};

const STCCardEditor = ({ card, onClose, onUpdate, characters, locations }: any) => {
  const [activeTab, setActiveTab] = useState<'STORY' | 'STC' | 'TAGS'>('STORY');
  
  // Define helper to prevent event bubbling
  const stopPropagation = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

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
              <input 
                value={card.title} 
                onChange={e => onUpdate({ title: e.target.value })} 
                className="w-full text-4xl font-bold border-none p-0 focus:ring-0 placeholder:text-slate-200" 
                placeholder="Unit Title..." 
              />
            </div>
            <div className="space-y-4">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest">Narrative Action</label>
              <textarea 
                value={card.description} 
                onChange={e => onUpdate({ description: e.target.value })} 
                className="w-full h-64 text-2xl text-slate-600 border-none p-0 focus:ring-0 resize-none font-desc leading-relaxed placeholder:text-slate-200" 
                placeholder="What happens in this unit?" 
              />
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
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                <Swords size={20} /> Conflict Tagging
              </label>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="text-sm font-black uppercase text-slate-400">Subject A</span>
                  <select 
                    value={card.conflictSubjectAId || ''} 
                    onChange={e => onUpdate({ conflictSubjectAId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">None</option>
                    {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <span className="text-sm font-black uppercase text-slate-400">Subject B</span>
                  <select 
                    value={card.conflictSubjectBId || ''} 
                    onChange={e => onUpdate({ conflictSubjectBId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">None</option>
                    {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                  </select>
                </div>
              </div>
              <textarea 
                value={card.conflict || ''} 
                onChange={e => onUpdate({ conflict: e.target.value })} 
                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none mt-4" 
                placeholder="Brief conflict description..." 
              />
            </div>

            <div className="space-y-6">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                <MapPin size={20} /> Primary Physical Location
              </label>
              <div className="flex flex-wrap gap-3">
                {locations.map((loc: any) => {
                  const isActive = card.primaryLocationId === loc.id;
                  return (
                    <button 
                      key={loc.id} 
                      onClick={stopPropagation(() => onUpdate({ primaryLocationId: isActive ? undefined : loc.id }))} 
                      className={`px-6 py-3 rounded-2xl text-base font-bold border transition-all flex items-center gap-3 ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                    >
                      {isActive && <MapPin size={16} />}
                      {loc.name}
                      {isActive && <X size={16} className="ml-2 opacity-60" />}
                    </button>
                  );
                })}
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
                    <button 
                      key={char.id} 
                      onClick={stopPropagation(() => toggleTag(char.id, char.name, 'character'))} 
                      className={`px-6 py-3 rounded-2xl text-base font-bold border transition-all ${isTagged ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                    >
                      {char.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6 pt-10 border-t border-slate-100">
              <label className="text-base font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                <MapPin size={20} /> Other World Context
              </label>
              <div className="flex flex-wrap gap-3">
                {locations.map((loc: any) => {
                  if (loc.id === card.primaryLocationId) return null;
                  const isTagged = card.tags?.some((t: any) => t.id === loc.id);
                  return (
                    <button 
                      key={loc.id} 
                      onClick={stopPropagation(() => toggleTag(loc.id, loc.name, 'location'))} 
                      className={`px-6 py-3 rounded-2xl text-base font-bold border transition-all ${isTagged ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                    >
                      {loc.name}
                    </button>
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
