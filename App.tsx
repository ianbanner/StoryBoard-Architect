
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Zap, Search, LayoutDashboard, Users, MapPin, Compass, Layout, Plus, Minus, Type, Cloud, Target, Loader2 } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, initializeFirestore } from 'firebase/firestore';
import { CardType, StoryCard, StoryboardState, Character, Location, STCPlanning, Project } from './types';
import { SidebarItem } from './CommonUI';

// Screen Components
import PlanningBoard from './PlanningBoard';
import TheStoryboard from './TheStoryboard';
import CharacterBible from './CharacterBible';
import Locations from './Locations';
import FirebaseSync from './FirebaseSync';

const generateId = () => Math.random().toString(36).substr(2, 9);

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

/**
 * Robust Firestore initialization to handle environments with connectivity restrictions.
 * Uses forceLongPolling to avoid the "Backend didn't respond within 10 seconds" error.
 */
const getFirestoreInstance = () => {
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  try {
    // Attempt to initialize with specific settings if not already done
    return initializeFirestore(app, { 
      experimentalForceLongPolling: true,
      useFetchStreams: false 
    });
  } catch (e) {
    // If already initialized, get the existing instance
    return getFirestore(app);
  }
};

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
  const [isSyncing, setIsSyncing] = useState(false);
  const prevViewRef = useRef(activeView);

  const [state, setState] = useState<StoryboardState>(() => {
    const initialProjectId = generateId();
    const initialProjectName = "The Sheffield Ladies Cosy Murder Tea Club";
    const initialProject = createEmptyProject(initialProjectId, initialProjectName);

    initialProject.characters = {
      "rachel": {
        id: "rachel",
        name: "Rachel Garland",
        oneWord: "Steady",
        oneSentence: "A quiet, fiercely loyal retired librarian who hides deep grief behind practicality and a stubborn belief that 'we just need to get on with it.'",
        traits: ["Practical", "Loyal", "Steady", "Dry-witted", "Sharp-eyed"],
        age: 63,
        occupation: "Retired Library Assistant",
        accent: "Geordie",
        signaturePhrases: ["We just need to get on with it.", "A bit of cake and a cuppa can fix more than people realise.", "Soft words won't fix a hard truth."],
        sixThingsToFix: ["Hiding feelings", "Clinging to order", "Emotional isolation", "Unprocessed grief", "Refusal of fuss", "Self-reliance to a fault"],
        primalGoal: "Stability",
        saveTheCatMoment: "Bringing a fresh pot of Megs' favorite tea without fuss when she sees her struggling."
      },
      "iris": {
        id: "iris",
        name: "Iris Hawthorn",
        oneWord: "Wise",
        oneSentence: "A whimsical, quietly formidable retired garden designer who draws strength from gardens, scarves, and the hidden truths only nature and patience reveal.",
        traits: ["Whimsical", "Wise", "Nurturing", "Playful", "Formidable"],
        age: 68,
        occupation: "Retired Garden Designer",
        accent: "Soft Northern",
        signaturePhrases: ["Every woman needs somewhere to put her secrets.", "Kindness costs nothing — but forgetting it costs the world.", "Monty says you can't bully a rose into blooming."],
        sixThingsToFix: ["Conflict avoidance", "Belief that patience fixes everything", "Shielding others too much", "Meandering communication", "Hidden self-doubt", "Passivity"],
        primalGoal: "Protection",
        saveTheCatMoment: "Tending to sagging hydrangeas outside the cafe while the others bicker."
      },
      "megs": {
        id: "megs",
        name: "Margaret 'Megs' Broadbent",
        oneWord: "Brave",
        oneSentence: "A spirited former A&E nurse facing early Alzheimer's with humor, grit, and a refusal to let fear define her final chapters.",
        traits: ["Brave", "Spirited", "Dignified", "Warm", "Perceptive"],
        age: 66,
        occupation: "Retired A&E Nurse",
        accent: "Light Midlands",
        signaturePhrases: ["It's not how you fall — it's how you get back up.", "Tea first, tragedy second. Always.", "It's not forgetting that frightens me. It's losing the bits of me that knew how to fight back."],
        sixThingsToFix: ["Hiding diagnosis", "Fear of the future", "Loss of agency", "Denial of need for help", "Emotional messy-ness", "Self-distrust"],
        primalGoal: "Autonomy",
        saveTheCatMoment: "Her genuine care for daughter Katy and the group despite her own internal fraying."
      },
      "karen": {
        id: "karen",
        name: "Karen Deakin",
        oneWord: "Warmth",
        oneSentence: "A lively Canadian social worker whose hugs, practical optimism, and stubborn kindness anchor the Tea Club like a brightly colored lifeboat.",
        traits: ["Optimistic", "Organized", "Affectionate", "Lively", "Practical"],
        age: 54,
        occupation: "Social Worker",
        accent: "Soft Canadian",
        signaturePhrases: ["We'll figure it out. We always do.", "Alright, let's roll up our sleeves and figure this out.", "Coffee first. Big talks second. Solutions third."],
        sixThingsToFix: ["Need to fix everyone", "Hiding weariness", "Overcommitting", "Smothering others", "Avoidance of stillness", "Accidental driving of wedges"],
        primalGoal: "Connection",
        saveTheCatMoment: "Resurfacing from under a table with a spare pen and a chocolate bar for Megs."
      },
      "malcolm": {
        id: "malcolm",
        name: "Malcolm Thorne",
        oneWord: "Predatory",
        oneSentence: "A calculating public charmer who masks his cold, manipulative nature behind the respectable façade of charity and good works.",
        traits: ["Calculating", "Predatory", "Manipulative", "Detached", "Two-faced"],
        isVillain: true,
        signaturePhrases: ["It's so important to give back, don't you think?", "Of course, I only want what's best for everyone.", "Truth is for the weak. Power is for those smart enough to write their own history."],
        sixThingsToFix: ["Loss of touch with genuine emotion", "Weaponized charisma", "Clinical detachment", "Contempt for victims", "Overconfidence", "Narcissism"],
        primalGoal: "Maintenance of image and conquests",
        saveTheCatMoment: "His apparent (though performative) devotion to Rose through the foundation."
      },
      "ian": {
        id: "ian",
        name: "Ian Hawthorn",
        oneWord: "Mysterious",
        oneSentence: "A kindly but slightly otherworldly former government consultant who trades quietly in favours and reminds everyone, gently, to be kind.",
        traits: ["Kindly", "Otherworldly", "Detached", "Steady"],
        occupation: "Former MOD Consultant",
        signaturePhrases: ["Be kind.", "I know someone. Owes me a favour.", "Rot always starts where you can't see it."],
        sixThingsToFix: ["Detachment from normal life", "Quiet nature", "Mysterious past", "Avoidance of direct answers", "Tuned into different frequencies", "Sense of vacancy"],
        primalGoal: "Making difficult things possible",
        saveTheCatMoment: "Gently reminding Iris to prioritize kindness in the middle of a crisis."
      },
      "martin": {
        id: "martin",
        name: "Martin Hawthorn",
        oneWord: "Solid",
        oneSentence: "A thoughtful young police officer, deeply principled and quietly reliable, carrying both the best traits of his parents and his own emerging strength.",
        traits: ["Principled", "Reliable", "Thoughtful", "Diligent"],
        occupation: "Police Officer",
        signaturePhrases: ["Let me look at the official report.", "I'm studying for my sergeant's exam.", "Be careful, Mum."],
        sixThingsToFix: ["Living in parents' shadow", "Fixation on legal minutiae", "Exam pressure", "Internalizing duty", "Need to prove himself", "Strict adherence to rules"],
        primalGoal: "Official investigation and professional growth",
        saveTheCatMoment: "Helping set up the DVD player for the ladies when they were struggling with it."
      },
      "jo": {
        id: "jo",
        name: "Jo Deakin",
        oneWord: "Driven",
        oneSentence: "A passionate social worker who finds unexpected love — and crucial insights — as she helps uncover the truth about Malcolm’s past.",
        traits: ["Passionate", "Driven", "Detail-oriented"],
        occupation: "Social Worker",
        signaturePhrases: ["It's in the small print.", "Let's find someone who reads the paperwork.", "This doesn't add up."],
        sixThingsToFix: ["Fixation on legal minutiae", "Intense work focus", "Obsession with uncovering truths", "Balancing passion with procedure", "Over-researching", "Guardedness"],
        primalGoal: "Uncovering truth via documentation",
        saveTheCatMoment: "Finding common ground with Martin over legal briefs and paperwork."
      }
    };
    initialProject.characterOrder = ["rachel", "iris", "megs", "karen", "malcolm", "ian", "martin", "jo"];
    
    initialProject.planning.logline = {
      irony: "A group of retired friends known only for their tea and cardigans are the only ones capable of unmasking a high-society predator—but they must prove his crimes before their most observant member loses her memory to Alzheimer’s.",
      mentalPicture: "A cluttered garden shed where high-tech surveillance maps are hidden beneath stacks of '256 Days of Bees' magazines and half-knitted cardigans.",
      audienceAndCost: "Fans of Richard Osman’s 'Thursday Murder Club.' Low-budget, character-driven cosy mystery with high emotional stakes.",
      killerTitle: "Steeped in Deception"
    };

    initialProject.planning.genre = {
      type: "Whydunit",
      requirementA: "The Secret: Malcolm Thorne’s performative grief hiding a 30-year history of manipulation.",
      requirementB: "The Detective: A mismatched group of women whose 'invisible' age is their greatest asset.",
      requirementC: "The Dark Turn: Megs’ diagnosis forcing the team to take risks."
    };

    return { 
      projects: { [initialProjectId]: initialProject },
      projectOrder: [initialProjectId],
      activeProjectId: initialProjectId,
      ignoredCleanupHashes: []
    };
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncToCloud = useCallback(async (leavingView: string) => {
    try {
      const db = getFirestoreInstance();
      const stateDoc = doc(db, "data", "storyboard_state");
      await setDoc(stateDoc, stateRef.current);
      console.log(`Cloud Sync Auto-Trigger: Successfully persisted data after leaving ${leavingView}.`);
    } catch (err) {
      console.warn("Auto-sync skipped: Firebase not configured or connection failed.", err);
    }
  }, []);

  const handleCloudRestore = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      console.log("Compass Trigger: Initiating Full Cloud State Retrieval...");
      const db = getFirestoreInstance();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);

      if (snap.exists()) {
        const cloudData = snap.data() as StoryboardState;
        setState(cloudData);
        console.log("Cloud Architecture Successfully Restored to Local Session.");
        alert("Narrative World Restored from Cloud Archive.");
      } else {
        console.warn("No existing cloud data found in Firestore.");
        alert("No cloud backup found to restore.");
      }
    } catch (err) {
      console.error("Cloud Retrieval Failed:", err);
      alert("Restore failed. Check console or network settings. Forcing long-polling was attempted.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync effect: Push to cloud when moving between screens
  useEffect(() => {
    if (prevViewRef.current !== activeView) {
      const screenLabel = prevViewRef.current === 'PEOPLE' ? 'Character Bible' : prevViewRef.current;
      console.log(`Transition detected: Moving away from ${screenLabel}. Initiating Firestore sync...`);
      syncToCloud(screenLabel);
      prevViewRef.current = activeView;
    }
  }, [activeView, syncToCloud]);

  // Ensure sync on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      syncToCloud('Window Close');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncToCloud]);

  const activeProject = state.projects[state.activeProjectId];

  const leafUnitCount = useMemo(() => 
    Object.values(activeProject.cards).filter(c => c.type === CardType.CHAPTER).length, 
    [activeProject.cards]
  );

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
      <aside className="h-full bg-slate-900 text-slate-400 w-24 group hover:w-64 transition-all flex flex-col items-center py-8 gap-8 border-r border-slate-800 z-50">
        <button 
          onClick={handleCloudRestore}
          disabled={isSyncing}
          title="Initial Load / Restore from Cloud"
          className={`bg-amber-500 p-3 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSyncing ? <Loader2 size={28} className="animate-spin" /> : <Compass size={28} />}
        </button>
        
        <nav className="flex flex-col gap-2 w-full px-3">
          <SidebarItem icon={<Target size={24} />} label="Planning" active={activeView === 'PLANNING'} onClick={() => setActiveView('PLANNING')} />
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Storyboard" active={activeView === 'STORYBOARD'} onClick={() => setActiveView('STORYBOARD')} />
          <SidebarItem icon={<Users size={24} />} label="Character Bible" active={activeView === 'PEOPLE'} onClick={() => setActiveView('PEOPLE')} />
          <SidebarItem icon={<MapPin size={24} />} label="Locations" active={activeView === 'LOCATIONS'} onClick={() => setActiveView('LOCATIONS')} />
          <SidebarItem icon={<Cloud size={24} />} label="Sync & Backup" active={activeView === 'FIREBASE'} onClick={() => setActiveView('FIREBASE')} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-100 px-12 py-6 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">{activeProject.name}</h1>
             <div className="flex items-center gap-4 mt-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                 {activeView === 'PLANNING' ? 'Planning Laboratory' : activeView === 'PEOPLE' ? 'Character Bible' : activeView === 'LOCATIONS' ? 'Locations' : activeView.replace('_', ' ')}
               </span>
               <span className="text-[10px] font-bold text-slate-300">
                 {leafUnitCount} Narrative Units Architected
               </span>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search narrative cards..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-medium w-80 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-12 bg-slate-50/50 custom-scrollbar relative">
          {activeView === 'PLANNING' && (
            <PlanningBoard 
              planning={activeProject.planning} 
              projects={state.projectOrder.map(id => ({ id, name: state.projects[id].name }))}
              characters={Object.values(activeProject.characters)}
              activeProjectId={state.activeProjectId}
              onSwitchProject={handleSwitchProject}
              onCreateProject={handleCreateProject}
              setPlanning={(updates) => updateActiveProject({ planning: { ...activeProject.planning, ...updates } })}
            />
          )}

          {activeView === 'STORYBOARD' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-8 mb-12 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm sticky top-0 z-40">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {(['ALL', CardType.BEAT, CardType.SCENE, CardType.CHAPTER] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button onClick={() => setVisibilityMode('FOCUS')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${visibilityMode === 'FOCUS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Focus</button>
                  <button onClick={() => setVisibilityMode('HIDDEN')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${visibilityMode === 'HIDDEN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Full Map</button>
                </div>

                <div className="flex items-center gap-4 border-l border-slate-200 pl-8 ml-auto">
                  <button onClick={() => setCardScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><Minus size={18} /></button>
                  <span className="text-xs font-black text-slate-400 w-12 text-center">{Math.round(cardScale * 100)}%</span>
                  <button onClick={() => setCardScale(s => Math.min(1.5, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><Plus size={18} /></button>
                </div>
              </div>

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
            </div>
          )}

          {activeView === 'PEOPLE' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Character Bible</h2>
                <button 
                  onClick={handleAddCharacter}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3"
                >
                  <Plus size={18} /> Cast Member
                </button>
              </div>
              <CharacterBible 
                characters={activeProject.characters} 
                characterOrder={activeProject.characterOrder}
                onUpdate={(id, updates) => updateActiveProject({ characters: { ...activeProject.characters, [id]: { ...activeProject.characters[id], ...updates } } })}
                onDelete={(id) => updateActiveProject({ 
                  characters: Object.fromEntries(Object.entries(activeProject.characters).filter(([k]) => k !== id)),
                  characterOrder: activeProject.characterOrder.filter(cid => cid !== id)
                })}
              />
            </div>
          )}

          {activeView === 'LOCATIONS' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">Locations</h2>
                <button 
                  onClick={handleAddLocation}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3"
                >
                  <Plus size={18} /> New Landmark
                </button>
              </div>
              <Locations 
                locations={activeProject.locations} 
                locationOrder={activeProject.locationOrder}
                onUpdate={(id, updates) => updateActiveProject({ locations: { ...activeProject.locations, [id]: { ...activeProject.locations[id], ...updates } } })}
                onDelete={(id) => updateActiveProject({ 
                  locations: Object.fromEntries(Object.entries(activeProject.locations).filter(([k]) => k !== id)),
                  locationOrder: activeProject.locationOrder.filter(lid => lid !== id)
                })}
              />
            </div>
          )}

          {activeView === 'FIREBASE' && (
            <FirebaseSync 
              state={state} 
              onUpdateState={setState} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
