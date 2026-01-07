
import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Cloud, CloudOff, RefreshCcw, Download, Upload, Terminal, 
  Info, CheckCircle2, AlertCircle, Search, Wifi, WifiOff, Loader2, 
  Eye, ShieldCheck, CheckSquare, Layers, Users, MapPin 
} from 'lucide-react';
// Fix: Use namespace import for firebase/app to resolve "no exported member" errors in some environments
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, initializeFirestore } from 'firebase/firestore';
import { StoryboardState } from './types';

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

const DataConnection: React.FC<Props> = ({ state, onUpdateState, initialConfig }) => {
  const [config, setConfig] = useState(initialConfig);
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
    addLog("System starting. Verifying local storage persistence...", "info");
    addLog("Firebase initialized with default project config.", "info");
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getSafeFirestore = () => {
    // Fix: Access getApps, initializeApp, and getApp through the firebaseApp namespace
    const app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(config) : firebaseApp.getApp();
    try {
      addLog(`Initializing Firestore client for: ${config.projectId}`, "info");
      return initializeFirestore(app, { experimentalForceLongPolling: true });
    } catch (e) {
      return getFirestore(app);
    }
  };

  const handleConnect = async () => {
    setConnectionStatus('CONNECTING');
    addLog(`Handshaking with Google Cloud [${config.projectId}]...`, "info");
    try {
      const db = getSafeFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      await getDoc(stateDoc);
      setConnectionStatus('CONNECTED');
      addLog("Handshake successful. Vault link verified.", "success");
    } catch (error: any) {
      setConnectionStatus('ERROR');
      addLog(`Handshake Failed: ${error.message}`, "error");
    }
  };

  const handlePush = async () => {
    if (connectionStatus !== 'CONNECTED') {
      alert("System must be connected to Firebase before sync.");
      return;
    }
    setSyncing('PUSHING');
    addLog("Initiating full architectural push to Cloud Vault...", "info");
    try {
      const db = getSafeFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      await setDoc(stateDoc, state);
      addLog("Push sequence complete. Remote vault updated.", "success");
      setSyncing('DONE_PUSH');
      setTimeout(() => setSyncing(null), 3000);
    } catch (error: any) {
      addLog(`Push Failure: ${error.message}`, "error");
      setSyncing(null);
    }
  };

  const handlePull = async () => {
    if (connectionStatus !== 'CONNECTED') {
      alert("System must be connected to Firebase before sync.");
      return;
    }
    setSyncing('PULLING');
    addLog("Requesting latest architectural snapshot from Cloud...", "info");
    try {
      const db = getSafeFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        onUpdateState(snap.data() as StoryboardState);
        addLog("Snapshot retrieved. Local application memory reconstructed.", "success");
        setSyncing('DONE_PULL');
        setTimeout(() => setSyncing(null), 3000);
      } else {
        addLog("Pull Failed: No existing snapshot found in this project.", "error");
        setSyncing(null);
      }
    } catch (error: any) {
      addLog(`Pull Failure: ${error.message}`, "error");
      setSyncing(null);
    }
  };

  const fetchSummary = async () => {
    setShowSummary(false);
    addLog("Scanning Cloud Vault for data summary...", "info");
    try {
      const db = getSafeFirestore();
      const stateDoc = doc(db, "data", "storyboard_state");
      const snap = await getDoc(stateDoc);
      if (snap.exists()) {
        const data = snap.data() as StoryboardState;
        
        // Deep scan for summary stats
        let totalCards = 0;
        let totalChars = 0;
        let totalLocs = 0;
        
        Object.values(data.projects || {}).forEach((p: any) => {
          totalCards += Object.keys(p.cards || {}).length;
          totalChars += Object.keys(p.characters || {}).length;
          totalLocs += Object.keys(p.locations || {}).length;
        });

        setCloudSummary({
          projects: Object.keys(data.projects || {}).length,
          users: Object.keys(data.users || {}).length,
          cards: totalCards,
          characters: totalChars,
          locations: totalLocs,
          active: data.projects[data.activeProjectId]?.name || "N/A"
        });
        setShowSummary(true);
        addLog("Vault scan complete. Summary populated.", "success");
      }
    } catch (e: any) {
      addLog(`Scan Error: ${e.message}`, "error");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Firestore Database Sync</h1>
        <p className="text-slate-500 font-medium max-w-3xl">
          Manually sync your local application data with a Google Cloud Firestore database. This allows you to share data across different browsers or save your work permanently to the cloud.
        </p>
      </div>

      {/* 1. Firebase Configuration */}
      <section className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-sm space-y-8 relative">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-indigo-600">1. Firebase Configuration</h2>
          {connectionStatus === 'CONNECTED' && (
            <div className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl flex items-center gap-2 border border-emerald-100 animate-in zoom-in-95">
              <ShieldCheck size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Firestore Connection Verified & Stable</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-slate-400 font-medium">The default configuration is pre-filled. You can override it if you need to connect to a different project.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
          <ConfigField label="API KEY" value={config.apiKey} onChange={v => setConfig({...config, apiKey: v})} />
          <ConfigField label="AUTH DOMAIN" value={config.authDomain} onChange={v => setConfig({...config, authDomain: v})} />
          <ConfigField label="PROJECT ID" value={config.projectId} onChange={v => setConfig({...config, projectId: v})} />
          <ConfigField label="STORAGE BUCKET" value={config.storageBucket} onChange={v => setConfig({...config, storageBucket: v})} />
          <ConfigField label="MESSAGING SENDER ID" value={config.messagingSenderId} onChange={v => setConfig({...config, messagingSenderId: v})} />
          <ConfigField label="APP ID" value={config.appId} onChange={v => setConfig({...config, appId: v})} />
        </div>

        <button 
          onClick={handleConnect}
          disabled={connectionStatus === 'CONNECTING'}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {connectionStatus === 'CONNECTING' ? <Loader2 className="animate-spin" size={20} /> : <Wifi size={20} />}
          {connectionStatus === 'CONNECTING' ? 'Establishing Vault Link...' : connectionStatus === 'CONNECTED' ? 'Reconnect to Firebase' : 'Connect to Firebase'}
        </button>
      </section>

      {/* 2. Data Synchronization */}
      <section className="space-y-8">
        <h2 className="text-2xl font-black text-indigo-600 px-4">2. Data Synchronization</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SyncCard 
            title="Push to Cloud" 
            icon={<Upload size={32} />} 
            desc="Take all data currently in this browser (Students, Courses, Progress) and overwrite the database in Firestore."
            btnLabel={syncing === 'PUSHING' ? 'Uploading...' : syncing === 'DONE_PUSH' ? 'Success: Pushed' : 'Upload Data to Firestore'}
            onClick={handlePush}
            status={syncing === 'PUSHING' ? 'LOADING' : syncing === 'DONE_PUSH' ? 'SUCCESS' : 'IDLE'}
            disabled={connectionStatus !== 'CONNECTED'}
            accent="indigo"
          />
          <SyncCard 
            title="Pull from Cloud" 
            icon={<Download size={32} />} 
            desc="Fetch the latest data from Firestore and replace the data in this browser. Good for syncing multiple devices."
            btnLabel={syncing === 'PULLING' ? 'Downloading...' : syncing === 'DONE_PULL' ? 'Success: Pulled' : 'Download Data from Firestore'}
            onClick={handlePull}
            status={syncing === 'PULLING' ? 'LOADING' : syncing === 'DONE_PULL' ? 'SUCCESS' : 'IDLE'}
            disabled={connectionStatus !== 'CONNECTED'}
            accent="emerald"
          />
        </div>
      </section>

      {/* 3. Cloud Inspector */}
      <section className="bg-white border-2 border-slate-100 rounded-[32px] p-10 shadow-sm space-y-6">
        <h2 className="text-2xl font-black text-indigo-400 flex items-center gap-3">
          <Eye size={24} /> 3. Cloud Inspector
        </h2>
        <p className="text-sm text-slate-400 font-medium">View the summary of data currently stored in the cloud without modifying your local application. Use this to check what version of the data is online before pulling.</p>
        
        {showSummary && cloudSummary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-8 bg-slate-50 rounded-[28px] border border-slate-100 animate-in zoom-in-95 duration-300">
            <SummaryStat label="Total Projects" value={cloudSummary.projects} />
            <SummaryStat label="Cast Members" value={cloudSummary.characters} />
            <SummaryStat label="World Locations" value={cloudSummary.locations} />
            <SummaryStat label="Narrative Units" value={cloudSummary.cards} />
            <SummaryStat label="Authorized Users" value={cloudSummary.users} />
          </div>
        )}

        <button 
          onClick={fetchSummary}
          className="px-10 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
        >
          View Cloud Data Summary
        </button>
      </section>

      {/* Debug Console */}
      <section className="bg-[#0f172a] rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-80">
        <div className="bg-[#1e293b] px-8 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 font-black text-xs tracking-widest">_ DEBUG CONSOLE</span>
          </div>
          <button onClick={() => setLogs([])} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Clear</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 font-mono text-[12px] space-y-2 custom-scrollbar">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-slate-600 shrink-0">[{log.time}]</span>
              <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
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

const ConfigField = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400 transition-all"
    />
  </div>
);

const SyncCard = ({ title, icon, desc, btnLabel, onClick, status, disabled, accent }: any) => {
  const isIndigo = accent === 'indigo';
  const isSuccess = status === 'SUCCESS';
  const isLoading = status === 'LOADING';

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm flex flex-col items-center text-center space-y-6 group hover:border-indigo-100 transition-all">
      <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center transition-all ${isIndigo ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white'}`}>
        {icon}
      </div>
      <div className="space-y-3">
        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h4>
        <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[280px]">{desc}</p>
      </div>
      <button 
        onClick={onClick} 
        disabled={disabled || isLoading || isSuccess}
        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 ${
          isSuccess ? 'bg-emerald-600 text-white' : 
          isLoading ? 'bg-slate-100 text-slate-400' : 
          disabled ? 'bg-slate-50 text-slate-200' : 
          isIndigo ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        {isLoading && <Loader2 className="animate-spin" size={16} />}
        {isSuccess && <CheckCircle2 size={16} />}
        {btnLabel}
      </button>
    </div>
  );
};

const SummaryStat = ({ label, value }: { label: string; value: any }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
    <p className="text-lg font-black text-slate-900">{value}</p>
  </div>
);

export default DataConnection;
