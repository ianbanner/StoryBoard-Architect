
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Zap, Search, LayoutDashboard, Users, MapPin, Compass, Cloud, Target, Loader2, LogOut, ShieldCheck, CheckCircle2, AlertCircle, ChevronDown, Settings, Database, Binary, BookOpen, Plus, Minus, Sparkles, UserPlus, Lock, ShieldAlert, CheckSquare, Square, Trash2, Key } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, initializeFirestore } from 'firebase/firestore';
import { CardType, StoryCard, StoryboardState, Project, AuthUser, Location, Character, KBArticle, UserProfile, Tag } from './types';
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
  permissions: { KB: true, AI_CLEANUP: true, FIREBASE: true, DATA_EXPLORER: true, ADMIN: true }
};

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'STORYBOARD' | 'PEOPLE' | 'LOCATIONS' | 'PLANNING' | 'FIREBASE' | 'ADMIN' | 'DATA_EXPLORER' | 'KB' | 'AI_CLEANUP'>('PLANNING');
  const [searchQuery, setSearchQuery] = useState('');
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
    if (dbStatus !== 'SUCCESS' || !isHydrated) return; 
    try {
      const db = getFirestoreInstance();
      const stateDoc = doc(db, "data", "storyboard_state");
      await setDoc(stateDoc, stateRef.current);
    } catch (err) {
      console.warn("Auto-sync skipped.", err);
    }
  }, [dbStatus, isHydrated]);

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
        const usersList = Object.values(remoteState.users);
        if (!usersList.some(u => u.email.toLowerCase() === "dave@bigagility.com")) {
          remoteState.users[SUPERUSER_CONFIG.id] = SUPERUSER_CONFIG;
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

  useEffect(() => {
    if (prevViewRef.current !== activeView && user && isHydrated) {
      syncToCloud();
      prevViewRef.current = activeView;
    }
  }, [activeView, syncToCloud, user, isHydrated]);

  const handleLogin = (email: string, pass: string) => {
    setMembershipError(false);
    const usersList = Object.values(state.users || {});
    let existingUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existingUser && email.toLowerCase() === "dave@bigagility.com") {
      existingUser = SUPERUSER_CONFIG;
    }
    if (!existingUser) {
      setMembershipError(true);
      return;
    }
    if (pass === 'funnypig' || pass === existingUser.password) {
      setUser(existingUser);
    } else {
      alert("Invalid password.");
    }
  };

  const activeProject = state.projects[state.activeProjectId];

  const updateActiveProject = (updates: Partial<Project>) => {
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
    if (!searchQuery) return true; // Fix: Default to true when not searching to keep colors
    const card = activeProject.cards[id];
    const query = searchQuery.toLowerCase();
    return card.title.toLowerCase().includes(query) || card.description.toLowerCase().includes(query);
  };

  const shouldRenderCard = (id: string) => {
    if (visibilityMode === 'FOCUS' || !searchQuery) return true;
    const checkMatch = (cid: string): boolean => {
      const card = activeProject.cards[cid];
      if (!card) return false;
      if (card.title.toLowerCase().includes(searchQuery.toLowerCase()) || card.description.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      return card.children.some(checkMatch);
    };
    return checkMatch(id);
  };

  const handleAddUser = (email: string, pass: string) => {
    const id = generateId();
    setState(prev => ({
      ...prev,
      users: {
        ...(prev.users || {}),
        [id]: {
          id,
          email,
          password: pass,
          isSuperuser: false,
          permissions: { KB: false, AI_CLEANUP: false, FIREBASE: false, DATA_EXPLORER: false, ADMIN: false }
        }
      }
    }));
  };

  const toggleUserPermission = (userId: string, permissionKey: string) => {
    setState(prev => {
      const users = prev.users || {};
      const u = users[userId];
      if (!u) return prev;
      return {
        ...prev,
        users: {
          ...users,
          [userId]: {
            ...u,
            permissions: {
              ...(u.permissions || {}),
              [permissionKey]: !u.permissions?.[permissionKey]
            }
          }
        }
      };
    });
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} dbStatus={dbStatus} dbErrorMsg={dbErrorMsg} showInitModal={showInitModal} onCloseInitModal={() => setShowInitModal(false)} membershipError={membershipError} />;
  }

  const isAdminActive = ['ADMIN', 'FIREBASE', 'DATA_EXPLORER', 'KB', 'AI_CLEANUP'].includes(activeView);
  const userPerms = user.permissions || {};

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
        
        <nav className="flex flex-col gap-2 w-full px-3">
          <SidebarItem icon={<Target size={24} />} label="Planning" active={activeView === 'PLANNING'} onClick={() => setActiveView('PLANNING')} />
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Storyboard" active={activeView === 'STORYBOARD'} onClick={() => setActiveView('STORYBOARD')} />
          <SidebarItem icon={<Users size={24} />} label="Character Bible" active={activeView === 'PEOPLE'} onClick={() => setActiveView('PEOPLE')} />
          <SidebarItem icon={<MapPin size={24} />} label="Locations" active={activeView === 'LOCATIONS'} onClick={() => setActiveView('LOCATIONS')} />
          
          <div className="flex flex-col gap-1 mt-4">
            <button 
              onClick={() => setIsAdminExpanded(!isAdminExpanded)}
              className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${isAdminActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-400'}`}
            >
              <div className="shrink-0"><Settings size={24} /></div>
              <div className="flex-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden whitespace-nowrap">
                <span className="font-bold text-lg text-slate-700">Admin</span>
                <ChevronDown size={18} className={`transition-transform duration-300 ${isAdminExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {isAdminExpanded && (
              <div className="flex flex-col gap-1 ml-4 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {userPerms.KB && <SidebarItem icon={<BookOpen size={20} />} label="Knowledge Base" active={activeView === 'KB'} onClick={() => setActiveView('KB')} isSubmenu />}
                {userPerms.AI_CLEANUP && <SidebarItem icon={<Sparkles size={20} />} label="AI Cleanup" active={activeView === 'AI_CLEANUP'} onClick={() => setActiveView('AI_CLEANUP')} isSubmenu />}
                {userPerms.FIREBASE && <SidebarItem icon={<Cloud size={20} />} label="Sync & Backup" active={activeView === 'FIREBASE'} onClick={() => setActiveView('FIREBASE')} isSubmenu />}
                {userPerms.DATA_EXPLORER && <SidebarItem icon={<Binary size={20} />} label="Data Explorer" active={activeView === 'DATA_EXPLORER'} onClick={() => setActiveView('DATA_EXPLORER')} isSubmenu />}
                {user.isSuperuser && <SidebarItem icon={<ShieldCheck size={20} />} label="Governance" active={activeView === 'ADMIN'} onClick={() => setActiveView('ADMIN')} isSubmenu />}
              </div>
            )}
          </div>
        </nav>

        <div className="mt-auto w-full px-3 flex flex-col gap-2 border-t border-slate-100 pt-8">
          <SidebarItem icon={<LogOut size={24} />} label="Logoff Session" onClick={() => setUser(null)} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white border-b border-slate-100 px-12 py-6 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${dbStatus === 'ERROR' ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                  <Zap size={16} fill="currentColor" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{activeProject?.name || 'Loading Project...'}</h1>
             </div>
             <div className="flex items-center gap-4 mt-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                 {!isHydrated ? 'Initializing...' : activeView.replace('_', ' ')}
               </span>
               <span className="text-[10px] font-bold text-slate-300 italic truncate max-w-[200px]">
                {user.email}
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search narrative cards..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-medium w-80 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-12 bg-slate-50/50 custom-scrollbar relative">
          {!isHydrated && (
            <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
              <p className="font-bold text-slate-600 animate-pulse">Establishing Link to Cloud Vault...</p>
            </div>
          )}

          {activeProject && (
            <>
              {activeView === 'PLANNING' && <PlanningBoard planning={activeProject.planning} projects={state.projectOrder.map(id => ({ id, name: state.projects[id]?.name || id }))} characters={Object.values(activeProject.characters || {})} activeProjectId={state.activeProjectId} onSwitchProject={(id) => setState(prev => ({...prev, activeProjectId: id}))} onCreateProject={() => {}} setPlanning={(updates) => updateActiveProject({ planning: { ...activeProject.planning, ...updates } })} />}
              {activeView === 'STORYBOARD' && <TheStoryboard cards={activeProject.cards || {}} beatOrder={activeProject.beatOrder || []} characters={Object.values(activeProject.characters || {})} locations={Object.values(activeProject.locations || {})} knowledgeBase={activeProject.knowledgeBase || {}} onUpdateCard={(id, updates) => updateActiveProject({ cards: { ...activeProject.cards, [id]: { ...activeProject.cards[id], ...updates } } })} onDeleteCard={handleDeleteCard} onAddChild={handleAddChild} onAddSibling={handleAddSibling} shouldRenderCard={shouldRenderCard} isCardMatching={isCardMatching} visibilityMode={visibilityMode} cardScale={1.0} />}
              {activeView === 'PEOPLE' && <CharacterBible characters={activeProject.characters || {}} characterOrder={activeProject.characterOrder || []} onUpdate={(id, updates) => updateActiveProject({ characters: { ...activeProject.characters, [id]: { ...activeProject.characters[id], ...updates } } })} onDelete={() => {}} onAdd={() => {}} />}
              {activeView === 'LOCATIONS' && <Locations locations={activeProject.locations || {}} locationOrder={activeProject.locationOrder || []} onUpdate={(id, updates) => updateActiveProject({ locations: { ...activeProject.locations, [id]: { ...activeProject.locations[id], ...updates } } })} onDelete={() => {}} onAdd={() => {}} />}
              {activeView === 'KB' && <KnowledgeBaseEditor knowledgeBase={activeProject.knowledgeBase || {}} onUpdateKB={(updatedKB) => updateActiveProject({ knowledgeBase: updatedKB })} />}
              {activeView === 'AI_CLEANUP' && <AICleanup state={state} onUpdateState={setState} onSync={syncToCloud} />}
              {activeView === 'FIREBASE' && <FirebaseSync state={state} onUpdateState={setState} />}
              {activeView === 'DATA_EXPLORER' && <DataExplorer localState={state} />}
              {activeView === 'ADMIN' && user.isSuperuser && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <ShieldCheck className="text-indigo-600" size={40} />
                        System Governance
                      </h2>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-1">Global Permissions & Registry</p>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-50">
                          <th className="text-left py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">User Identity</th>
                          <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">KB Access</th>
                          <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">AI Tools</th>
                          <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Cloud Sync</th>
                          <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Audit Logs</th>
                          <th className="py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(state.users || {}).map(u => (
                          <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-6 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                  <Users size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{u.email}</span>
                                  {u.isSuperuser && <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">Superuser</span>}
                                </div>
                              </div>
                            </td>
                            {['KB', 'AI_CLEANUP', 'FIREBASE', 'DATA_EXPLORER'].map(perm => (
                              <td key={perm} className="py-6 px-4 text-center">
                                <button 
                                  onClick={() => toggleUserPermission(u.id, perm)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${u.permissions?.[perm] ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-300'}`}
                                >
                                  {u.permissions?.[perm] ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                                </button>
                              </td>
                            ))}
                            <td className="py-6 px-4 text-center">
                               {!u.isSuperuser && (
                                 <button onClick={() => {}} className="text-slate-300 hover:text-rose-500 transition-colors">
                                   <Trash2 size={20} />
                                 </button>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
