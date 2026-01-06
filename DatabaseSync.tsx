
import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Cloud, RefreshCcw, Download, Upload, Terminal, 
  Info, CheckCircle2, AlertCircle, Search, Wifi, WifiOff, Loader2, 
  Eye, ShieldCheck, CheckSquare, Layers, Users, MapPin, X
} from 'lucide-react';
import { db } from './App';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StoryboardState } from './types';
import { sanitizeForFirestore } from './DataExplorer';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
  initialConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

const DatabaseSync: React.FC<Props> = ({ state, onUpdateState, initialConfig }) => {
  const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [logs, setLogs] = useState<{ time: string; msg: string; type: 'info' | 'error' | 'success' }[]>([]);
  const [syncing, setSyncing] = useState<'PUSHING' | 'PULLING' | 'DONE_PUSH' | 'DONE_PULL' | null>(null);
  const [cloudSummary, setCloudSummary] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  useEffect(() => {
    addLog("Cloud Orchestrator initialized. Monitoring vault connectivity...", "info");
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleConnect = async () => {
    setConnectionStatus('CONNECTING');
    addLog(`Initiating handshake with Cloud Project...`, "info");
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      await getDoc(stateDoc);
      setConnectionStatus('CONNECTED');
      addLog("Handshake successful. Secure link established with Cloud Vault.", "success");
    } catch (error: any) {
      setConnectionStatus('ERROR');
      addLog(`Connectivity Error: ${error.message}`, "error");
    }
  };

  const handlePush = async () => {
    if (connectionStatus !== 'CONNECTED') {
      alert("System must be connected to Firebase before sync.");
      return;
    }
    setSyncing('PUSHING');
    addLog("Starting architectural push. Syncing local memory to cloud...", "info");
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      // Applying sanitization to manual push
      const cleanState = sanitizeForFirestore(state);
      await setDoc(stateDoc, cleanState);
      addLog("Structural Push Sequence Complete. Vault updated successfully.", "success");
      setSyncing('DONE_PUSH');
      setTimeout(() => setSyncing(null), 3000);
    } catch (error: any) {
      addLog(`Push Interrupted: ${error.message}`, "error");
      setSyncing(null);
    }
  };

  const handlePull = async () => {
    if (connectionStatus !== 'CONNECTED') {
      alert("System must be connected to Firebase before sync.");
      return;
    }
    setSyncing('PULLING');
    addLog("Requesting master snapshot from Cloud Vault...", "info");
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        onUpdateState(snap.data() as StoryboardState);
        addLog("Snapshot retrieved. Application state reconstructed.", "success");
        setSyncing('DONE_PULL');
        setTimeout(() => setSyncing(null), 3000);
      } else {
        addLog("Pull Failed: Remote vault appears to be uninitialized.", "error");
        setSyncing(null);
      }
    } catch (error: any) {
      addLog(`Pull Interrupted: ${error.message}`, "error");
      setSyncing(null);
    }
  };

  const fetchSummary = async () => {
    setShowSummary(false);
    addLog("Scanning Cloud Vault for structural integrity...", "info");
    try {
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        const data = snap.data() as StoryboardState;
        
        let totalCards = 0;
        let totalChars = 0;
        let totalLocs = 0;
        
        Object.values(data.projects || {}).forEach((p: any) => {
          if (p && p.cards) totalCards += Object.keys(p.cards || {}).length;
          if (p && p.characters) totalChars += Object.keys(p.characters || {}).length;
          if (p && p.locations) totalLocs += Object.keys(p.locations || {}).length;
        });

        setCloudSummary({
          projects: Object.keys(data.projects || {}).length,
          users: Object.keys(data.users || {}).length,
          cards: totalCards,
          characters: totalChars,
          locations: totalLocs
        });
        setShowSummary(true);
        addLog("Audit complete. Cloud metrics retrieved.", "success");
      }
    } catch (e: any) {
      addLog(`Audit Error: ${e.message}`, "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Firestore Database Sync</h1>
        <p className="text-slate-500 font-medium max-w-2xl text-lg font-desc italic">
          Manually synchronize your architectural narrative memory with the Google Cloud Vault. Ensure consistency across devices or secure a permanent backup of your story world.
        </p>
      </div>

      {/* 1. Firebase Configuration (Simplified Display) */}
      <section className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-indigo-600 tracking-tight">1. Database Handshake</h2>
          {connectionStatus === 'CONNECTED' && (
            <div className="bg-emerald-50 text-emerald-600 px-6 py-2.5 rounded-full flex items-center gap-3 border border-emerald-100 animate-in zoom-in-95">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Connection Active & Secure</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest opacity-60">System is using pre-configured Firebase project settings.</p>

        <button 
          onClick={handleConnect}
          disabled={connectionStatus === 'CONNECTING'}
          className="w-full py-6 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {connectionStatus === 'CONNECTING' ? <Loader2 className="animate-spin" size={20} /> : <Wifi size={20} />}
          {connectionStatus === 'CONNECTING' ? 'Establishing Secure Link...' : connectionStatus === 'CONNECTED' ? 'Reconnect to Database' : 'Connect to Firebase Vault'}
        </button>
      </section>

      {/* 2. Data Synchronization */}
      <section className="space-y-8">
        <h2 className="text-3xl font-black text-indigo-600 px-6">2. Data Synchronization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <SyncCard 
            title="Push to Cloud" 
            icon={<Upload size={40} />} 
            desc="Overwrite the Cloud Vault with your current browser session. Best for saving progress."
            btnLabel={syncing === 'PUSHING' ? 'Syncing...' : syncing === 'DONE_PUSH' ? 'Structural Push Success' : 'Upload Data to Firestore'}
            onClick={handlePush}
            status={syncing === 'PUSHING' ? 'LOADING' : syncing === 'DONE_PUSH' ? 'SUCCESS' : 'IDLE'}
            disabled={connectionStatus !== 'CONNECTED'}
            accent="indigo"
          />
          <SyncCard 
            title="Pull from Cloud" 
            icon={<Download size={40} />} 
            desc="Reconstruct local memory from the latest Cloud Snapshot. Note: This will replace current session work."
            btnLabel={syncing === 'PULLING' ? 'Syncing...' : syncing === 'DONE_PULL' ? 'Snapshot Pull Success' : 'Download Data from Firestore'}
            onClick={handlePull}
            status={syncing === 'PULLING' ? 'LOADING' : syncing === 'DONE_PULL' ? 'SUCCESS' : 'IDLE'}
            disabled={connectionStatus !== 'CONNECTED'}
            accent="emerald"
          />
        </div>
      </section>

      {/* 3. Cloud Inspector */}
      <section className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-300"></div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center">
             <Eye size={28} />
          </div>
          <h2 className="text-3xl font-black text-indigo-400 tracking-tight">3. Cloud Inspector</h2>
        </div>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest opacity-60">Audit your remote storage without modifying local drafts.</p>
        
        {showSummary && cloudSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 p-10 bg-slate-50/50 rounded-[32px] border border-slate-100 animate-in zoom-in-95 duration-500">
            <SummaryStat label="Projects" value={cloudSummary.projects} icon={<Layers size={14}/>} />
            <SummaryStat label="Cast Members" value={cloudSummary.characters} icon={<Users size={14}/>} />
            <SummaryStat label="World Settings" value={cloudSummary.locations} icon={<MapPin size={14}/>} />
            <SummaryStat label="Story Units" value={cloudSummary.cards} icon={<Database size={14}/>} />
            <SummaryStat label="Total Users" value={cloudSummary.users} icon={<ShieldCheck size={14}/>} />
          </div>
        )}

        <button 
          onClick={fetchSummary}
          className="px-10 py-5 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"
        >
          Initiate Vault Audit
        </button>
      </section>

      {/* Debug Console */}
      <section className="bg-[#0f172a] rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[400px] border border-slate-800">
        <div className="bg-[#1e293b] px-10 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500 font-black text-[10px] tracking-[0.2em] uppercase">Structural Debug Console</span>
          </div>
          <button onClick={() => setLogs([])} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Clear Logs</button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 font-mono text-[12px] space-y-1.5 custom-scrollbar bg-black/30">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-6 animate-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0 font-bold">[{log.time}]</span>
              <span className={`leading-relaxed ${log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {log.msg}
              </span>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </section>
    </div>
  );
};

const SyncCard = ({ title, icon, desc, btnLabel, onClick, status, disabled, accent }: any) => {
  const isIndigo = accent === 'indigo';
  const isSuccess = status === 'SUCCESS';
  const isLoading = status === 'LOADING';

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[48px] p-12 shadow-sm flex flex-col items-center text-center space-y-8 group hover:border-indigo-200 transition-all">
      <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center transition-all ${isIndigo ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white'}`}>
        {icon}
      </div>
      <div className="space-y-4">
        <h4 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed max-w-[280px] opacity-60">{desc}</p>
      </div>
      <button 
        onClick={onClick}
        disabled={disabled || isLoading || isSuccess}
        className={`w-full py-6 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-4 ${
          isSuccess ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200' : 
          isLoading ? 'bg-slate-100 text-slate-400' : 
          disabled ? 'bg-slate-50 text-slate-200' : 
          isIndigo ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-lg shadow-emerald-50'
        }`}
      >
        {isLoading && <Loader2 className="animate-spin" size={18} />}
        {isSuccess && <CheckCircle2 size={18} />}
        {btnLabel}
      </button>
    </div>
  );
};

const SummaryStat = ({ label, value, icon }: { label: string; value: any; icon: any }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-indigo-400">
      {icon}
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-3xl font-black text-slate-900">{value}</p>
  </div>
);

export default DatabaseSync;
