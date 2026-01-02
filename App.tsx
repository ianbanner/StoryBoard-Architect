
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Zap, Search, LayoutDashboard, Users, MapPin, Compass, Cloud, Target, Loader2, LogOut, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, Settings, Database, Binary, BookOpen, Plus, Minus, Sparkles, UserPlus, Lock, ShieldAlert, CheckSquare, Square, Trash2, Key, Gavel, FileDown, Terminal } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, initializeFirestore } from 'firebase/firestore';
import { CardType, StoryCard, StoryboardState, Project, AuthUser, Location, Character, KBArticle, UserProfile, Tag, AIScript } from './types';
import { SidebarItem } from './CommonUI';

// Modular Components
import LandingPage from './LandingPage';
import PlanningBoard from './PlanningBoard';
import TheStoryboard from './TheStoryboard';
import CharacterBible from './CharacterBible';
import Locations from './Locations';
import FirebaseSync from './FirebaseSync';
import DataExplorer from './DataExplorer';
import KnowledgeBaseEditor from './KnowledgeBaseEditor';
import AICleanup from './AICleanup';
import GovernanceHub from './GovernanceHub';
import AIScriptsEditor from './AIScriptsEditor';
import ExportHub from './ExportHub';

const generateId = () => Math.random().toString(36).substr(2, 9);

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

const getFirestoreInstance = () => {
  const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
  try {
    return initializeFirestore(app, { 
      experimentalForceLongPolling: true,
      useFetchStreams: false 
    });
  } catch (e) {
    return getFirestore(app);
  }
};

const BEAT_TEMPLATES = [
  { title: "1. Opening Image", advice: "The first thing we see. Sets the tone, the mood, and the world." },
  { title: "2. Theme Stated", advice: "Someone poses a question or makes a statement that is the theme of the movie." },
  { title: "3. Set-Up", advice: "The 'Before' world. Introduce every character in the A story." },
  { title: "4. Catalyst", advice: "The life-changing event. No turning back." },
  { title: "5. Debate", advice: "The section where the hero doubts or prepares for the journey." },
  { title: "6. Break into Two", advice: "The hero proactively leaves the old world for the new one." },
  { title: "7. B Story", advice: "Where the 'love story' or 'mentor relationship' begins." },
  { title: "8. Fun and Games", advice: "The 'promise of the premise'. The hero explores the new world." },
  { title: "9. Midpoint", advice: "A false victory or false defeat. The stakes are raised." },
  { title: "10. Bad Guys Close In", advice: "External and internal pressures mount." },
  { title: "11. All Is Lost", advice: "The opposite of the midpoint. A 'Whiff of Death'." },
  { title: "12. Dark Night of the Soul", advice: "The hero hits bottom and wallows." },
  { title: "13. Break into Three", advice: "The hero finds the answer and synthesizes A and B stories." },
  { title: "14. Finale", advice: "The hero conquers the antagonist and the world changes." },
  { title: "15. Final Image", advice: "The 'After' world. Opposite of the opening image." }
];

const performNarrativePruning = (project: Project) => {
    if (!project) return;
    const validNumberedTitles = BEAT_TEMPLATES.map(t => t.title);
    
    // Ensure KB is populated
    const newKB: Record<string, KBArticle> = {};
    validNumberedTitles.forEach(numberedTitle => {
        const entry = project.knowledgeBase ? project.knowledgeBase[numberedTitle] : undefined;
        const template = BEAT_TEMPLATES.find(t => t.title === numberedTitle)!;
        newKB[numberedTitle] = {
            id: entry?.id || generateId(),
            title: numberedTitle,
            content: entry?.content || template.advice,
            aiScript: entry?.aiScript || '',
            lastUpdated: Date.now()
        };
    });
    project.knowledgeBase = newKB;

    // Fix Beat mapping
    const beatTitleToId: Record<string, string> = {};
    validNumberedTitles.forEach(title => {
        let existingBeat = Object.values(project.cards || {}).find(c => c.type === CardType.BEAT && c.title === title);
        if (!existingBeat) {
            const newId = generateId();
            if (!project.cards) project.cards = {};
            project.cards[newId] = {
                id: newId,
                type: CardType.BEAT,
                title: title,
                description: `Narrative arc for ${title}...`,
                tags: [],
                children: []
            };
            existingBeat = project.cards[newId];
        }
        beatTitleToId[title] = existingBeat.id;
    });

    project.beatOrder = validNumberedTitles.map(t => beatTitleToId[t]);

    // Ensure AI Scripts registry exists
    if (!project.aiScripts) {
      project.aiScripts = {};
      const defaultId = generateId();
      project.aiScripts[defaultId] = {
        id: defaultId,
        title: "Master Narrative Persona",
        content: "Writer Persona: High-fidelity narrative architect.\nWriting Style: Cinematic, emotive, and structured.\nAudience: Fans of complex character-driven thrillers.",
        isDefault: true
      };
      
      const formattingId = generateId();
      project.aiScripts[formattingId] = {
        id: formattingId,
        title: "Formatting Output",
        content: "You are a professional copywriter and formatter of scripts for films and content for books.\n\nUse the following instructions for formatting the output.\n\nShow each chapter title on its own page as a centred text in large font, and it must include the chapter number. The chapter numbers are decided by you and should be contiguous."
      };
    }
};

const createEmptyProject = (id: string, name: string): Project => {
  const project: Project = {
    id,
    name,
    lastModified: Date.now(), 
    versionLabel: "Initial Draft",
    cards: {},
    beatOrder: [],
    characters: {},
    characterOrder: [],
    locations: {},
    locationOrder: [],
    knowledgeBase: {},
    aiScripts: {},
    planning: {
      title: name,
      projectName: name,
      logline: { irony: "", mentalPicture: "", audienceAndCost: "", killerTitle: "" },
      genre: { type: "Whydunit", requirementA: "", requirementB: "", requirementC: "" },
      groupTransformation: { wants: "", needs: "", primalGoal: "", transformationArc: "" },
      heroTransformations: {}
    }
  };
  performNarrativePruning(project);
  return project;
};

const SUPERUSER_CONFIG: UserProfile = {
  id: "dave-superuser",
  email: "dave@bigagility.com",
  password: "funnypig",
  isSuperuser: true,
  permissions: { KB: true, AI_CLEANUP: true, FIREBASE: true, DATA_EXPLORER: true, ADMIN: true, GOVERNANCE: true, PUBLISHING: true, AI_SCRIPTS: true }
};

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'STORYBOARD' | 'PEOPLE' | 'LOCATIONS' | 'PLANNING' | 'FIREBASE' | 'ADMIN' | 'DATA_EXPLORER' | 'KB' | 'AI_CLEANUP' | 'GOVERNANCE' | 'PUBLISHING' | 'AI_SCRIPTS'>('PLANNING');
  const [searchQuery, setSearchQuery] = useState('');
  const [sbFontSize, setSbFontSize] = useState(12);
  const [visibilityMode, setVisibilityMode] = useState<'FOCUS' | 'HIDDEN'>('FOCUS');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [membershipError, setMembershipError] = useState(false);
  const prevViewRef = useRef(activeView);

  const [isHydrated, setIsHydrated] = useState(false); 
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      setDbStatus('LOADING');
      setShowInitModal(true);
      try {
        const db = getFirestoreInstance();
        const probeDoc = doc(db, "data", "storyboard_state");
        await getDoc(probeDoc);
        setDbStatus('SUCCESS');
      } catch (err: any) {
        setDbStatus('ERROR');
        setDbErrorMsg(`Error Code: ${err.code || 'UNKNOWN_CODE'}\nMessage: ${err.message || 'An unexpected error occurred.'}`);
      }
    };
    initDb();
  }, []);

  const [state, setState] = useState<StoryboardState>(() => {
    const initialProjectId = generateId();
    const initialProjectName = "The Sheffield Ladies Cosy Murder Tea Club";
    const initialProject = createEmptyProject(initialProjectId, initialProjectName);
    
    return { 
      projects: { [initialProjectId]: initialProject },
      projectOrder: [initialProjectId],
      activeProjectId: initialProjectId,
      ignoredCleanupHashes: [],
      users: {
        "dave-superuser": SUPERUSER_CONFIG
      }
    };
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const syncToCloud = useCallback(async () => {
    if (dbStatus !== 'SUCCESS' || !isHydrated || !user) return; 
    try {
      const db = getFirestoreInstance();
      const stateDoc = doc(db, "data", "storyboard_state");
      await setDoc(stateDoc, stateRef.current);
    } catch (err) {
      console.warn("Auto-sync skipped.", err);
    }
  }, [dbStatus, isHydrated, user]);

  const handleCloudRestore = useCallback(async () => {
    if (isSyncing || dbStatus !== 'SUCCESS') return;
    setIsSyncing(true);
    try {
      const db = getFirestoreInstance();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      
      if (snap.exists()) {
        const remoteState = snap.data() as StoryboardState;
        if (!remoteState.users) remoteState.users = {};
        if (!remoteState.ignoredCleanupHashes) remoteState.ignoredCleanupHashes = [];
        
        // Force Dave's superuser status in the remote state
        const daveEmail = "dave@bigagility.com";
        const daveKey = Object.keys(remoteState.users).find(k => remoteState.users[k].email.toLowerCase() === daveEmail);
        
        if (!daveKey) {
          remoteState.users[SUPERUSER_CONFIG.id] = SUPERUSER_CONFIG;
        } else {
          remoteState.users[daveKey] = {
            ...remoteState.users[daveKey],
            ...SUPERUSER_CONFIG,
            id: daveKey 
          };
        }

        Object.values(remoteState.projects).forEach(project => {
            performNarrativePruning(project);
        });
        setState(remoteState);
      }
      setIsHydrated(true); 
    } catch (err) {
      console.error("Cloud Retrieval Failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, dbStatus]);

  useEffect(() => {
    if (dbStatus === 'SUCCESS' && !isHydrated) {
      handleCloudRestore();
    }
  }, [dbStatus, isHydrated, handleCloudRestore]);

  // View Switch Sync
  useEffect(() => {
    if (prevViewRef.current !== activeView && user && isHydrated) {
      syncToCloud();
      prevViewRef.current = activeView;
    }
  }, [activeView, syncToCloud, user, isHydrated]);

  // Debounced Auto-Sync on state change
  useEffect(() => {
    if (!user || !isHydrated || dbStatus !== 'SUCCESS') return;
    const timer = setTimeout(() => {
      syncToCloud();
    }, 3000); 
    return () => clearTimeout(timer);
  }, [state, user, isHydrated, dbStatus, syncToCloud]);

  const handleLogin = (email: string, pass: string) => {
    setMembershipError(false);
    
    if (email.toLowerCase() === "dave@bigagility.com" && pass === "funnypig") {
      setUser(SUPERUSER_CONFIG);
      return;
    }

    const usersList = Object.values(state.users || {}) as UserProfile[];
    const existingUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      setMembershipError(true);
      return;
    }

    if (pass === existingUser.password) {
      setUser(existingUser);
    } else {
      alert("Invalid password.");
    }
  };

  const activeProject = state.projects[state.activeProjectId];

  const updateActiveProject = (updates: Partial<Project>) => {
    if (!state.activeProjectId) return;
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [prev.activeProjectId]: { 
            ...prev.projects[prev.activeProjectId], 
            ...updates,
            lastModified: Date.now()
        }
      }
    }));
  };

  const handleAddChild = (parentId: string) => {
    if (!activeProject) return;
    const parent = activeProject.cards[parentId];
    if (!parent) return;
    const newId = generateId();
    const newType = parent.type === CardType.BEAT ? CardType.SCENE : CardType.CHAPTER;
    const newCard: StoryCard = {
      id: newId,
      type: newType,
      title: `New ${newType}`,
      description: "Enter narrative details...",
      tags: [],
      children: [],
      parentId: parentId
    };
    updateActiveProject({
      cards: {
        ...activeProject.cards,
        [parentId]: { ...parent, children: [...parent.children, newId] },
        [newId]: newCard
      }
    });
  };

  const handleAddSibling = (id: string) => {
    if (!activeProject) return;
    const card = activeProject.cards[id];
    if (!card || !card.parentId) return;
    const parent = activeProject.cards[card.parentId];
    if (!parent) return;
    const newId = generateId();
    const newCard: StoryCard = {
      id: newId,
      type: card.type,
      title: `New ${card.type}`,
      description: "Enter narrative details...",
      tags: [],
      children: [],
      parentId: card.parentId
    };
    const siblingIdx = parent.children.indexOf(id);
    const newChildren = [...parent.children];
    newChildren.splice(siblingIdx + 1, 0, newId);
    updateActiveProject({
      cards: {
        ...activeProject.cards,
        [card.parentId]: { ...parent, children: newChildren },
        [newId]: newCard
      }
    });
  };

  const handleDeleteCard = (id: string) => {
    if (!activeProject) return;
    const card = activeProject.cards[id];
    if (!card) return;
    if (card.type === CardType.BEAT) {
        alert("Top-level beats cannot be deleted.");
        return;
    }
    if (!confirm(`Delete "${card.title}"?`)) return;

    const cardsToDelete = new Set<string>();
    const collectIds = (cid: string) => {
      cardsToDelete.add(cid);
      activeProject.cards[cid]?.children.forEach(collectIds);
    };
    collectIds(id);

    const newCards = { ...activeProject.cards };
    cardsToDelete.forEach(cid => delete newCards[cid]);

    if (card.parentId) {
      const parent = newCards[card.parentId];
      if (parent) {
        newCards[card.parentId] = {
          ...parent,
          children: parent.children.filter(cid => cid !== id)
        };
      }
    }
    updateActiveProject({ cards: newCards });
  };

  const isCardMatching = (id: string) => {
    if (!searchQuery || !activeProject) return true;
    const card = activeProject.cards[id];
    if (!card) return false;
    const query = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(query) || (card.description || "").toLowerCase().includes(query);
  };

  const shouldRenderCard = (id: string) => {
    if (visibilityMode === 'FOCUS' || !searchQuery || !activeProject) return true;
    const checkMatch = (cid: string): boolean => {
      const card = activeProject.cards[cid];
      if (!card) return false;
      if (card.title.toLowerCase().includes(searchQuery.toLowerCase()) || (card.description || "").toLowerCase().includes(searchQuery.toLowerCase())) return true;
      return card.children.some(checkMatch);
    };
    return checkMatch(id);
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} dbStatus={dbStatus} dbErrorMsg={dbErrorMsg} showInitModal={showInitModal} onCloseInitModal={() => setShowInitModal(false)} membershipError={membershipError} />;
  }

  const isAdminActive = ['ADMIN', 'FIREBASE', 'DATA_EXPLORER', 'KB', 'AI_CLEANUP', 'GOVERNANCE', 'PUBLISHING', 'AI_SCRIPTS'].includes(activeView);
  const userPerms = user.permissions || {};
  const isDave = user.email.toLowerCase() === "dave@bigagility.com";

  return (
    <div className="flex h-screen bg-slate-50 font-ui overflow-hidden">
      <aside className="h-full bg-white border-r border-slate-200 w-24 group hover:w-64 transition-all flex flex-col items-center py-8 gap-8 z-50">
        <button 
          onClick={handleCloudRestore}
          disabled={isSyncing || dbStatus !== 'SUCCESS'}
          className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          {isSyncing ? <Loader2 size={28} className="animate-spin" /> : <Compass size={28} />}
        </button>
        
        <nav className="flex flex-col gap-2 w-full px-3 h-full">
          <SidebarItem icon={<Target size={24} />} label="Planning" active={activeView === 'PLANNING'} onClick={() => setActiveView('PLANNING')} />
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Storyboard" active={activeView === 'STORYBOARD'} onClick={() => setActiveView('STORYBOARD')} />
          <SidebarItem icon={<Users size={24} />} label="Character Bible" active={activeView === 'PEOPLE'} onClick={() => setActiveView('PEOPLE')} />
          <SidebarItem icon={<MapPin size={24} />} label="Locations" active={activeView === 'LOCATIONS'} onClick={() => setActiveView('LOCATIONS')} />
          
          <div className="mt-auto flex flex-col gap-2 w-full pb-4">
            {userPerms.ADMIN && (
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                  className={`flex items-center gap-4 rounded-2xl p-3.5 transition-all ${isAdminActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`}
                >
                  <ShieldCheck size={24} />
                  <span className="font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Admin</span>
                  <ChevronDown size={14} className={`ml-auto transition-transform ${isAdminExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isAdminExpanded && (
                  <div className="flex flex-col gap-1 pl-2">
                    {isDave && <SidebarItem isSubmenu icon={<Gavel size={18} />} label="Governance" active={activeView === 'GOVERNANCE'} onClick={() => setActiveView('GOVERNANCE')} />}
                    {userPerms.KB && <SidebarItem isSubmenu icon={<BookOpen size={18} />} label="KB Editor" active={activeView === 'KB'} onClick={() => setActiveView('KB')} />}
                    {userPerms.AI_SCRIPTS && <SidebarItem isSubmenu icon={<Terminal size={18} />} label="AI Scripts" active={activeView === 'AI_SCRIPTS'} onClick={() => setActiveView('AI_SCRIPTS')} />}
                    {userPerms.AI_CLEANUP && <SidebarItem isSubmenu icon={<Sparkles size={18} />} label="AI Cleanup" active={activeView === 'AI_CLEANUP'} onClick={() => setActiveView('AI_CLEANUP')} />}
                    {userPerms.FIREBASE && <SidebarItem isSubmenu icon={<Cloud size={18} />} label="Cloud Vault" active={activeView === 'FIREBASE'} onClick={() => setActiveView('FIREBASE')} />}
                    {userPerms.DATA_EXPLORER && <SidebarItem isSubmenu icon={<Binary size={18} />} label="Data Explorer" active={activeView === 'DATA_EXPLORER'} onClick={() => setActiveView('DATA_EXPLORER')} />}
                    {userPerms.PUBLISHING && <SidebarItem isSubmenu icon={<FileDown size={18} />} label="Publishing" active={activeView === 'PUBLISHING'} onClick={() => setActiveView('PUBLISHING')} />}
                  </div>
                )}
              </div>
            )}
            <SidebarItem icon={<LogOut size={24} />} label="Sign Out" active={false} onClick={() => setUser(null)} />
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{activeView.replace('_', ' ')}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search narrative..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border-none rounded-2xl pl-12 pr-6 py-2.5 text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setVisibilityMode('FOCUS')} className={`p-2 rounded-xl transition-all ${visibilityMode === 'FOCUS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><CheckSquare size={18} /></button>
              <button onClick={() => setVisibilityMode('HIDDEN')} className={`p-2 rounded-xl transition-all ${visibilityMode === 'HIDDEN' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Square size={18} /></button>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
               <button onClick={() => setSbFontSize(Math.max(8, sbFontSize - 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><Minus size={16}/></button>
               <span className="text-[10px] font-black text-slate-400 w-6 text-center">{sbFontSize}</span>
               <button onClick={() => setSbFontSize(Math.min(24, sbFontSize + 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><Plus size={16}/></button>
            </div>
          </div>
        </header>

        <div className={`flex-1 overflow-auto custom-scrollbar bg-[#f8fafc] ${activeView === 'STORYBOARD' ? 'p-0' : 'p-10'}`}>
          {!isHydrated && dbStatus === 'SUCCESS' ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 text-slate-400">
               <Loader2 size={48} className="animate-spin text-indigo-600" />
               <p className="font-desc italic text-lg">Reconstructing the Story Vault...</p>
            </div>
          ) : activeProject ? (
            <>
              {activeView === 'PLANNING' && (
                <div className="max-w-7xl mx-auto">
                  <PlanningBoard 
                    planning={activeProject.planning} 
                    projects={state.projectOrder.map(id => ({ id, name: state.projects[id]?.name || id }))}
                    characters={Object.values(activeProject.characters)}
                    activeProjectId={state.activeProjectId}
                    onSwitchProject={(id) => setState(prev => ({ ...prev, activeProjectId: id }))}
                    onCreateProject={() => {
                      const id = generateId();
                      const p = createEmptyProject(id, "New Story Project");
                      setState(prev => ({ ...prev, projects: { ...prev.projects, [id]: p }, projectOrder: [...prev.projectOrder, id], activeProjectId: id }));
                    }}
                    setPlanning={(updates) => updateActiveProject({ planning: { ...activeProject.planning, ...updates } })}
                  />
                </div>
              )}
              
              {activeView === 'STORYBOARD' && (
                <TheStoryboard 
                  cards={activeProject.cards} 
                  beatOrder={activeProject.beatOrder}
                  characters={Object.values(activeProject.characters)}
                  locations={Object.values(activeProject.locations)}
                  knowledgeBase={activeProject.knowledgeBase}
                  onUpdateCard={(id, updates) => updateActiveProject({ cards: { ...activeProject.cards, [id]: { ...activeProject.cards[id], ...updates } } })}
                  onDeleteCard={handleDeleteCard}
                  onAddChild={handleAddChild}
                  onAddSibling={handleAddSibling}
                  shouldRenderCard={shouldRenderCard}
                  isCardMatching={isCardMatching}
                  visibilityMode={visibilityMode}
                  cardScale={sbFontSize / 12}
                />
              )}

              {activeView === 'PEOPLE' && (
                <div className="max-w-6xl mx-auto">
                  <CharacterBible 
                    characters={activeProject.characters}
                    characterOrder={activeProject.characterOrder}
                    onUpdate={(id, updates) => updateActiveProject({ characters: { ...activeProject.characters, [id]: { ...activeProject.characters[id], ...updates } } })}
                    onDelete={(id) => {
                      if (!confirm("Delete character?")) return;
                      const newChars = { ...activeProject.characters };
                      delete newChars[id];
                      updateActiveProject({ characters: newChars, characterOrder: activeProject.characterOrder.filter(cid => cid !== id) });
                    }}
                    onAdd={() => {
                      const id = generateId();
                      const newChar: Character = {
                        id, name: "New Character", oneWord: "Archetype", oneSentence: "A mysterious stranger...",
                        traits: [], sixThingsToFix: ["", "", "", "", "", ""], primalGoal: "", saveTheCatMoment: ""
                      };
                      updateActiveProject({ characters: { ...activeProject.characters, [id]: newChar }, characterOrder: [...activeProject.characterOrder, id] });
                    }}
                  />
                </div>
              )}

              {activeView === 'LOCATIONS' && (
                <div className="max-w-6xl mx-auto">
                  <Locations 
                    locations={activeProject.locations}
                    locationOrder={activeProject.locationOrder}
                    onUpdate={(id, updates) => updateActiveProject({ locations: { ...activeProject.locations, [id]: { ...activeProject.locations[id], ...updates } } })}
                    onDelete={(id) => {
                      if (!confirm("Delete location?")) return;
                      const newLocs = { ...activeProject.locations };
                      delete newLocs[id];
                      updateActiveProject({ locations: newLocs, locationOrder: activeProject.locationOrder.filter(lid => lid !== id) });
                    }}
                    onAdd={() => {
                      const id = generateId();
                      const newLoc: Location = { id, name: "New Location", description: "Describe the setting...", significance: "Why is this place important?", tags: [] };
                      updateActiveProject({ locations: { ...activeProject.locations, [id]: newLoc }, locationOrder: [...activeProject.locationOrder, id] });
                    }}
                  />
                </div>
              )}

              {activeView === 'KB' && <div className="max-w-6xl mx-auto"><KnowledgeBaseEditor knowledgeBase={activeProject.knowledgeBase} onUpdateKB={(updatedKB) => updateActiveProject({ knowledgeBase: updatedKB })} /></div>}
              {activeView === 'FIREBASE' && <div className="max-w-6xl mx-auto"><FirebaseSync state={state} onUpdateState={setState} /></div>}
              {activeView === 'DATA_EXPLORER' && <div className="max-w-full"><DataExplorer localState={state} /></div>}
              {activeView === 'AI_CLEANUP' && <div className="max-w-4xl mx-auto"><AICleanup state={state} onUpdateState={setState} onSync={syncToCloud} /></div>}
              {activeView === 'GOVERNANCE' && isDave && <div className="max-w-4xl mx-auto"><GovernanceHub state={state} onUpdateState={setState} /></div>}
              {activeView === 'AI_SCRIPTS' && <div className="max-w-4xl mx-auto"><AIScriptsEditor scripts={activeProject.aiScripts || {}} onUpdateScripts={(updated) => updateActiveProject({ aiScripts: updated })} /></div>}
              {activeView === 'PUBLISHING' && <div className="max-w-4xl mx-auto"><ExportHub project={activeProject} /></div>}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
               <AlertCircle size={48} />
               <p className="font-desc italic text-lg">No active project context found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
