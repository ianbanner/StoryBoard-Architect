
import React, { useState, useMemo, useCallback } from 'react';
import { Zap, Search, LayoutDashboard, Users, MapPin, Compass, Layout, Plus, Minus, Type, Cloud } from 'lucide-react';
import { CardType, StoryCard, StoryboardState, Character, Location, STCPlanning, Project } from './types';
import { SidebarItem } from './CommonUI';

// Screen Components
import PlanningBoard from './PlanningBoard';
import TheStoryboard from './TheStoryboard';
import CharacterBible from './CharacterBible';
import Locations from './Locations';
import FirebaseSync from './FirebaseSync';

const generateId = () => Math.random().toString(36).substr(2, 9);

const BEAT_TEMPLATES = [
  "Opening Image", "Theme Stated", "Set-up", "Catalyst", "Debate", 
  "Break into Two", "B Story", "Fun and Games", "Midpoint", "Bad Guys Close In",
  "All is Lost", "Dark Night of the Soul", "Break into Three", "Finale", 
  "Final Image", "Epilogue"
];

const createEmptyProject = (id: string, name: string): Project => {
  const cards: Record<string, StoryCard> = {};
  const beatOrder: string[] = [];
  BEAT_TEMPLATES.forEach((title, i) => {
    const beatId = generateId();
    cards[beatId] = { id: beatId, type: CardType.BEAT, title: `${i + 1}. ${title}`, description: `Enter beat summary...`, tags: [], children: [] };
    beatOrder.push(beatId);
  });

  return {
    id,
    name,
    cards,
    beatOrder,
    characters: {},
    characterOrder: [],
    locations: {},
    locationOrder: [],
    planning: {
      title: name,
      projectName: name,
      logline: { irony: "", mentalPicture: "", audienceAndCost: "", killerTitle: "" },
      genre: { type: "Whydunit", requirementA: "", requirementB: "", requirementC: "" },
      groupTransformation: { wants: "", needs: "", primalGoal: "", transformationArc: "" },
      heroTransformations: {}
    }
  };
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'STORYBOARD' | 'PEOPLE' | 'LOCATIONS' | 'PLANNING' | 'FIREBASE'>('PLANNING');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | CardType>('ALL');
  const [visibilityMode, setVisibilityMode] = useState<'FOCUS' | 'HIDDEN'>('FOCUS');
  const [cardScale, setCardScale] = useState(1.0);

  const [state, setState] = useState<StoryboardState>(() => {
    const initialProjectId = generateId();
    const initialProjectName = "The Sheffield Ladies Cosy Murder Tea Club";
    const initialProject = createEmptyProject(initialProjectId, initialProjectName);

    // Seed full gang characters and new document characters
    initialProject.characters = {
      "rachel": {
        id: "rachel",
        name: "Rachel Garland",
        oneWord: "Steady",
        oneSentence: "A quiet, fiercely loyal retired librarian who hides deep grief behind practicality and a stubborn belief that 'we just need to get on with it.'",
        traits: ["Practical", "Loyal", "Steady", "Dry-witted"],
        age: 63,
        occupation: "Retired Library Assistant",
        accent: "Geordie",
        signaturePhrases: ["We just need to get on with it.", "A bit of cake and a cuppa can fix more than people realise."],
        sixThingsToFix: ["Hiding feelings", "Clinging to order", "Emotional isolation", "Unprocessed grief", "Refusal of fuss", "Self-reliance to a fault"],
        primalGoal: "To restore order and stability",
        saveTheCatMoment: "Bringing tea to Megs quietly while others argue."
      },
      "iris": {
        id: "iris",
        name: "Iris Hawthorn",
        oneWord: "Wise",
        oneSentence: "A whimsical, quietly formidable retired garden designer who draws strength from gardens, scarves, and the hidden truths only nature and patience reveal.",
        traits: ["Whimsical", "Wise", "Nurturing", "Playful"],
        age: 68,
        occupation: "Retired Garden Designer",
        accent: "Soft Northern",
        signaturePhrases: ["Every woman needs somewhere to put her secrets.", "Kindness costs nothing — but forgetting it costs the world."],
        sixThingsToFix: ["Conflict avoidance", "Belief that patience fixes everything", "Shielding others too much", "Meandering communication", "Hidden self-doubt", "Passivity"],
        primalGoal: "To nurture and protect friendships",
        saveTheCatMoment: "Tending to thirsty hydrangeas outside the café."
      },
      "megs": {
        id: "megs",
        name: "Margaret 'Megs' Broadbent",
        oneWord: "Brave",
        oneSentence: "A spirited former A&E nurse facing early Alzheimer's with humor, grit, and a refusal to let fear define her final chapters.",
        traits: ["Brave", "Spirited", "Dignified", "Warm"],
        age: 66,
        occupation: "Retired A&E Nurse",
        accent: "Light Midlands",
        signaturePhrases: ["It's not how you fall — it's how you get back up.", "Tea first, tragedy second. Always."],
        sixThingsToFix: ["Hiding diagnosis", "Fear of the future", "Loss of agency", "Denial of need for help", "Emotional messy-ness", "Self-distrust"],
        primalGoal: "To solve the mystery while she still can",
        saveTheCatMoment: "Her genuine care for daughter Katy and the group despite her struggle."
      },
      "karen": {
        id: "karen",
        name: "Karen Deakin",
        oneWord: "Warmth",
        oneSentence: "A lively Canadian social worker whose hugs, practical optimism, and stubborn kindness anchor the Tea Club like a brightly colored lifeboat.",
        traits: ["Optimistic", "Organized", "Affectionate", "Lively"],
        age: 54,
        occupation: "Social Worker",
        accent: "Soft Canadian",
        signaturePhrases: ["We'll figure it out. We always do.", "Alright, let's roll up our sleeves and figure this out."],
        sixThingsToFix: ["Need to fix everyone", "Hiding weariness", "Overcommitting", "Smothering others", "Avoidance of stillness", "Accidental driving of wedges"],
        primalGoal: "To keep the Ladies safe and supported",
        saveTheCatMoment: "Slipping Megs a chocolate bar and spare pen like a secret agent."
      },
      "malcolm": {
        id: "malcolm",
        name: "Malcolm Thorne",
        oneWord: "Predatory",
        oneSentence: "A calculating public charmer who masks his cold, manipulative nature behind the respectable façade of charity and good works.",
        traits: ["Calculating", "Predatory", "Manipulative", "Detached"],
        isVillain: true,
        signaturePhrases: ["It's so important to give back, don't you think?", "Of course, I only want what's best for everyone."],
        sixThingsToFix: ["Loss of touch with genuine emotion", "Weaponized charisma", "Clinical detachment", "Contempt for victims", "Overconfidence", "Narcissism"],
        primalGoal: "Maintaining public image and private collection of conquests",
        saveTheCatMoment: "His apparent devotion to Rose through the foundation (performative)."
      },
      "ian": {
        id: "ian",
        name: "Ian Hawthorn",
        oneWord: "Mysterious",
        oneSentence: "A kindly but slightly otherworldly former government consultant who trades quietly in favours and reminds everyone, gently, to be kind.",
        traits: ["Kindly", "Otherworldly", "Detached", "Steady"],
        occupation: "Former Government Consultant",
        signaturePhrases: ["Be kind.", "I know someone. Owes me a favour."],
        sixThingsToFix: ["Detachment from normal life", "Quiet nature", "Mysterious past", "Avoidance of direct answers", "Tuned into different frequencies", "Sense of vacancy"],
        primalGoal: "To make difficult things quietly possible",
        saveTheCatMoment: "Reminding everyone to prioritize kindness."
      },
      "martin": {
        id: "martin",
        name: "Martin Hawthorn",
        oneWord: "Solid",
        oneSentence: "A thoughtful young police officer, deeply principled and quietly reliable, carrying both the best traits of his parents and his own emerging strength.",
        traits: ["Principled", "Reliable", "Thoughtful", "Diligent"],
        occupation: "Police Officer",
        sixThingsToFix: ["Living in parents' shadow", "Fixation on legal minutiae", "Exam pressure", "Internalizing duty", "Need to prove himself", "Strict adherence to rules"],
        primalGoal: "Studying for sergeant's exam and creating official connections",
        saveTheCatMoment: "Helping set up the DVD player for the ladies."
      },
      "jo": {
        id: "jo",
        name: "Jo Deakin",
        oneWord: "Driven",
        oneSentence: "A passionate social worker who finds unexpected love — and crucial insights — as she helps uncover the truth about Malcolm’s past.",
        traits: ["Passionate", "Driven", "Detail-oriented", "Passionate"],
        occupation: "Social Worker",
        sixThingsToFix: ["Fixation on legal minutiae", "Intense work focus", "Obsession with uncovering truths", "Balancing passion with procedure", "Over-researching", "Guardedness"],
        primalGoal: "Uncovering the truth about Malcolm's past",
        saveTheCatMoment: "Sharing her insights with the club about legal minutiae."
      }
    };
    initialProject.characterOrder = ["rachel", "iris", "megs", "karen", "malcolm", "ian", "martin", "jo"];
    
    initialProject.locations = {
      "tea-room": {
        id: "tea-room",
        name: "The Central Tea Room",
        description: "Smells of Earl Grey and old paper.",
        significance: "Headquarters for the club.",
        tags: []
      }
    };
    initialProject.locationOrder = ["tea-room"];

    // Seed group transformation
    initialProject.planning.groupTransformation = {
      wants: "To keep their heads down and enjoy their retirement.",
      needs: "To realize that their age is a superpower for seeking justice.",
      primalGoal: "Security",
      transformationArc: "From four isolated retirees to a unified, formidable investigative force."
    };

    // Seed individual transformations for the main gang
    initialProject.planning.heroTransformations["rachel"] = {
      wants: "To restore order and stability by solving the mystery quietly.",
      needs: "To allow herself to truly grieve and reconnect with life’s messiness.",
      primalGoal: "Stability",
      transformationArc: "From isolated individual to a leader who trusts others with her broken parts."
    };
    initialProject.planning.heroTransformations["iris"] = {
      wants: "To nurture and protect friendships with comfort and wisdom.",
      needs: "To accept that love means standing beside others through storms, not shielding them.",
      primalGoal: "Protection",
      transformationArc: "From an emotional gardener to a resilient force who faces confrontation."
    };
    initialProject.planning.heroTransformations["megs"] = {
      wants: "To solve the mystery while she still has her memory.",
      needs: "To accept help from others and find agency in her final chapters.",
      primalGoal: "Autonomy",
      transformationArc: "From denial and fear to acceptance and collaborative strength."
    };
    initialProject.planning.heroTransformations["karen"] = {
      wants: "To keep the Ladies safe by fixing every problem.",
      needs: "To realize that support is about showing up and listening, not just fixing.",
      primalGoal: "Connection",
      transformationArc: "From overextended caregiver to a patient, anchoring presence."
    };

    return { 
      projects: { [initialProjectId]: initialProject },
      projectOrder: [initialProjectId],
      activeProjectId: initialProjectId,
      ignoredCleanupHashes: []
    };
  });

  const activeProject = state.projects[state.activeProjectId];

  const leafUnitCount = useMemo(() => 
    Object.values(activeProject.cards).filter(c => c.type === CardType.CHAPTER).length, 
    [activeProject.cards]
  );

  // Project Handlers
  const handleCreateProject = () => {
    const name = prompt("Enter project name:");
    if (!name) return;
    const newId = generateId();
    const newProject = createEmptyProject(newId, name);
    setState(prev => ({
      ...prev,
      projects: { ...prev.projects, [newId]: newProject },
      projectOrder: [...prev.projectOrder, newId],
      activeProjectId: newId
    }));
  };

  const handleSwitchProject = (id: string) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  };

  const updateActiveProject = (updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [prev.activeProjectId]: { ...prev.projects[prev.activeProjectId], ...updates }
      }
    }));
  };

  // Narrative Handlers
  const handleUpdateCard = (id: string, updates: Partial<StoryCard>) => {
    const newCards = { ...activeProject.cards, [id]: { ...activeProject.cards[id], ...updates } };
    updateActiveProject({ cards: newCards });
  };

  const handleAddChild = (parentId: string) => {
    const parent = activeProject.cards[parentId];
    if (!parent || parent.type === CardType.CHAPTER) return;
    const type = parent.type === CardType.BEAT ? CardType.SCENE : CardType.CHAPTER;
    const id = generateId();
    const newCards: Record<string, StoryCard> = {
      ...activeProject.cards,
      [id]: { id, type, title: `New ${type.toLowerCase()}`, description: '...', tags: [], children: [], parentId, emotionalValue: 'POSITIVE' as const },
      [parentId]: { ...activeProject.cards[parentId], children: [...(activeProject.cards[parentId].children || []), id] }
    };
    updateActiveProject({ cards: newCards });
  };

  const handleAddSibling = (id: string) => {
    const card = activeProject.cards[id];
    if (!card) return;
    if (card.type === CardType.BEAT) {
      const newId = generateId();
      updateActiveProject({
        cards: { ...activeProject.cards, [newId]: { id: newId, type: CardType.BEAT, title: "New Beat", description: "...", tags: [], children: [] } },
        beatOrder: [...activeProject.beatOrder, newId]
      });
    } else if (card.parentId) {
      handleAddChild(card.parentId);
    }
  };

  const handleDeleteCard = (id: string) => {
    if (!confirm('Delete this card?')) return;
    const newCards = { ...activeProject.cards };
    const removeRecursive = (cid: string) => {
      const c = newCards[cid];
      if (c) { (c.children || []).forEach(removeRecursive); delete newCards[cid]; }
    };
    const cardToDelete = newCards[id];
    removeRecursive(id);
    if (cardToDelete?.parentId && newCards[cardToDelete.parentId]) {
      newCards[cardToDelete.parentId] = { 
        ...newCards[cardToDelete.parentId], 
        children: (newCards[cardToDelete.parentId].children || []).filter(cid => cid !== id) 
      };
    }
    updateActiveProject({ 
      cards: newCards, 
      beatOrder: activeProject.beatOrder.filter(bid => bid !== id) 
    });
  };

  const handleAddCharacter = () => {
    const id = generateId();
    updateActiveProject({
      characters: {
        ...activeProject.characters,
        [id]: { id, name: "New Character", oneWord: "Archetype", oneSentence: "Summary...", traits: [], sixThingsToFix: ["", "", "", "", "", ""], primalGoal: "", saveTheCatMoment: "" }
      },
      characterOrder: [...activeProject.characterOrder, id]
    });
  };

  const handleAddLocation = () => {
    const id = generateId();
    updateActiveProject({
      locations: {
        ...activeProject.locations,
        [id]: { id, name: "New Location", description: "Details...", significance: "Narrative weight...", tags: [] }
      },
      locationOrder: [...activeProject.locationOrder, id]
    });
  };

  const isCardMatching = useCallback((cardId: string) => {
    const card = activeProject.cards[cardId];
    if (!card) return false;
    const matchesType = typeFilter === 'ALL' || card.type === typeFilter;
    if (!matchesType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);
  }, [activeProject.cards, searchQuery, typeFilter]);

  const shouldRenderCard = useCallback((cardId: string): boolean => {
    if (typeFilter === 'ALL' || visibilityMode === 'FOCUS') return true;
    const checkRecursive = (id: string): boolean => {
      if (isCardMatching(id)) return true;
      const card = activeProject.cards[id];
      if (!card || !card.children) return false;
      return card.children.some(childId => checkRecursive(childId));
    };
    return checkRecursive(cardId);
  }, [visibilityMode, isCardMatching, activeProject.cards, typeFilter]);

  return (
    <div className="flex h-screen bg-slate-50 font-ui overflow-hidden">
      <aside className="h-full bg-slate-900 text-slate-400 w-20 hover:w-64 transition-all duration-300 ease-in-out z-[100] group flex flex-col border-r border-slate-800 shadow-2xl overflow-hidden shrink-0">
        <div className="p-6 flex items-center gap-4 border-b border-slate-800 h-20 shrink-0">
          <div className="bg-amber-500 p-2 rounded-lg shrink-0"><Zap className="text-white" size={20} /></div>
          <span className="text-white font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase text-sm">Save The Cat!</span>
        </div>
        <nav className="flex-1 py-8 flex flex-col gap-2 px-4">
          <SidebarItem icon={<Compass size={22} />} label="Planning Board" active={activeView === 'PLANNING'} onClick={() => setActiveView('PLANNING')} />
          <SidebarItem icon={<LayoutDashboard size={22} />} label="The StoryBoard" active={activeView === 'STORYBOARD'} onClick={() => setActiveView('STORYBOARD')} />
          <SidebarItem icon={<Users size={22} />} label="Character Bible" active={activeView === 'PEOPLE'} onClick={() => setActiveView('PEOPLE')} />
          <SidebarItem icon={<MapPin size={22} />} label="Locations" active={activeView === 'LOCATIONS'} onClick={() => setActiveView('LOCATIONS')} />
          
          <div className="mt-auto border-t border-slate-800 pt-4 pb-4">
            <SidebarItem icon={<Cloud size={22} />} label="Firebase Sync" active={activeView === 'FIREBASE'} onClick={() => setActiveView('FIREBASE')} />
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-20 border-b border-slate-200 px-10 flex items-center justify-between bg-white z-50 sticky top-0 shadow-sm shrink-0">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{activeProject.planning.title}</h1>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{activeView === 'FIREBASE' ? 'DATABASE SYNC' : activeView}</p>
            </div>
            {activeView === 'STORYBOARD' && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" placeholder="Search cards..." 
                      className="bg-transparent border-none focus:ring-0 text-xs pl-9 w-48"
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <select 
                    className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase text-slate-500"
                    value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
                  >
                    <option value="ALL">All Units</option>
                    <option value={CardType.BEAT}>Beats Only</option>
                    <option value={CardType.SCENE}>Scenes Only</option>
                    <option value={CardType.CHAPTER}>Chapters Only</option>
                  </select>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button onClick={() => setVisibilityMode('FOCUS')} className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${visibilityMode === 'FOCUS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Focus</button>
                  <button onClick={() => setVisibilityMode('HIDDEN')} className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${visibilityMode === 'HIDDEN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Hidden</button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeView === 'STORYBOARD' && (
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
                <button 
                  onClick={() => setCardScale(s => Math.max(0.6, s - 0.1))}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600"
                >
                  <Minus size={14} />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <Type size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 w-8 text-center">{Math.round(cardScale * 100)}%</span>
                </div>
                <button 
                  onClick={() => setCardScale(s => Math.min(2.0, s + 0.1))}
                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${leafUnitCount >= 40 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
              <Layout size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Units: {leafUnitCount}/40</span>
            </div>
            {activeView === 'PEOPLE' && (
              <button onClick={handleAddCharacter} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
                <Plus size={16} /> New Hero
              </button>
            )}
            {activeView === 'LOCATIONS' && (
              <button onClick={handleAddLocation} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md">
                <Plus size={16} /> New Location
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto dot-grid p-12 custom-scrollbar">
          {activeView === 'PLANNING' && (
            <PlanningBoard 
              planning={activeProject.planning} 
              projects={Object.values(state.projects).map(p => ({ id: p.id, name: p.name }))}
              characters={Object.values(activeProject.characters)}
              activeProjectId={state.activeProjectId}
              onSwitchProject={handleSwitchProject}
              onCreateProject={handleCreateProject}
              setPlanning={(updates) => updateActiveProject({ planning: { ...activeProject.planning, ...updates } })} 
            />
          )}

          {activeView === 'STORYBOARD' && (
            <TheStoryboard 
              cards={activeProject.cards} 
              beatOrder={activeProject.beatOrder} 
              characters={Object.values(activeProject.characters)} 
              locations={Object.values(activeProject.locations)}
              onUpdateCard={handleUpdateCard} 
              onDeleteCard={handleDeleteCard} 
              onAddChild={handleAddChild} 
              onAddSibling={handleAddSibling} 
              shouldRenderCard={shouldRenderCard} 
              isCardMatching={isCardMatching} 
              visibilityMode={visibilityMode}
              cardScale={cardScale} 
            />
          )}

          {activeView === 'PEOPLE' && (
            <CharacterBible 
              characters={activeProject.characters} 
              characterOrder={activeProject.characterOrder} 
              onUpdate={(id, updates) => {
                const newChars = { ...activeProject.characters, [id]: { ...activeProject.characters[id], ...updates } };
                updateActiveProject({ characters: newChars });
              }} 
              onDelete={(id) => {
                if(confirm('Delete character?')) {
                  const newChars = { ...activeProject.characters }; delete newChars[id];
                  updateActiveProject({ 
                    characters: newChars, 
                    characterOrder: activeProject.characterOrder.filter(oid => oid !== id) 
                  });
                }
              }} 
            />
          )}

          {activeView === 'LOCATIONS' && (
            <Locations 
              locations={activeProject.locations} 
              locationOrder={activeProject.locationOrder} 
              onUpdate={(id, updates) => {
                const newLocs = { ...activeProject.locations, [id]: { ...activeProject.locations[id], ...updates } };
                updateActiveProject({ locations: newLocs });
              }} 
              onDelete={(id) => {
                if(confirm('Delete location?')) {
                  const newLocs = { ...activeProject.locations }; delete newLocs[id];
                  updateActiveProject({ 
                    locations: newLocs, 
                    locationOrder: activeProject.locationOrder.filter(oid => oid !== id) 
                  });
                }
              }} 
            />
          )}

          {activeView === 'FIREBASE' && (
            <FirebaseSync 
              state={state}
              onUpdateState={setState}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;