import React, { useState, useRef, useMemo } from 'react';
import { 
  FileDown, FileUp, Database, ShieldAlert, CheckCircle2, 
  Loader2, Download, Upload, AlertTriangle, FileJson, 
  Trash2, Layers, Users, MapPin, Target, Layout, ShieldCheck, 
  X, Info, Clock, Save, History, Binary
} from 'lucide-react';
import { StoryboardState, Project, StoryCard } from './types';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
  userEmail: string;
}

const ExportImportAdmin: React.FC<Props> = ({ state, onUpdateState, userEmail }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<StoryboardState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats for the "Current State" summary
  const stats = useMemo(() => {
    // Fix: Explicitly cast Object.values to Project[] to avoid 'unknown' errors
    const projects = Object.values(state.projects || {}) as Project[];
    let totalCards = 0;
    let totalDraftWords = 0;
    
    projects.forEach(p => {
      // Fix: Explicitly cast Object.values to StoryCard[] to avoid 'unknown' errors
      const cards = Object.values(p.cards || {}) as StoryCard[];
      totalCards += cards.length;
      cards.forEach(c => {
        totalDraftWords += (c.draftContent || '').split(/\s+/).filter(Boolean).length;
      });
    });

    return {
      projectCount: projects.length,
      userCount: Object.keys(state.users || {}).length,
      cardCount: totalCards,
      wordCount: totalDraftWords,
      timestamp: new Date().toLocaleString()
    };
  }, [state]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Serialize state to JSON
      const jsonString = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      // Sanitize email for filename usage
      const safeEmail = userEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.href = url;
      link.download = `${safeEmail}_storyboard_master_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to generate backup file.");
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as StoryboardState;

        // Basic validation
        if (!importedData.projects || !importedData.projectOrder || !importedData.activeProjectId) {
          throw new Error("Invalid structure: The selected file is not a valid Storyboard backup.");
        }

        setPendingImportData(importedData);
        setShowImportConfirmation(true);
      } catch (error: any) {
        alert(`Import Error: ${error.message}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      alert("Failed to read the selected file.");
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (pendingImportData) {
      onUpdateState(pendingImportData);
      setShowImportConfirmation(false);
      setPendingImportData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert("System Overwrite Successful: Application state has been restored.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Export & <span className="text-indigo-600">Import</span></h1>
        <p className="text-slate-500 font-medium max-w-2xl text-lg font-desc italic">
          Manage full-system portability. Create encrypted master backups of your entire narrative architecture or restore from a previous snapshot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Export Column */}
        <section className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm flex flex-col space-y-8 relative overflow-hidden group hover:border-indigo-100 transition-all">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center shadow-xl shadow-emerald-100 transition-transform group-hover:scale-110">
              <FileDown size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Master Export</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 ml-1">Serialize Current State</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-6">
             <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest px-1">
               <History size={14} /> System Snapshot Summary
             </div>
             
             <div className="grid grid-cols-2 gap-y-6 gap-x-4">
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Story Projects</span>
                 <p className="text-2xl font-black text-slate-800">{stats.projectCount}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Authorized Users</span>
                 <p className="text-2xl font-black text-slate-800">{stats.userCount}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Narrative Assets</span>
                 <p className="text-2xl font-black text-slate-800">{stats.cardCount}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Draft Word Count</span>
                 <p className="text-2xl font-black text-slate-800">{stats.wordCount.toLocaleString()}</p>
               </div>
             </div>
          </div>

          <p className="text-xs text-slate-500 font-desc leading-relaxed italic px-2">
            This will generate a JSON file containing all storyboards, characters, locations, planning logs, and drafting content. This file can be saved to your local hard drive for permanent archival.
          </p>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            {isExporting ? 'Packaging Vault...' : 'Generate Master Backup'}
          </button>
        </section>

        {/* Import Column */}
        <section className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-sm flex flex-col space-y-8 relative overflow-hidden group hover:border-rose-100 transition-all">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[22px] flex items-center justify-center shadow-xl shadow-rose-100 transition-transform group-hover:scale-110">
              <FileUp size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Master Import</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 ml-1">Restore Global State</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-100 rounded-[32px] text-center space-y-4 group-hover:border-rose-200 transition-all">
             <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
               <FileJson size={32} />
             </div>
             <div className="space-y-1">
               <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Drop Backup File Here</p>
               <p className="text-xs text-slate-400 font-desc italic">Only .json files from Storyboard Architect are supported.</p>
             </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px] flex items-start gap-4">
            <ShieldAlert className="text-rose-600 shrink-0" size={24} />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-rose-900 tracking-widest">Warning: Permanent Overwrite</h4>
              <p className="text-[11px] text-rose-700 font-desc leading-relaxed italic opacity-80">
                Importing a master file will completely replace all current projects, users, and narrative data. Ensure you have backed up your current session before proceeding.
              </p>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".json" 
            className="hidden" 
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-rose-600 shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            {isImporting ? 'Reading File...' : 'Select Backup File'}
          </button>
        </section>

      </div>

      {/* Confirmation Modal */}
      {showImportConfirmation && pendingImportData && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setShowImportConfirmation(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <header className="p-10 border-b flex items-center gap-6 bg-rose-50">
               <div className="w-16 h-16 bg-rose-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-rose-200">
                 <ShieldAlert size={32} />
               </div>
               <div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Confirm <span className="text-rose-600">Overwrite</span></h3>
                 <p className="text-rose-400 font-bold uppercase text-[9px] tracking-[0.3em]">System Level Authorization Required</p>
               </div>
            </header>

            <div className="p-12 space-y-8">
               <p className="text-lg text-slate-600 font-desc italic leading-relaxed">
                 You are about to restore the system state from a backup file. This action will permanently delete all current narrative units, character bibles, and project settings.
               </p>

               <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-6">
                 <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-3">Restoration Preview</h4>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restoring Projects</span>
                      <p className="text-xl font-black text-slate-800">{pendingImportData.projectOrder.length}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restoring Users</span>
                      <p className="text-xl font-black text-slate-800">{Object.keys(pendingImportData.users || {}).length}</p>
                    </div>
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setShowImportConfirmation(false)} 
                  className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-500 hover:bg-slate-50 transition-all border-2 border-slate-100"
                 >
                   Cancel Import
                 </button>
                 <button 
                  onClick={confirmImport}
                  className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all active:scale-95"
                 >
                   Confirm & Overwrite
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportImportAdmin;