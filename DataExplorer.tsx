
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, initializeFirestore } from 'firebase/firestore';
import { 
  Database, Cloud, Layout, Binary, RefreshCw, Layers, Users, 
  MapPin, Target, ChevronRight, X, AlertTriangle, CheckCircle2, 
  ArrowRightLeft, MinusCircle, PlusCircle, Clock, GitBranch, BookOpen, ShieldCheck, Hash, ShieldAlert, Lock, Info, Activity,
  Search, ChevronDown, ListTree, ChevronDownSquare, Layers3, User, Swords, Book
} from 'lucide-react';
import { StoryboardState, CardType, Project, UserProfile, StoryCard, Character, Location } from './types';

interface Props {
  localState: StoryboardState;
}

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

const formatTimestamp = (ts?: number) => {
  if (!ts) return "Unrecorded";
  return new Date(ts).toLocaleString([], { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
};

const DataExplorer: React.FC<Props> = ({ localState }) => {
  const [remoteState, setRemoteState] = useState<StoryboardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'SYSTEM'>('PROJECTS');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'CARDS' | 'CHARACTERS' | 'LOCATIONS'>('ALL');

  const fetchRemote = async () => {
    setLoading(true);
    setError(null);
    try {
      const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
      const db = initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false });
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        setRemoteState(snap.data() as StoryboardState);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemote();
  }, []);

  const localProject = localState.projects[localState.activeProjectId];
  const remoteProject = remoteState?.projects[localState.activeProjectId];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-32 h-screen flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Binary className="text-indigo-600" size={40} />
            Data Explorer
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-1">Structural Audit & Sync Diagnostics</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchRemote}
            disabled={loading}
            className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-3 shadow-sm active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Cloud size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">Refresh Cloud Snap</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-between px-4">
        <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROJECTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Narrative Asset Mirror
          </button>
          <button 
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SYSTEM' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            System Registry
          </button>
        </div>

        {activeTab === 'PROJECTS' && (
          <div className="flex items-center gap-4 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
            {(['ALL', 'CARDS', 'CHARACTERS', 'LOCATIONS'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setAssetFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assetFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-4">
        {activeTab === 'PROJECTS' ? (
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Local Column */}
            <AssetContainer 
              title="Local Session Memory" 
              icon={<Database className="text-slate-400" size={20} />}
              project={localProject}
              filter={assetFilter}
              accent="border-indigo-600"
            />

            {/* Remote Column */}
            <AssetContainer 
              title="Cloud Vault Mirror" 
              icon={<Cloud className="text-indigo-400" size={20} />}
              project={remoteProject}
              filter={assetFilter}
              loading={loading}
              isRemote
            />
          </div>
        ) : (
          <div className="h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Registry Section */}
              <section className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100/50">
                    <Users size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">User Registry</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permission Matrix Integrity</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Local Browser Memory (JSON)</span>
                    <pre className="bg-slate-50 text-indigo-900 p-8 rounded-3xl text-[11px] font-mono overflow-auto max-h-[400px] custom-scrollbar border border-slate-200 shadow-inner">
                      {JSON.stringify(localState.users, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Cloud Storage Snapshot</span>
                    <pre className="bg-slate-50 text-slate-500 p-8 rounded-3xl text-[11px] font-mono overflow-auto max-h-[400px] custom-scrollbar border border-slate-200 italic shadow-inner">
                      {remoteState ? JSON.stringify(remoteState.users, null, 2) : "// Awaiting cloud data link..."}
                    </pre>
                  </div>
                </div>
              </section>

              {/* AI Metadata Section */}
              <section className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100/50">
                    <Hash size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">AI Metadata</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correction Suppression Memory</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Ignored Refinement Hashes (Local)</span>
                    <pre className="bg-slate-50 text-amber-900 p-8 rounded-3xl text-[11px] font-mono overflow-auto max-h-[400px] custom-scrollbar border border-slate-200 shadow-inner">
                      {JSON.stringify(localState.ignoredCleanupHashes, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Ignored Refinement Hashes (Cloud)</span>
                    <pre className="bg-slate-50 text-slate-500 p-8 rounded-3xl text-[11px] font-mono overflow-auto max-h-[400px] custom-scrollbar border border-slate-200 italic shadow-inner">
                      {remoteState ? JSON.stringify(remoteState.ignoredCleanupHashes, null, 2) : "// Awaiting cloud data link..."}
                    </pre>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AssetContainer = ({ title, icon, project, filter, loading, isRemote, accent }: any) => {
  if (!project) {
    return (
      <div className={`h-full bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center space-y-6 ${accent || ''}`}>
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-indigo-600" size={48} />
            <p className="text-lg font-black text-slate-800 uppercase tracking-tight">Retrieving Mirror...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 opacity-40">
            <ShieldAlert size={64} />
            <p className="font-desc italic text-xl">Project context missing in {title}.</p>
          </div>
        )}
      </div>
    );
  }

  const showCards = filter === 'ALL' || filter === 'CARDS';
  const showChars = filter === 'ALL' || filter === 'CHARACTERS';
  const showLocs = filter === 'ALL' || filter === 'LOCATIONS';

  return (
    <div className={`h-full bg-white rounded-[40px] border-2 shadow-2xl flex flex-col overflow-hidden ${accent || 'border-slate-100 shadow-slate-100'}`}>
      {/* Container Header */}
      <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {icon}
          <div>
            <h3 className="text-xl font-black text-slate-800">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.name}</p>
          </div>
        </div>
        <div className="text-right">
           <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Structural Change</span>
           <span className="text-xs font-bold text-slate-600">{formatTimestamp(project.lastModified)}</span>
        </div>
      </div>

      {/* Independent Scrolling Body */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
        {showCards && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-indigo-600">
                <Layout size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Sequenced Narrative Tree</h4>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase">{Object.keys(project.cards).length} Units</span>
            </div>
            <div className="space-y-2">
              {project.beatOrder?.map((beatId: string, idx: number) => (
                <RecursiveCardRow 
                  key={beatId} 
                  id={beatId} 
                  cards={project.cards} 
                  depth={0} 
                  index={idx + 1}
                />
              ))}
              {(!project.beatOrder || project.beatOrder.length === 0) && (
                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center opacity-30 italic font-desc">
                    No narrative sequencing found in this state mirror.
                 </div>
              )}
            </div>
          </div>
        )}

        {showChars && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <Users size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Cast Directory</h4>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase">{Object.keys(project.characters).length} Members</span>
            </div>
            <div className="space-y-3">
              {Object.values(project.characters).map((char: any) => (
                <AssetRow key={char.id} type="character" label={char.name} subtext={char.oneSentence} meta={char.oneWord} />
              ))}
            </div>
          </div>
        )}

        {showLocs && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-amber-600">
                <MapPin size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Atlas Registry</h4>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase">{Object.keys(project.locations).length} Places</span>
            </div>
            <div className="space-y-3">
              {Object.values(project.locations).map((loc: any) => (
                <AssetRow key={loc.id} type="location" label={loc.name} subtext={loc.description} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RecursiveCardRow = ({ id, cards, depth, index }: { id: string; cards: Record<string, StoryCard>; depth: number; index?: number; key?: React.Key }) => {
  const card = cards[id];
  if (!card) return null;

  const childIds = card.children || [];
  const typeColors = {
    [CardType.BEAT]: 'border-amber-200 bg-amber-50/30 text-amber-900',
    [CardType.SCENE]: 'border-blue-200 bg-blue-50/30 text-blue-900',
    [CardType.CHAPTER]: 'border-teal-200 bg-teal-50/30 text-teal-900'
  };

  return (
    <div className="flex flex-col w-full">
      <div 
        className={`p-4 border rounded-2xl transition-all hover:border-indigo-300 group flex items-start gap-3 ${typeColors[card.type]} ${depth > 0 ? 'ml-6 border-dashed mt-1' : 'mb-2'}`}
      >
        <div className="shrink-0 pt-1">
          {card.type === CardType.BEAT ? <Layers3 size={16} className="text-amber-500" /> : 
           card.type === CardType.SCENE ? <ListTree size={16} className="text-blue-500" /> : 
           <ChevronDownSquare size={16} className="text-teal-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2">
                {index !== undefined && <span className="text-xs font-black text-slate-300">{index}.</span>}
                <span className="text-sm font-black truncate">{card.title}</span>
                <span className="text-[8px] font-black uppercase tracking-widest bg-white/50 px-1.5 py-0.5 rounded border border-black/5 opacity-60">
                  {card.type}
                </span>
              </div>
              {card.chapterTitle && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Book size={10} className="text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-widest truncate">Pub: {card.chapterTitle}</span>
                </div>
              )}
            </div>
            {card.emotionalValue && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${card.emotionalValue === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {card.emotionalValue === 'POSITIVE' ? '+' : '-'}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-desc italic line-clamp-1 mt-1 opacity-80">
            {card.description || "No narrative details."}
          </p>
        </div>
      </div>
      {childIds.length > 0 && (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-4 w-0.5 bg-slate-100 pointer-events-none" />
          {childIds.map((childId) => (
            <RecursiveCardRow key={childId} id={childId} cards={cards} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const AssetRow = ({ type, label, subtext, meta }: any) => {
  const iconMap: any = {
    card: <ListTree size={14} className="text-indigo-400" />,
    character: <User size={14} className="text-emerald-400" />,
    location: <MapPin size={14} className="text-amber-400" />
  };

  return (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-indigo-100 transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
           <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-indigo-50">
             {iconMap[type]}
           </div>
           <div>
             <span className="text-sm font-black text-slate-800">{label}</span>
             {meta && <span className="ml-2 text-[8px] font-black uppercase tracking-tighter text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{meta}</span>}
           </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 font-desc italic line-clamp-2 leading-relaxed pl-12">{subtext || "No details provided."}</p>
    </div>
  );
};

export default DataExplorer;
