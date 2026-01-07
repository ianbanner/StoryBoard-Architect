
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Zap, Search, LayoutDashboard, Users, MapPin, Compass, Cloud, Target, Loader2, LogOut, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, Settings, Database, Binary, BookOpen, Plus, Minus, Sparkles, UserPlus, Lock, ShieldAlert, CheckSquare, Square, Trash2, Key, Gavel, FileDown, Terminal, Wifi, Rocket, Repeat, Anchor, ArrowRightLeft } from 'lucide-react';
// Fix: Use namespace import for firebase/app to resolve "no exported member" errors
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, initializeFirestore, Firestore } from 'firebase/firestore';
import { CardType, StoryCard, StoryboardState, Project, AuthUser, Location, Character, KBArticle, UserProfile, Tag, AIScript, BeatType, SetupPayoff, SPPart } from './types';
import { SidebarItem } from './CommonUI';

// Modular Components
import LandingPage from './LandingPage';
import PlanningBoard from './PlanningBoard';
import TheStoryboard from './TheStoryboard';
import CharacterBible from './CharacterBible';
import Locations from './Locations';
import SetupPayoffBible from './SetupPayoffBible';
import FirebaseSync from './FirebaseSync';
// Fix: sanitizeForFirestore is exported from core_utils, not DataExplorer
import DataExplorer from './DataExplorer';
import { sanitizeForFirestore } from './core_utils';
import KnowledgeBaseEditor from './KnowledgeBaseEditor';
import AICleanup from './AICleanup';
import GovernanceHub from './GovernanceHub';
import AIScriptsEditor from './AIScriptsEditor';
import ExportHub from './ExportHub';
import DatabaseSync from './DatabaseSync';
import ProjectBoost from './ProjectBoost';
import MoveThingsAround from './MoveThingsAround';
// Fix: Import central db instance from firebase_init
import { db as centralDb } from './firebase_init';

const generateId = () => Math.random().toString(36).substr(2, 9);

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

// Fix: Reuse the centralized db instance instead of local initialization to avoid redundancy and errors
export const db = centralDb;

const BEAT_METADATA: Record<string, string> = {
  [BeatType.OPENING_IMAGE]: "The first thing we see. Sets the tone, the mood, and the world.",
  [BeatType.THEME_STATED]: "Someone poses a question or makes a statement that is the theme of the movie.",
  [BeatType.SET_UP]: "The 'Before' world. Introduce every character in the A story.",
  [BeatType.CATALYST]: "The life-changing event. No turning back.",
  [BeatType.DEBATE]: "The section where the hero doubts or prepares for the journey.",
  [BeatType.BREAK_INTO_TWO]: "The hero proactively leaves the old world for the new one.",
  [BeatType.B_STORY]: "Where the 'love story' or 'mentor relationship' begins.",
  [BeatType.FUN_AND_GAMES]: "The 'promise of the premise'. The hero explores the new world.",
  [BeatType.MIDPOINT]: "A false victory or false defeat. The stakes are raised.",
  [BeatType.BAD_GUYS_CLOSE_IN]: "External and internal pressures mount.",
  [BeatType.ALL_IS_LOST]: "The opposite of the midpoint. A 'Whiff of Death'.",
  [BeatType.DARK_NIGHT_OF_THE_SOUL]: "The hero hits bottom and wallows.",
  [BeatType.BREAK_INTO_THREE]: "The hero finds the answer and synthesizes A and B stories.",
  [BeatType.FINALE]: "The hero conquers the antagonist and the world changes.",
  [BeatType.FINAL_IMAGE]: "The 'After' world. Opposite of the opening image."
};

const EXTRA_KB_METADATA: Record<string, string> = {
  "Beats overview": "A comprehensive guide to the structural pacing of your story. Every great narrative follows a rhythm of tension and release, anchoring the reader's emotional journey through 15 key points.",
  "setup and pay off overview": "The art of planting seeds early in the story that bear fruit later. Setup involves introducing a concept, object, or character trait that seems minor but becomes critical for the resolution (The Payoff).",
  "Theme and Meaning": "The thematic heart of your project. Why are you telling this story? What is the universal truth you want to explore? Themes ground your characters and give weight to their choices.",
  "The Finale Blueprint": "A deep dive into Act 3 resolution. Learn how to combine the A and B stories into a final push that proves the hero has fundamentally changed."
};

const performNarrativePruning = (project: Project) => {
    if (!project) return;
    const beatTypes = Object.values(BeatType);
    const extraTitles = Object.keys(EXTRA_KB_METADATA);
    const allTitles = [...extraTitles, ...beatTypes];
    
    const newKB: Record<string, KBArticle> = {};
    allTitles.forEach(title => {
        const entry = project.knowledgeBase ? project.knowledgeBase[title] : undefined;
        const defaultContent = (EXTRA_KB_METADATA[title] || BEAT_METADATA[title as BeatType] || "No content defined yet.");
        
        newKB[title] = {
            id: entry?.id || generateId(),
            title: title,
            content: entry?.content || defaultContent,
            aiScript: entry?.aiScript || '',
            lastUpdated: Date.now()
        };
    });
    project.knowledgeBase = newKB;

    if (!project.sceneOrder) project.sceneOrder = [];
    if (!project.setupPayoffs) project.setupPayoffs = {};
    if (!project.setupPayoffOrder) project.setupPayoffOrder = [];
    if (!project.aiScripts) {
      project.aiScripts = {};
      const defaultId = generateId();
      project.aiScripts[defaultId] = {
        id: defaultId,
        title: "Master Narrative Persona",
        content: "Writer Persona: High-fidelity narrative architect.\nWriting Style: Cinematic, emotive, and structured.\nAudience: Fans of complex character-driven thrillers.",
        isDefault: true
      };
    }
};

const createEmptyProject = (id: string, name: string): Project => {
  const cards: Record<string, StoryCard> = {};
  const sceneOrder: string[] = [];
  const megsId = generateId();
  cards[megsId] = {
    id: megsId,
    type: CardType.SCENE,
    title: "Megs declares her mission",
    description: "In a pivotal moment of clarity, Megs stands her ground and outlines the mission to the collective, crossing the point of no return.",
    tags: [],
    children: [],
    associatedBeats: [BeatType.BREAK_INTO_TWO]
  };
  sceneOrder.push(megsId);

  const project: Project = {
    id,
    name,
    lastModified: Date.now(), 
    versionLabel: "Initial Draft",
    cards,
    sceneOrder,
    characters: {},
    characterOrder: [],
    locations: {},
    locationOrder: [],
    setupPayoffs: {},
    setupPayoffOrder: [],
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
  permissions: { KB: true, AI_CLEANUP: true, FIREBASE: true, DATA_EXPLORER: true, ADMIN: true, GOVERNANCE: true, PUBLISHING: true, AI_SCRIPTS: true, DATABASE_SYNC: true, PROJECT_BOOST: true, MOVE_THINGS_AROUND: true }
};

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'STORYBOARD' | 'PEOPLE' | 'LOCATIONS' | 'SETUP_PAYOFF' | 'PLANNING' | 'FIREBASE' | 'ADMIN' | 'DATA_EXPLORER' | 'KB' | 'AI_CLEANUP' | 'GOVERNANCE' | 'PUBLISHING' | 'AI_SCRIPTS' | 'DATABASE_SYNC' | 'PROJECT_BOOST' | 'MOVE_THINGS_AROUND'>('PLANNING');
  const [sbFontSize, setSbFontSize] = useState(12);
  const [visibilityMode, setVisibilityMode] = useState<'FOCUS' | 'HIDDEN'>('FOCUS');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [membershipError, setMembershipError] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); 
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);
  const [showInitModal, setShowInitModal] = useState(false);
  const prevViewRef = useRef(activeView);

  useEffect(() => {
    const initDb = async () => {
      setDbStatus('LOADING');
      setShowInitModal(true);
      try {
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
      users: { "dave-superuser": SUPERUSER_CONFIG }
    };
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const syncToCloud = useCallback(async () => {
    if (dbStatus !== 'SUCCESS' || !isHydrated || !user) return; 
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      const cleanState = sanitizeForFirestore(stateRef.current);
      await setDoc(stateDoc, cleanState);
    } catch (err) {
      console.warn("Auto-sync skipped.", err);
    }
  }, [dbStatus, isHydrated, user]);

  const handleCloudRestore = useCallback(async () => {
    if (isSyncing || dbStatus !== 'SUCCESS') return;
    setIsSyncing(true);
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        const remoteState = snap.data() as StoryboardState;
        if (!remoteState.users) remoteState.users = {};
        if (!remoteState.ignoredCleanupHashes) remoteState.ignoredCleanupHashes = [];
        const daveKey = Object.keys(remoteState.users || {}).find(k => remoteState.users[k]?.email?.toLowerCase() === "dave@bigagility.com");
        if (!daveKey) {
          remoteState.users[SUPERUSER_CONFIG.id] = SUPERUSER_CONFIG;
        } else {
          remoteState.users[daveKey] = { ...remoteState.users[daveKey], ...SUPERUSER_CONFIG, id: daveKey };
        }
        Object.values(remoteState.projects || {}).forEach(project => {
            if (project) performNarrativePruning(project);
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

  useEffect(() => { if (dbStatus === 'SUCCESS' && !isHydrated) handleCloudRestore(); }, [dbStatus, isHydrated, handleCloudRestore]);
  useEffect(() => { if (prevViewRef.current !== activeView && user && isHydrated) { syncToCloud(); prevViewRef.current = activeView; } }, [activeView, syncToCloud, user, isHydrated]);
  useEffect(() => {
    if (!user || !isHydrated || dbStatus !== 'SUCCESS') return;
    const timer = setTimeout(() => { syncToCloud(); }, 5000); 
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
    if (!existingUser) { setMembershipError(true); return; }
    if (pass === existingUser.password) setUser(existingUser);
    else alert("Invalid password.");
  };

  const activeProject = state.projects[state.activeProjectId];
  const updateActiveProject = (updates: Partial<Project>) => {
    if (!state.activeProjectId) return;
    setState(prev => ({
      ...prev,
      projects: {
        ...prev.projects,
        [prev.activeProjectId]: { ...prev.projects[prev.activeProjectId], ...updates, lastModified: Date.now() }
      }
    }));
  };

  const handleAssignBeat = (cardId: string, beat: BeatType) => {
    if (!activeProject) return;
    const newCards = { ...activeProject.cards };
    Object.keys(newCards).forEach(id => {
      const card = newCards[id];
      if (card.associatedBeats?.includes(beat)) {
        newCards[id] = { ...card, associatedBeats: card.associatedBeats.filter(b => b !== beat) };
      }
    });
    const target = newCards[cardId];
    if (target) newCards[cardId] = { ...target, associatedBeats: [...(target.associatedBeats || []), beat] };
    updateActiveProject({ cards: newCards });
  };

  const handleUnassignBeat = (cardId: string, beat: BeatType) => {
    if (!activeProject) return;
    const card = activeProject.cards[cardId];
    if (card) {
      updateActiveProject({
        cards: { ...activeProject.cards, [cardId]: { ...card, associatedBeats: (card.associatedBeats || []).filter(b => b !== beat) } }
      });
    }
  };

  const handleAssignSPPart = (cardId: string, spId: string, part: SPPart) => {
    if (!activeProject) return;
    const newCards = { ...activeProject.cards };
    
    // Unassign this specific SP part from anywhere else first
    Object.keys(newCards).forEach(id => {
      const card = newCards[id];
      if (card.linkedSetupPayoffs?.some(link => link.id === spId && link.part === part)) {
        newCards[id] = { 
          ...card, 
          linkedSetupPayoffs: card.linkedSetupPayoffs.filter(link => !(link.id === spId && link.part === part)) 
        };
      }
    });

    const target = newCards[cardId];
    if (target) {
      newCards[cardId] = { 
        ...target, 
        linkedSetupPayoffs: [...(target.linkedSetupPayoffs || []), { id: spId, part }] 
      };
    }
    updateActiveProject({ cards: newCards });
  };

  const handleUnassignSPPart = (cardId: string, spId: string, part: SPPart) => {
    if (!activeProject) return;
    const card = activeProject.cards[cardId];
    if (card) {
      updateActiveProject({
        cards: { 
          ...activeProject.cards, 
          [cardId]: { 
            ...card, 
            linkedSetupPayoffs: (card.linkedSetupPayoffs || []).filter(link => !(link.id === spId && link.part === part)) 
          } 
        }
      });
    }
  };

  const handleAddChild = (parentId: string) => {
    if (!activeProject) return;
    const parent = activeProject.cards[parentId];
    if (!parent) return;
    const newId = generateId();
    const newCard: StoryCard = { id: newId, type: CardType.CHAPTER, title: `New CHAPTER`, description: "Enter narrative details...", tags: [], children: [], parentId, associatedBeats: [] };
    updateActiveProject({ cards: { ...activeProject.cards, [parentId]: { ...parent, children: [...parent.children, newId] }, [newId]: newCard } });
  };

  const handleAddSibling = (id: string) => {
    if (!activeProject) return;
    const card = activeProject.cards[id];
    if (!card) return;
    const newId = generateId();
    const newCard: StoryCard = { id: newId, type: card.type, title: `New ${card.type}`, description: "Enter narrative details...", tags: [], children: [], parentId: card.parentId, associatedBeats: [] };
    if (!card.parentId) {
      const idx = activeProject.sceneOrder.indexOf(id);
      const newOrder = [...activeProject.sceneOrder];
      newOrder.splice(idx + 1, 0, newId);
      updateActiveProject({ sceneOrder: newOrder, cards: { ...activeProject.cards, [newId]: newCard } });
    } else {
      const parent = activeProject.cards[card.parentId];
      if (!parent) return;
      const idx = parent.children.indexOf(id);
      const newChildren = [...parent.children];
      newChildren.splice(idx + 1, 0, newId);
      updateActiveProject({ cards: { ...activeProject.cards, [card.parentId]: { ...parent, children: newChildren }, [newId]: newCard } });
    }
  };

  const handleDeleteCard = (id: string) => {
    if (!activeProject) return;
    const card = activeProject.cards[id];
    if (!card) return;
    if (!confirm(`Delete "${card.title}"?`)) return;
    const cardsToDelete = new Set<string>();
    const collectIds = (cid: string) => { cardsToDelete.add(cid); activeProject.cards[cid]?.children.forEach(collectIds); };
    collectIds(id);
    const newCards = { ...activeProject.cards };
    cardsToDelete.forEach(cid => delete newCards[cid]);
    if (card.parentId) {
      const parent = newCards[card.parentId];
      if (parent) newCards[card.parentId] = { ...parent, children: parent.children.filter(cid => cid !== id) };
    } else {
      updateActiveProject({ sceneOrder: activeProject.sceneOrder.filter(sid => sid !== id), cards: newCards });
      return;
    }
    updateActiveProject({ cards: newCards });
  };

  if (!user) return <LandingPage onLogin={handleLogin} dbStatus={dbStatus} dbErrorMsg={dbErrorMsg} showInitModal={showInitModal} onCloseInitModal={() => setShowInitModal(false)} membershipError={membershipError} />;

  const isAdminActive = ['ADMIN', 'FIREBASE', 'DATA_EXPLORER', 'KB', 'AI_CLEANUP', 'GOVERNANCE', 'PUBLISHING', 'AI_SCRIPTS', 'DATABASE_SYNC', 'PROJECT_BOOST', 'MOVE_THINGS_AROUND'].includes(activeView);
  const userPerms = user.permissions || {};
  const isDave = user.email.toLowerCase() === "dave@bigagility.com";

  return (
    <div className="flex h-screen bg-slate-50 font-ui overflow-hidden">
      <aside className="h-full bg-white border-r border-slate-200 w-20 group hover:w-72 transition-all flex flex-col items-start py-8 gap-8 z-50 overflow-hidden px-4">
        <div className="w-full flex justify-center group-hover:justify-start transition-all px-2">
          <button onClick={handleCloudRestore} disabled={isSyncing || dbStatus !== 'SUCCESS'} className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100 transition-all hover:scale-110 active:scale-95 disabled:opacity-50">
            {isSyncing ? <Loader2 size={24} className="animate-spin" /> : <Compass size={24} />}
          </button>
        </div>
        <nav className="flex flex-col gap-2 w-full h-full items-start">
          <SidebarItem icon={<Target size={24} />} label="Planning" active={activeView === 'PLANNING'} onClick={() => setActiveView('PLANNING')} />
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Storyboard" active={activeView === 'STORYBOARD'} onClick={() => setActiveView('STORYBOARD')} />
          <SidebarItem icon={<Users size={24} />} label="Character Bible" active={activeView === 'PEOPLE'} onClick={() => setActiveView('PEOPLE')} />
          <SidebarItem icon={<MapPin size={24} />} label="Locations" active={activeView === 'LOCATIONS'} onClick={() => setActiveView('LOCATIONS')} />
          <SidebarItem icon={<Repeat size={24} />} label="Setup & Payoff" active={activeView === 'SETUP_PAYOFF'} onClick={() => setActiveView('SETUP_PAYOFF')} />
          <div className="mt-auto flex flex-col gap-2 w-full pb-4">
            {userPerms.ADMIN && (
              <div className="flex flex-col gap-1 w-full">
                <button onClick={() => setIsAdminExpanded(!isAdminExpanded)} className={`flex items-center gap-4 rounded-2xl p-3.5 transition-all w-full text-left ${isAdminActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <div className="shrink-0 flex items-center justify-center w-8"><ShieldCheck size={24} /></div>
                  <span className="font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">Admin</span>
                  <ChevronDown size={14} className={`ml-auto transition-transform ${isAdminExpanded ? 'rotate-180' : ''} opacity-0 group-hover:opacity-100`} />
                </button>
                {isAdminExpanded && (
                  <div className="flex flex-col gap-1 pl-2 w-full">
                    {userPerms.MOVE_THINGS_AROUND && <SidebarItem isSubmenu icon={<ArrowRightLeft size={18} />} label="Move Things Around" active={activeView === 'MOVE_THINGS_AROUND'} onClick={() => setActiveView('MOVE_THINGS_AROUND')} />}
                    {isDave && <SidebarItem isSubmenu icon={<Gavel size={18} />} label="Governance" active={activeView === 'GOVERNANCE'} onClick={() => setActiveView('GOVERNANCE')} />}
                    {userPerms.DATABASE_SYNC && <SidebarItem isSubmenu icon={<Wifi size={18} />} label="Database Sync" active={activeView === 'DATABASE_SYNC'} onClick={() => setActiveView('DATABASE_SYNC')} />}
                    {userPerms.PROJECT_BOOST && <SidebarItem isSubmenu icon={<Rocket size={18} />} label="Project Boost" active={activeView === 'PROJECT_BOOST'} onClick={() => setActiveView('PROJECT_BOOST')} />}
                    {userPerms.KB && <SidebarItem isSubmenu icon={<BookOpen size={18} />} label="KB Editor" active={activeView === 'KB'} onClick={() => setActiveView('KB')} />}
                    {userPerms.AI_SCRIPTS && <SidebarItem isSubmenu icon={<Terminal size={18} />} label="AI Scripts" active={activeView === 'AI_SCRIPTS'} onClick={() => setActiveView('AI_SCRIPTS')} />}
                    {userPerms.AI_CLEANUP && <SidebarItem isSubmenu icon={<Sparkles size={18} />} label="AI Cleanup" active={activeView === 'AI_CLEANUP'} onClick={() => setActiveView('AI_CLEANUP')} />}
                    {userPerms.FIREBASE && <SidebarItem isSubmenu icon={<Cloud size={18} />} label="Branch Manager" active={activeView === 'FIREBASE'} onClick={() => setActiveView('FIREBASE')} />}
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
          <div className="flex items-center">
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{activeView.replace('_', ' ')}</h1>
            {activeView === 'STORYBOARD' && (
              <div className="flex items-center gap-1 ml-6 bg-slate-50 border border-slate-100 p-1 rounded-xl shadow-sm">
                <button onClick={() => setSbFontSize(Math.max(8, sbFontSize - 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Minus size={14}/></button>
                <span className="text-[10px] font-black text-slate-500 w-8 text-center">{sbFontSize}</span>
                <button onClick={() => setSbFontSize(Math.min(24, sbFontSize + 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Plus size={14}/></button>
              </div>
            )}
          </div>
          {activeView !== 'STORYBOARD' && (
            <div className="flex items-center gap-6">
              <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search narrative..." className="bg-slate-100 border-none rounded-2xl pl-12 pr-6 py-2.5 text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-100 transition-all"/></div>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl"><button onClick={() => setVisibilityMode('FOCUS')} className={`p-2 rounded-xl transition-all ${visibilityMode === 'FOCUS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><CheckSquare size={18} /></button><button onClick={() => setVisibilityMode('HIDDEN')} className={`p-2 rounded-xl transition-all ${visibilityMode === 'HIDDEN' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Square size={18} /></button></div>
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl"><button onClick={() => setSbFontSize(Math.max(8, sbFontSize - 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><Minus size={16}/></button><span className="text-[10px] font-black text-slate-400 w-6 text-center">{sbFontSize}</span><button onClick={() => setSbFontSize(Math.min(24, sbFontSize + 1))} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><Plus size={16}/></button></div>
            </div>
          )}
        </header>
        <div className={`flex-1 overflow-auto custom-scrollbar bg-[#f8fafc] ${activeView === 'STORYBOARD' ? 'p-0' : 'p-10'}`}>
          {!isHydrated && dbStatus === 'SUCCESS' ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 text-slate-400"><Loader2 size={48} className="animate-spin text-indigo-600" /><p className="font-desc italic text-lg">Reconstructing the Story Vault...</p></div>
          ) : activeProject ? (
            <>
              {activeView === 'PLANNING' && <div className="max-w-7xl mx-auto"><PlanningBoard planning={activeProject.planning} projects={(state.projectOrder || []).map(id => ({ id, name: state.projects[id]?.name || id }))} characters={Object.values(activeProject.characters || {})} activeProjectId={state.activeProjectId} onSwitchProject={(id) => setState(prev => ({ ...prev, activeProjectId: id }))} onCreateProject={() => { const id = generateId(); const p = createEmptyProject(id, "New Story Project"); setState(prev => ({ ...prev, projects: { ...prev.projects, [id]: p }, projectOrder: [...(prev.projectOrder || []), id], activeProjectId: id })); }} setPlanning={(updates) => updateActiveProject({ planning: { ...activeProject.planning, ...updates } })} /></div>}
              {activeView === 'STORYBOARD' && <TheStoryboard cards={activeProject.cards} sceneOrder={activeProject.sceneOrder || []} characters={Object.values(activeProject.characters || {})} locations={Object.values(activeProject.locations || {})} setupPayoffs={Object.values(activeProject.setupPayoffs || {})} knowledgeBase={activeProject.knowledgeBase || {}} onUpdateCard={(id, updates) => updateActiveProject({ cards: { ...activeProject.cards, [id]: { ...activeProject.cards[id], ...updates } } })} onDeleteCard={handleDeleteCard} onAddChild={handleAddChild} onAddSibling={handleAddSibling} onAssignBeat={handleAssignBeat} onUnassignBeat={handleUnassignBeat} onAssignSPPart={handleAssignSPPart} onUnassignSPPart={handleUnassignSPPart} cardScale={sbFontSize / 12} isHydrated={isHydrated} currentProjectId={state.activeProjectId} />}
              {activeView === 'PEOPLE' && <div className="max-w-6xl mx-auto"><CharacterBible characters={activeProject.characters || {}} characterOrder={activeProject.characterOrder || []} onUpdate={(id, updates) => updateActiveProject({ characters: { ...activeProject.characters, [id]: { ...activeProject.characters[id], ...updates } } })} onDelete={(id) => { if (!confirm("Delete character?")) return; const newChars = { ...activeProject.characters }; delete newChars[id]; updateActiveProject({ characters: newChars, characterOrder: (activeProject.characterOrder || []).filter(cid => cid !== id) }); }} onAdd={() => { const id = generateId(); const newChar: Character = { id, name: "New Character", oneWord: "Archetype", oneSentence: "A mysterious stranger...", traits: [], sixThingsToFix: ["", "", "", "", "", ""], primalGoal: "", saveTheCatMoment: "" }; updateActiveProject({ characters: { ...activeProject.characters, [id]: newChar }, characterOrder: [...(activeProject.characterOrder || []), id] }); }} /></div>}
              {activeView === 'LOCATIONS' && <div className="max-w-6xl mx-auto"><Locations locations={activeProject.locations || {}} locationOrder={activeProject.locationOrder || []} onUpdate={(id, updates) => updateActiveProject({ locations: { ...activeProject.locations, [id]: { ...activeProject.locations[id], ...updates } } })} onDelete={(id) => { if (!confirm("Delete location?")) return; const newLocs = { ...activeProject.locations }; delete newLocs[id]; updateActiveProject({ locations: newLocs, locationOrder: (activeProject.locationOrder || []).filter(lid => lid !== id) }); }} onAdd={() => { const id = generateId(); const newLoc: Location = { id, name: "New Location", description: "Describe the setting...", significance: "Why is this place important?", tags: [] }; updateActiveProject({ locations: { ...activeProject.locations, [id]: newLoc }, locationOrder: [...(activeProject.locationOrder || []), id] }); }} /></div>}
              {activeView === 'SETUP_PAYOFF' && <div className="max-w-6xl mx-auto"><SetupPayoffBible setupPayoffs={activeProject.setupPayoffs || {}} setupPayoffOrder={activeProject.setupPayoffOrder || []} onUpdate={(id, updates) => updateActiveProject({ setupPayoffs: { ...activeProject.setupPayoffs, [id]: { ...activeProject.setupPayoffs[id], ...updates } } })} onDelete={(id) => { if (!confirm("Delete setup & payoff?")) return; const newSP = { ...activeProject.setupPayoffs }; delete newSP[id]; updateActiveProject({ setupPayoffs: newSP, setupPayoffOrder: (activeProject.setupPayoffOrder || []).filter(spid => spid !== id) }); }} onAdd={() => { const id = generateId(); const newSP: SetupPayoff = { id, title: "New Setup & Payoff", category: 'FLAW', setupDescription: "Plant the seed here...", bumpDescription: "The mid-story reminder...", payoffDescription: "Harvest the result here..." }; updateActiveProject({ setupPayoffs: { ...activeProject.setupPayoffs, [id]: newSP }, setupPayoffOrder: [...(activeProject.setupPayoffOrder || []), id] }); }} /></div>}
              {activeView === 'KB' && <div className="max-w-6xl mx-auto"><KnowledgeBaseEditor knowledgeBase={activeProject.knowledgeBase || {}} onUpdateKB={(updatedKB) => updateActiveProject({ knowledgeBase: updatedKB })} /></div>}
              {activeView === 'FIREBASE' && <div className="max-w-6xl mx-auto"><FirebaseSync state={state} onUpdateState={setState} /></div>}
              {activeView === 'DATA_EXPLORER' && <div className="max-w-full"><DataExplorer localState={state} onUpdateState={setState} /></div>}
              {activeView === 'AI_CLEANUP' && <div className="max-w-4xl mx-auto"><AICleanup state={state} onUpdateState={setState} onSync={syncToCloud} /></div>}
              {activeView === 'GOVERNANCE' && isDave && <div className="max-w-4xl mx-auto"><GovernanceHub state={state} onUpdateState={setState} /></div>}
              {activeView === 'AI_SCRIPTS' && <div className="max-w-4xl mx-auto"><AIScriptsEditor project={activeProject} scripts={activeProject.aiScripts || {}} onUpdateScripts={(updated) => updateActiveProject({ aiScripts: updated })} /></div>}
              {activeView === 'PUBLISHING' && <div className="max-w-4xl mx-auto"><ExportHub project={activeProject} /></div>}
              {activeView === 'DATABASE_SYNC' && <div className="max-w-5xl mx-auto"><DatabaseSync state={state} onUpdateState={setState} initialConfig={FIREBASE_CONFIG} /></div>}
              {activeView === 'PROJECT_BOOST' && <div className="max-w-4xl mx-auto"><ProjectBoost project={activeProject} onUpdateProject={updateActiveProject} /></div>}
              {activeView === 'MOVE_THINGS_AROUND' && <div className="max-w-4xl mx-auto"><MoveThingsAround project={activeProject} onUpdateProject={updateActiveProject} /></div>}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400"><AlertCircle size={48} /><p className="font-desc italic text-lg">No active project context found.</p></div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
