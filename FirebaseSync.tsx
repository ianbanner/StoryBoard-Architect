
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, initializeFirestore } from 'firebase/firestore';
import { 
  Cloud, UploadCloud, DownloadCloud, Database, RefreshCw, Terminal, Eye, 
  CheckCircle, AlertTriangle, FileText, Users, MapPin, Layers, Layout, 
  Target, Info, ChevronRight, X, Clock, ShieldAlert, Zap, ArrowRightLeft, GitBranch, History
} from 'lucide-react';
import { StoryboardState, CardType, Project } from './types';

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
  const [logs, setLogs] = useState<{ time: string; msg: string; type?: 'info' | 'error' | 'success' | 'warn' }[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [cloudSummary, setCloudSummary] = useState<any>(null);
  const [fullCloudState, setFullCloudState] = useState<StoryboardState | null>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [versionLabel, setVersionLabel] = useState("Manual Snapshot");
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const getSafeFirestore = () => {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    try {
      return initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false });
    } catch (e) {
      return getFirestore(app);
    }
  };

  const drift = useMemo(() => {
    if (!fullCloudState) return null;
    const localProj = state.projects[state.activeProjectId];
    const cloudProj = fullCloudState.projects[fullCloudState.activeProjectId];
    if (!localProj || !cloudProj) return null;
    return {
      cards: Object.keys(localProj.cards).length - Object.keys(cloudProj.cards).length,
      chars: Object.keys(localProj.characters).length - Object.keys(cloudProj.characters).length,
      locs: Object.keys(localProj.locations).length - Object.keys(cloudProj.locations).length,
      isDrifting: JSON.stringify(localProj) !== JSON.stringify(cloudProj)
    };
  }, [state, fullCloudState]);

  useEffect(() => { handleConnect(); }, []);

  const handleConnect = async () => {
    try {
      setLoading('connecting');
      addLog(`Connecting to Vault...`);
      const db = getSafeFirestore();
      
      // Fetch Latest Master
      const masterSnap = await getDoc(doc(db, "data", "storyboard_state"));
      if (masterSnap.exists()) {
        setFullCloudState(masterSnap.data() as StoryboardState);
        addLog("Master Vault located.", 'success');
      }

      // Fetch Version Branches
      const vQuery = query(collection(db, "versions"), orderBy("timestamp", "desc"), limit(10));
      const vSnap = await getDocs(vQuery);
      const history = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVersionHistory(history);
      
      setIsInitialized(true);
      addLog(`Found ${history.length} historical branches.`, 'info');
    } catch (error: any) {
      addLog(`Connection Error: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleBranchSave = async () => {
    if (!isInitialized) return;
    try {
      setLoading('pushing');
      const db = getSafeFirestore();
      const timestamp = Date.now();
      const branchId = `branch_${timestamp}`;

      addLog(`Creating branch: ${versionLabel}...`);
      
      // 1. Save to the historical versions collection (The Branch)
      await setDoc(doc(db, "versions", branchId), {
        ...state,
        branchName: versionLabel,
        timestamp: timestamp,
        activeProjectName: state.projects[state.activeProjectId].name
      });

      // 2. Also update the Master document (The current "Live" version)
      await setDoc(doc(db, "data", "storyboard_state"), state);

      addLog("Branch secured and Master updated.", 'success');
      handleConnect(); // Refresh list
    } catch (error: any) {
      addLog(`Branching failed: ${error.message}`, 'error');
    } finally {
      setLoading(null);
    }
  };

  const restoreVersion = (versionData: any) => {
    if (!confirm(`Restore to "${versionData.branchName}"? Current unsaved work will be lost.`)) return;
    onUpdateState(versionData as StoryboardState);
    addLog(`Restored to version from ${new Date(versionData.timestamp).toLocaleString()}`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <GitBranch className="text-indigo-600" size={40} />
            Branching Controller
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 ml-1">Manage Narrative Timelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Branch Creator */}
          <section className="bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <UploadCloud size={20} className="text-indigo-500" />
              Create New Branch
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Version Label</label>
                <input 
                  type="text" 
                  value={versionLabel} 
                  onChange={e => setVersionLabel(e.target.value)}
                  placeholder="e.g. Draft 2: The New Character"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <button 
                onClick={handleBranchSave}
                disabled={loading === 'pushing'}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3"
              >
                {loading === 'pushing' ? <RefreshCw className="animate-spin" /> : <GitBranch size={18} />}
                Save Snapshot to Cloud Vault
              </button>
            </div>
          </section>

          {/* Version History List */}
          <section className="bg-white border-2 border-slate-100 rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <History size={20} className="text-emerald-500" />
                    Timeline History
                </h3>
                <button onClick={handleConnect} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><RefreshCw size={16} /></button>
            </div>
            
            <div className="space-y-3">
                {versionHistory.map((version) => (
                    <div key={version.id} className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">{version.branchName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(version.timestamp).toLocaleString()} • {version.activeProjectName}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => restoreVersion(version)}
                            className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Restore
                        </button>
                    </div>
                ))}
                {versionHistory.length === 0 && (
                    <div className="py-12 text-center opacity-30 italic font-desc">No cloud branches found yet.</div>
                )}
            </div>
          </section>
        </div>

        {/* Console Log */}
        <div className="bg-slate-50 rounded-[32px] flex flex-col h-full shadow-lg overflow-hidden border-2 border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-indigo-600">
                <Terminal size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Vault Logs</span>
            </div>
            <div className="p-6 font-mono text-[10px] space-y-2 flex-1 overflow-y-auto custom-scrollbar bg-white/50">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-slate-400">[{log.time}]</span>
                        <span className={log.type === 'error' ? 'text-rose-600' : log.type === 'success' ? 'text-emerald-600' : 'text-slate-600'}>
                            {log.msg}
                        </span>
                    </div>
                ))}
                <div ref={consoleEndRef} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSync;
