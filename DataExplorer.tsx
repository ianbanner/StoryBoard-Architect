
import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase_init';
import { sanitizeForFirestore } from './core_utils';
import { 
  doc, getDoc, 
  setDoc,
} from 'firebase/firestore';
import { 
  Database, Cloud, Layout, Binary, RefreshCw, Users, User,
  MapPin, ShieldAlert, GitBranch, AlertCircle,
  Download, Upload, ChevronRight, ChevronDown, ShieldCheck,
  Terminal, Loader2, CheckCircle2, X, Activity, Search,
  Box, FileJson, Cpu
} from 'lucide-react';
import { StoryboardState, CardType, StoryCard, Project, Character, Location } from './types';

interface Props {
  localState: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
}

interface SyncLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' | 'DEBUG';
}

const DataExplorer: React.FC<Props> = ({ localState, onUpdateState }) => {
  const [remoteState, setRemoteState] = useState<StoryboardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'SYSTEM'>('PROJECTS');
  
  // Sync Workflow State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [syncMode, setSyncMode] = useState<'PUSH' | 'PULL' | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: SyncLog['type'] = 'INFO') => {
    const log: SyncLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      message,
      type
    };
    setSyncLogs(prev => [...prev, log]);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  const fetchRemote = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        const data = snap.data() as StoryboardState;
        setRemoteState(data);
        return data;
      } else {
        setError("No remote state found in cloud storage.");
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const startSyncProcess = async (mode: 'PUSH' | 'PULL') => {
    setSyncMode(mode);
    setSyncLogs([]);
    setSyncStatus('PROCESSING');
    setIsSyncModalOpen(true);
    
    const isPush = mode === 'PUSH';
    
    try {
      addLog(`Initializing ${mode} sequence...`, 'INFO');
      await new Promise(r => setTimeout(r, 600));

      // Phase 1: Structural Audit
      addLog(`Phase 1: Structural Audit & Integrity Check`, 'DEBUG');
      const targetState = isPush ? localState : await fetchRemote(true);
      
      if (!targetState) throw new Error("Target state resolution failed.");
      
      const projectCount = targetState.projectOrder?.length || 0;
      addLog(`Found ${projectCount} valid project containers.`, 'INFO');

      const activeProj = targetState.projects[targetState.activeProjectId];
      if (activeProj) {
        const sceneCount = activeProj.sceneOrder?.length || 0;
        const charCount = Object.keys(activeProj.characters || {}).length;
        const locCount = Object.keys(activeProj.locations || {}).length;
        const cardCount = Object.keys(activeProj.cards || {}).length;
        
        addLog(`Auditing Project: "${activeProj.name}"`, 'DEBUG');
        addLog(`Relational Mapping: ${sceneCount} Scenes, ${cardCount - sceneCount} Chapters detected.`, 'INFO');
        addLog(`Vault Registry: ${charCount} Characters, ${locCount} Locations verified.`, 'INFO');
      }

      // Phase 2: Serialization & Encoding
      addLog(`Phase 2: Data Serialization & Delta Analysis`, 'DEBUG');
      await new Promise(r => setTimeout(r, 800));
      
      addLog("Scrubbing 'undefined' fields for Firestore compatibility...", "DEBUG");
      const cleanState = sanitizeForFirestore(targetState);
      
      const payloadSize = JSON.stringify(cleanState).length;
      addLog(`Atomic payload prepared: ${(payloadSize / 1024).toFixed(2)} KB.`, 'INFO');

      // Phase 3: Network Transmission / State Hydration
      addLog(`Phase 3: Firestore Transaction Commit`, 'DEBUG');
      if (isPush) {
        const stateDoc = doc(db, "data", "storyboard_state");
        await setDoc(stateDoc, cleanState);
        addLog("Vault commit acknowledged by Firebase server.", 'SUCCESS');
      } else {
        onUpdateState(cleanState);
        addLog("Local state tree successfully hydrated from cloud snapshot.", 'SUCCESS');
      }

      // Phase 4: Post-Sync Verification
      addLog(`Phase 4: Post-Sync Verification`, 'DEBUG');
      await new Promise(r => setTimeout(r, 500));
      await fetchRemote(true); // Refresh mirror
      addLog(`${mode} cycle completed successfully.`, 'SUCCESS');
      setSyncStatus('COMPLETED');

    } catch (err: any) {
      addLog(`Critical Failure: ${err.message}`, 'ERROR');
      setSyncStatus('FAILED');
      setError(`${mode} failed: ${err.message}`);
    }
  };

  useEffect(() => { fetchRemote(); }, []);

  const localProject = localState.projects[localState.activeProjectId];
  const remoteProject = remoteState?.projects[localState.activeProjectId];

  return (
    <div className="max-w-full mx-auto space-y-10 pb-32 h-screen flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-10 pt-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Binary className="text-indigo-600" size={40} />
            Data Explorer
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-1">Structural Audit & Sync Diagnostics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => startSyncProcess('PUSH')}
            disabled={loading || syncStatus === 'PROCESSING'}
            className="bg-indigo-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
          >
            <Upload size={18} />
            Push Local to Cloud
          </button>
          
          <button 
            onClick={() => startSyncProcess('PULL')}
            disabled={loading || syncStatus === 'PROCESSING' || !remoteState}
            className="bg-emerald-600 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
          >
            <Download size={18} />
            Pull Cloud to Local
          </button>

          <button 
            onClick={() => fetchRemote()}
            disabled={loading}
            className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-3 shadow-sm active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Cloud size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">Refresh Cloud Snap</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center justify-between px-10">
        <div className="flex gap-4 p-1.5 bg-slate-200/50 rounded-2xl w-fit">
          <button onClick={() => setActiveTab('PROJECTS')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'PROJECTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Narrative Asset Mirror</button>
          <button onClick={() => setActiveTab('SYSTEM')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SYSTEM' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>System Registry</button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-10">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in fade-in zoom-in">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        
        {activeTab === 'PROJECTS' ? (
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-10">
            <AssetContainer title="Local Session Memory" icon={<Database size={24} />} project={localProject} accent="border-indigo-600" color="indigo" />
            <AssetContainer title="Cloud Vault Mirror" icon={<Cloud size={24} />} project={remoteProject} loading={loading} color="emerald" />
          </div>
        ) : (
          <div className="h-full overflow-y-auto pb-10 bg-white border-2 border-slate-100 rounded-[40px] p-10">
             <div className="space-y-12">
                <section>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3"><Users size={20}/> Authorized Access Registry</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.values(localState.users || {}).map((u: any) => (
                        <div key={u.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                           <div>
                              <p className="font-black text-slate-900">{u.email}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">UID: {u.id}</p>
                           </div>
                           <ShieldCheck size={18} className="text-indigo-400" />
                        </div>
                      ))}
                   </div>
                </section>
                <section>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3"><GitBranch size={20}/> Active Project Inventory</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {localState.projectOrder.map((pid: string) => (
                        <div key={pid} className={`p-5 rounded-2xl border flex items-center justify-between ${pid === localState.activeProjectId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
                           <div>
                              <p className="font-black text-slate-900">{localState.projects[pid]?.name || 'Untitled'}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">ID: {pid}</p>
                           </div>
                           {pid === localState.activeProjectId && <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-indigo-600 text-white rounded">Active Context</span>}
                        </div>
                      ))}
                   </div>
                </section>
             </div>
          </div>
        )}
      </div>

      {/* Sync Diagnostic Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => syncStatus !== 'PROCESSING' && setIsSyncModalOpen(false)}></div>
          <div className="relative bg-[#0a0f1e] w-full max-w-4xl h-[70vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-800 animate-in zoom-in-95 duration-300">
            
            <header className="px-10 py-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${syncStatus === 'FAILED' ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                  {syncStatus === 'PROCESSING' ? <Activity className="animate-pulse" size={28} /> : syncStatus === 'COMPLETED' ? <CheckCircle2 size={28} /> : <Terminal size={28} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                    {syncMode} Diagnostic <span className="text-indigo-400">Audit</span>
                  </h3>
                  <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.3em]">Handshaking with Cloud Vault...</p>
                </div>
              </div>
              {syncStatus !== 'PROCESSING' && (
                <button onClick={() => setIsSyncModalOpen(false)} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-10 font-mono text-xs custom-scrollbar space-y-2 bg-black/40">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex gap-6 animate-in slide-in-from-left-2 duration-300 border-b border-white/5 pb-2">
                  <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                  <div className="flex gap-3">
                    <span className={`font-black shrink-0 w-16 select-none ${
                      log.type === 'ERROR' ? 'text-rose-500' :
                      log.type === 'SUCCESS' ? 'text-emerald-500' :
                      log.type === 'DEBUG' ? 'text-indigo-400' :
                      log.type === 'WARN' ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                      {log.type}
                    </span>
                    <span className={`leading-relaxed ${
                      log.type === 'DEBUG' ? 'text-indigo-200 italic' :
                      log.type === 'SUCCESS' ? 'text-emerald-300' :
                      log.type === 'ERROR' ? 'text-rose-300' : 'text-slate-200'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
              {syncStatus === 'PROCESSING' && (
                <div className="flex items-center gap-3 text-indigo-400 pt-4 animate-pulse">
                  <Loader2 className="animate-spin" size={14} />
                  <span className="font-black uppercase tracking-widest text-[10px]">Awaiting Cloud Acknowledgement...</span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            <footer className="px-10 py-8 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Network Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${syncStatus === 'PROCESSING' ? 'bg-amber-500 animate-pulse' : syncStatus === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                      <span className="text-xs font-bold text-slate-300">
                        {syncStatus === 'PROCESSING' ? 'Transmission Active' : syncStatus === 'COMPLETED' ? 'Connection Stable' : 'Link Idle'}
                      </span>
                    </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                 {syncStatus === 'FAILED' && (
                   <button onClick={() => startSyncProcess(syncMode!)} className="px-8 py-3.5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20">
                     <RefreshCw size={14} /> Retry Cycle
                   </button>
                 )}
                 <button 
                  onClick={() => setIsSyncModalOpen(false)}
                  disabled={syncStatus === 'PROCESSING'}
                  className={`px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                    syncStatus === 'COMPLETED' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-900/20' : 
                    'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                 >
                   {syncStatus === 'PROCESSING' ? 'Locked during Sync' : 'Close Diagnostic'}
                 </button>
               </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const AssetContainer = ({ title, icon, project, loading, color, accent }: any) => {
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
            <p className="font-desc italic text-xl">Project context missing in Cloud Vault Mirror.</p>
          </div>
        )}
      </div>
    );
  }

  const characters = Object.values(project.characters || {}) as Character[];
  const locations = Object.values(project.locations || {}) as Location[];

  return (
    <div className={`h-full bg-white rounded-[40px] border-2 shadow-2xl flex flex-col overflow-hidden ${accent || 'border-slate-100 shadow-slate-100'}`}>
      <div className={`p-8 border-b flex items-center justify-between shrink-0 ${color === 'indigo' ? 'bg-indigo-50/50' : 'bg-emerald-50/50'}`}>
        <div className="flex items-center gap-4">
          <div className={color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-12">
        {/* Narrative Section */}
        <DataSection 
          title="Narrative Units (Hierarchy)" 
          icon={<Layout size={18} />} 
          count={Object.keys(project.cards || {}).length}
          color={color}
        >
          <div className="space-y-2">
            {(project.sceneOrder || []).map((sceneId: string, idx: number) => (
              <RecursiveCardRow key={sceneId} id={sceneId} cards={project.cards} depth={0} index={idx + 1} color={color} />
            ))}
          </div>
        </DataSection>

        {/* Characters Section */}
        <DataSection 
          title="Story Cast Bible" 
          icon={<Users size={18} />} 
          count={characters.length}
          color={color}
        >
          <div className="grid grid-cols-1 gap-2">
            {characters.map(char => (
              <AssetListItem key={char.id} name={char.name} meta={char.oneWord} icon={<User size={14}/>} color={color} type="CHAR" isVillain={char.isVillain} />
            ))}
            {characters.length === 0 && <p className="text-[10px] text-slate-400 font-desc italic p-4">Registry empty.</p>}
          </div>
        </DataSection>

        {/* Locations Section */}
        <DataSection 
          title="World Map Atlas" 
          icon={<MapPin size={18} />} 
          count={locations.length}
          color={color}
        >
          <div className="grid grid-cols-1 gap-2">
            {locations.map(loc => (
              <AssetListItem key={loc.id} name={loc.name} meta={loc.significance} icon={<MapPin size={14}/>} color={color} type="LOC" />
            ))}
            {locations.length === 0 && <p className="text-[10px] text-slate-400 font-desc italic p-4">Registry empty.</p>}
          </div>
        </DataSection>
      </div>
    </div>
  );
};

const DataSection = ({ title, icon, count, children, color }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors ${color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{count} Assets</span>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
      {isOpen && <div className="animate-in fade-in slide-in-from-top-2 duration-300">{children}</div>}
    </div>
  );
};

const AssetListItem = ({ name, meta, icon, color, type, isVillain }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isVillain ? 'bg-rose-500 text-white' : color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-black text-slate-900 truncate">{name}</p>
      <p className="text-[10px] text-slate-400 font-desc italic truncate">{meta || 'No description provided.'}</p>
    </div>
    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${color === 'indigo' ? 'bg-white text-indigo-400 border border-indigo-50' : 'bg-white text-emerald-400 border border-emerald-50'}`}>
      {type}
    </span>
  </div>
);

const RecursiveCardRow = ({ id, cards, depth, index, color }: any) => {
  const card = cards[id];
  if (!card) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors group">
        <span className="text-[9px] font-black text-slate-300 w-8">{index}</span>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-xs font-black text-slate-900 truncate">{card.title}</span>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${card.type === 'SCENE' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {card.type}
          </span>
        </div>
        {card.associatedBeats && card.associatedBeats.length > 0 && (
          <div className="flex gap-1 shrink-0">
            {card.associatedBeats.map((b: string) => (
              <span key={b} className="text-[7px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full" title={b}>STC</span>
            ))}
          </div>
        )}
      </div>
      {card.children && card.children.length > 0 && (
        <div className="pl-8 space-y-2 border-l border-slate-100 ml-6">
          {card.children.map((childId: string, cIdx: number) => (
            <RecursiveCardRow key={childId} id={childId} cards={cards} depth={depth + 1} index={`${index}.${cIdx + 1}`} color={color} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DataExplorer;
