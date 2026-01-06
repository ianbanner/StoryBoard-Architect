
import React, { useState, useMemo, useEffect } from 'react';
import { FileDown, FileText, Layout, Info, Layers, CheckCircle2, Loader2, Settings2, CheckSquare, Square, FileStack, Printer, Save, ChevronDown, ListChecks, AlertCircle, Sparkles, Wand2, Edit3, Monitor, FileType, Plus, Footprints, Download, FileJson, Anchor } from 'lucide-react';
import { Project, CardType, StoryCard, AIScript, BeatType } from './types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  project: Project;
}

type ExportMode = 'MAN' | 'FULL' | 'SELECTED';
type OutputFormat = 'PRINT' | 'PDF';

const ExportHub: React.FC<Props> = ({ project }) => {
  const [exportMode, setExportMode] = useState<ExportMode>('MAN');
  const [version, setVersion] = useState('01');
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [isPublishing, setIsPublishing] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('PDF');
  const [includePlotMeta, setIncludePlotMeta] = useState(true);
  const [includeWorldMeta, setIncludeWorldMeta] = useState(true);
  const [includeDraft, setIncludeDraft] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [enableAIPostProcess, setEnableAIPostProcess] = useState(false);
  const [scriptOverride, setScriptOverride] = useState('');

  const orderedUnits = useMemo(() => {
    const list: StoryCard[] = [];
    const walk = (cardId: string) => {
      const card = project.cards[cardId];
      if (!card) return;
      // We export both Scenes (as separators) and Chapters
      list.push(card);
      if (card.children && card.children.length > 0) {
        card.children.forEach(walk);
      }
    };
    (project.sceneOrder || []).forEach(walk);
    return list;
  }, [project.cards, project.sceneOrder]);

  const orderedChapters = useMemo(() => {
    return orderedUnits.filter(u => u.type === CardType.CHAPTER);
  }, [orderedUnits]);

  useEffect(() => {
    if (enableAIPostProcess) {
      const formattingScript = (Object.values(project.aiScripts || {}) as AIScript[]).find(s => s.title === "Formatting Output");
      if (formattingScript && !scriptOverride) {
        setScriptOverride(formattingScript.content);
      }
    }
  }, [enableAIPostProcess, project.aiScripts]);

  useEffect(() => {
    if (selectedChapterIds.size === 0 && orderedChapters.length > 0) {
      setSelectedChapterIds(new Set(orderedChapters.map(c => c.id)));
    }
  }, [orderedChapters]);

  const toggleChapter = (id: string) => {
    const next = new Set(selectedChapterIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapterIds(next);
  };

  const killerTitle = project.planning.logline.killerTitle || project.name || "Untitled Project";
  const fileName = `v${version}_${killerTitle.replace(/\s+/g, '_')}_${exportMode}`;

  const stats = useMemo(() => {
    const selectedList = orderedChapters.filter(c => selectedChapterIds.has(c.id));
    const totalWords = selectedList.reduce((acc, c) => {
      const words = (c.draftContent || '').split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
    return { count: selectedList.length, words: totalWords };
  }, [orderedChapters, selectedChapterIds]);

  const handlePublish = async () => {
    const selectedChapters = orderedChapters.filter(c => selectedChapterIds.has(c.id));
    setIsPublishing(true);
    try {
      let finalHtmlBody = '';
      if (enableAIPostProcess) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const rawContent = selectedChapters.map(c => ({
          title: c.chapterTitle || c.title,
          description: c.description,
          content: c.draftContent || '',
          metadata: { conflict: c.conflict, beats: (c.associatedBeats || []) }
        }));
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Apply this AI Formatting Script: ${scriptOverride}. Project Data: ${JSON.stringify(rawContent)}`,
        });
        finalHtmlBody = response.text || '<p>Error generating AI content.</p>';
      } else {
        selectedChapters.forEach((c) => {
          finalHtmlBody += `<div class="chapter"><div class="chapter-title">${c.chapterTitle || c.title}</div>`;
          const showPlot = exportMode === 'FULL' || (exportMode === 'SELECTED' && includePlotMeta);
          if (showPlot) {
            finalHtmlBody += `<div class="meta-box">`;
            if (c.associatedBeats && c.associatedBeats.length > 0) finalHtmlBody += `<div><span class="meta-label">Beat:</span> ${c.associatedBeats.join(', ')}</div>`;
            finalHtmlBody += `<div><span class="meta-label">Blueprint:</span> ${c.description || 'N/A'}</div></div>`;
          }
          finalHtmlBody += `<div class="draft-content">${c.draftContent || '<i>(Draft pending...)</i>'}</div></div>`;
        });
      }
      const titlePageHtml = `<div class="title-page"><div class="title-main">${killerTitle}</div><div class="title-meta">Version ${version} • ${new Date().toLocaleDateString()}</div></div>`;
      const fullHtml = `<html><head><style>body { font-family: 'Georgia', serif; line-height: 1.8; max-width: 800px; margin: 40px auto; } .title-page { height: 100vh; text-align: center; display: flex; flex-direction: column; justify-content: center; } .title-main { font-size: 64px; font-weight: 900; } .chapter { page-break-before: always; } .chapter-title { font-size: 28px; border-bottom: 2px solid #000; margin-bottom: 24px; } .meta-box { background: #f9fafb; padding: 16px; margin-bottom: 24px; font-size: 12px; } .draft-content { font-size: 18px; white-space: pre-wrap; }</style></head><body>${titlePageHtml}${finalHtmlBody}</body></html>`;
      const printWindow = window.open('', '_blank');
      if (printWindow) { printWindow.document.write(fullHtml); printWindow.document.close(); setTimeout(() => printWindow.print(), 500); }
    } catch (err) { console.error(err); } finally { setIsPublishing(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-teal-600"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-100"><FileDown size={40} /></div>
            <div className="space-y-1"><h2 className="text-4xl font-black text-slate-900 tracking-tight">{killerTitle}</h2><p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Draft Sequential Assembly</p></div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-1">Draft v{version}</label>
            <input 
              type="text" 
              value={version} 
              onChange={e => {
                const val = e.target.value || '';
                setVersion(val.replace(/\D/g, '').slice(0, 2));
              }} 
              className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2 text-center text-lg font-black text-indigo-600" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-8">
            <div className="flex flex-col gap-2"><ModeButton active={exportMode === 'MAN'} onClick={() => setExportMode('MAN')} label="Manuscript (MAN)" desc="Double-spaced industry flow." /><ModeButton active={exportMode === 'FULL'} onClick={() => setExportMode('FULL')} label="Structural Hub (FULL)" desc="Includes architectural metadata." /></div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-8 max-h-[520px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-3">
                {orderedChapters.map((c, idx) => (
                  <div key={c.id} onClick={() => toggleChapter(c.id)} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedChapterIds.has(c.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-4"><div className={selectedChapterIds.has(c.id) ? 'text-indigo-600' : 'text-slate-300'}>{selectedChapterIds.has(c.id) ? <CheckSquare size={20} /> : <Square size={20} />}</div><span className="text-sm font-black text-slate-800">{c.chapterTitle || c.title}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button onClick={handlePublish} disabled={selectedChapterIds.size === 0 || isPublishing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3">
          {isPublishing ? <Loader2 className="animate-spin" /> : <Download size={18} />} Assemble Narrative Sequence
        </button>
      </div>
    </div>
  );
};

const ModeButton = ({ active, onClick, label, desc }: any) => (
  <button onClick={onClick} className={`p-5 rounded-[24px] border-2 text-left transition-all ${active ? 'bg-indigo-50 border-indigo-600 shadow-sm' : 'bg-white border-slate-100'}`}><div className={`text-xs font-black uppercase tracking-tight ${active ? 'text-indigo-700' : 'text-slate-900'}`}>{label}</div><div className="text-[10px] text-slate-400 font-medium mt-1">{desc}</div></button>
);

const ToggleItem = ({ active, onClick, label, color }: any) => (
  <button onClick={onClick} className="flex items-center justify-between w-full"><span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span><div className={`w-10 h-6 rounded-full p-1 transition-all ${active ? (color || 'bg-indigo-600') : 'bg-slate-200'}`}><div className={`w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-4' : 'translate-x-0'}`} /></div></button>
);

export default ExportHub;
