
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { Cloud, UploadCloud, DownloadCloud, Database, RefreshCw, Terminal, Eye, CheckCircle, AlertTriangle, FileText, Users, MapPin, Layers, Layout, Target } from 'lucide-react';
import { StoryboardState, CardType } from './types';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
}

const DEFAULT_CONFIG = {
  apiKey: "AIzaSyA8_Dx6M0U-OE5WChRnZgia0fRiHGp0e0I",
  authDomain: "storyboard-architect.firebaseapp.com",
  projectId: "storyboard-architect",
  storageBucket: "storyboard-architect.firebasestorage.app",
  messagingSenderId: "688524050076",
  appId: "1:688524050076:web:d9d4a0d6f4f2219ccab759"
};

const FirebaseSync: React.FC<Props> = ({ state, onUpdateState }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isInitialized, setIsInitialized] = useState(false);
  const [logs, setLogs] = useState<{ time: string; msg: string; type?: 'info' | 'error' | 'success' }[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [cloudSummary, setCloudSummary] = useState<any>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  useEffect(() => {
    addLog("Page mounted. Checking connection...");
    handleConnect();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnect = async () => {
    try {
      setLoading('connecting');
      addLog(`Connecting to Firebase project: ${config.projectId}...`);
      
      let app: FirebaseApp;
      if (getApps().length === 0) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      
      const db = getFirestore(app);
      setIsInitialized(true);
      addLog("Firebase initialized successfully.", 'success');
    } catch (error: any) {
      addLog(`Initialization failed: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handlePush = async () => {
    if (!isInitialized) return addLog("Initialize Firebase first!", 'error');
    try {
      setLoading('pushing');
      addLog("Starting cloud push...");
      const db = getFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      
      await setDoc(stateDoc, state);
      
      addLog("Push successful! Local data uploaded to Firestore.", 'success');
    } catch (error: any) {
      addLog(`Push failed: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handlePull = async () => {
    if (!isInitialized) return addLog("Initialize Firebase first!", 'error');
    if (!confirm("This will replace all local data with the version currently in the cloud. Proceed?")) return;
    
    try {
      setLoading('pulling');
      addLog("Fetching cloud data for local restoration...");
      const db = getFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);

      if (snap.exists()) {
        const cloudData = snap.data() as StoryboardState;
        onUpdateState(cloudData);
        addLog("Pull successful! State restored from Cloud.", 'success');
      } else {
        addLog("No cloud data found to pull.", 'error');
      }
    } catch (error: any) {
      addLog(`Pull failed: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleInspect = async () => {
    if (!isInitialized) return addLog("Initialize Firebase first!", 'error');
    try {
      setLoading('inspecting');
      addLog("Inspecting full data schema in cloud storage...");
      const db = getFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      
      if (snap.exists()) {
        const data = snap.data() as StoryboardState;
        
        // Aggregate statistics across all projects
        let totalBeats = 0;
        let totalScenes = 0;
        let totalChapters = 0;
        let totalCharacters = 0;
        let totalLocations = 0;

        Object.values(data.projects || {}).forEach(proj => {
          Object.values(proj.cards || {}).forEach(card => {
            if (card.type === CardType.BEAT) totalBeats++;
            if (card.type === CardType.SCENE) totalScenes++;
            if (card.type === CardType.CHAPTER) totalChapters++;
          });
          totalCharacters += Object.keys(proj.characters || {}).length;
          totalLocations += Object.keys(proj.locations || {}).length;
        });

        setCloudSummary({
          projectsCount: Object.keys(data.projects || {}).length,
          activeProjectName: data.projects[data.activeProjectId]?.name || 'Unidentified',
          beats: totalBeats,
          scenes: totalScenes,
          chapters: totalChapters,
          characters: totalCharacters,
          locations: totalLocations,
          lastSync: new Date().toLocaleString(),
          hasPlanning: Object.values(data.projects || {}).some(p => p.planning?.logline?.irony !== "")
        });
        addLog("Full schema inspection complete.", 'success');
      } else {
        addLog("Database is currently empty.", 'info');
      }
    } catch (error: any) {
      addLog(`Inspection failed: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-40">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4">
          <Database className="text-indigo-600" size={40} />
          Cloud Archive & Sync
        </h2>
        <p className="text-slate-500 font-desc max-w-2xl text-lg leading-relaxed">
          Manage your storyboard assets in the cloud. Overwrite remote backups or pull previous versions to synchronize across workstations.
        </p>
      </div>

      {/* 1. Configuration Section */}
      <section className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="text-indigo-600 font-mono">01.</span> Global Setup
          </h3>
          {isInitialized && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200">
              <CheckCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Link Established</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SyncField label="API KEY" value={config.apiKey} onChange={v => setConfig({...config, apiKey: v})} />
          <SyncField label="PROJECT ID" value={config.projectId} onChange={v => setConfig({...config, projectId: v})} />
        </div>

        <button 
          onClick={handleConnect}
          disabled={loading === 'connecting'}
          className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${isInitialized ? 'bg-slate-100 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'}`}
        >
          {loading === 'connecting' ? <RefreshCw className="animate-spin" /> : <Database size={18} />}
          {isInitialized ? 'Update Connection' : 'Establish Cloud Connection'}
        </button>
      </section>

      {/* 2. Data Synchronization Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SyncActionCard 
          icon={<UploadCloud size={40} />}
          title="Backup to Cloud"
          description="Push all local projects, characters, and narrative maps to Firestore."
          buttonLabel="Upload Local State"
          onClick={handlePush}
          loading={loading === 'pushing'}
          accentColor="indigo"
          disabled={!isInitialized}
        />
        <SyncActionCard 
          icon={<DownloadCloud size={40} />}
          title="Restore from Cloud"
          description="Fetch remote data and replace current local session entirely."
          buttonLabel="Download Remote State"
          onClick={handlePull}
          loading={loading === 'pulling'}
          accentColor="emerald"
          disabled={!isInitialized}
        />
      </div>

      {/* 3. Cloud Inspector Section */}
      <section className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="text-indigo-600 font-mono">03.</span> Cloud Inspector
          </h3>
          <button 
            onClick={handleInspect}
            disabled={!isInitialized || loading === 'inspecting'}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {loading === 'inspecting' ? 'Analyzing...' : 'Refresh Inspection'}
          </button>
        </div>
        
        <p className="text-slate-400 text-sm font-desc italic">Detailed audit of all schema objects found in the remote database. Use this to verify content versions before pulling.</p>
        
        {cloudSummary ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Project Overview */}
            <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-600 p-4 rounded-2xl text-white">
                  <Layout size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Active Cloud Project</span>
                  <p className="text-2xl font-black text-slate-900 truncate max-w-md">{cloudSummary.activeProjectName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Total Projects</span>
                <p className="text-4xl font-black text-indigo-600">{cloudSummary.projectsCount}</p>
              </div>
            </div>

            {/* Granular Schema Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <StatBlock icon={<Layers size={16} />} label="Beats" value={cloudSummary.beats} sub="L1 Structure" />
              <StatBlock icon={<FileText size={16} />} label="Scenes" value={cloudSummary.scenes} sub="L2 Narrative" />
              <StatBlock icon={<Layout size={16} />} label="Chapters" value={cloudSummary.chapters} sub="L3 Terminal" />
              <StatBlock icon={<Users size={16} />} label="Characters" value={cloudSummary.characters} sub="Bible Entries" />
              <StatBlock icon={<MapPin size={16} />} label="Locations" value={cloudSummary.locations} sub="Atlas Assets" />
              <StatBlock icon={<Target size={16} />} label="Planning" value={cloudSummary.hasPlanning ? 'Active' : 'Empty'} sub="Metadata" />
            </div>

            <div className="pt-4 flex items-center justify-end">
              <span className="text-[10px] font-bold text-slate-300 italic uppercase">Last inspected: {cloudSummary.lastSync}</span>
            </div>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
            <Eye className="text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No audit data retrieved yet</p>
          </div>
        )}
      </section>

      {/* Debug Console */}
      <div className="bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl border border-slate-800">
        <div className="bg-slate-800/50 px-8 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 text-slate-400">
            <Terminal size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Architecture Log</span>
          </div>
          <button onClick={() => setLogs([])} className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-300">Flush Log</button>
        </div>
        <div className="p-8 h-56 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed">
          {logs.length === 0 && <div className="text-slate-700 italic">Waiting for operations...</div>}
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4 mb-2">
              <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
              <span className={
                log.type === 'error' ? 'text-rose-400' : 
                log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
              }>
                {log.msg}
              </span>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
};

const StatBlock = ({ icon, label, value, sub }: any) => (
  <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col">
    <div className="flex items-center gap-2 text-slate-400 mb-3">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-2xl font-black text-slate-700 mb-1">{value}</p>
    <span className="text-[9px] text-slate-400 italic font-medium">{sub}</span>
  </div>
);

const SyncField = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
    />
  </div>
);

const SyncActionCard = ({ icon, title, description, buttonLabel, onClick, loading, accentColor, disabled }: any) => {
  const isIndigo = accentColor === 'indigo';
  return (
    <div className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-sm flex flex-col items-center text-center group transition-all hover:shadow-2xl hover:border-slate-200">
      <div className={`mb-8 p-8 rounded-[24px] ${isIndigo ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} transition-transform group-hover:scale-110 shadow-inner`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-[220px] font-desc italic">{description}</p>
      
      <button 
        onClick={onClick}
        disabled={disabled || loading}
        className={`w-full py-5 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${isIndigo ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}`}
      >
        {loading ? <RefreshCw className="animate-spin" size={16} /> : buttonLabel}
      </button>
    </div>
  );
};

export default FirebaseSync;
