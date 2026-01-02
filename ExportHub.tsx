
import React, { useState, useMemo, useEffect } from 'react';
import { FileDown, FileText, Layout, Info, Layers, CheckCircle2, Loader2, Settings2, CheckSquare, Square, FileStack, Printer, Save, ChevronDown, ListChecks, AlertCircle, Sparkles, Wand2, Edit3, Monitor, FileType, Plus, Footprints, Download, FileJson } from 'lucide-react';
import { Project, CardType, StoryCard, AIScript } from './types';
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
  
  // Selected mode options
  const [includePlotMeta, setIncludePlotMeta] = useState(true);
  const [includeWorldMeta, setIncludeWorldMeta] = useState(true);
  const [includeDraft, setIncludeDraft] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [enableAIPostProcess, setEnableAIPostProcess] = useState(false);
  const [scriptOverride, setScriptOverride] = useState('');

  const chapters = useMemo(() => {
    const list = (Object.values(project.cards) as StoryCard[]).filter(c => c.type === CardType.CHAPTER);
    return list.sort((a, b) => {
        return a.title.localeCompare(b.title);
    });
  }, [project.cards]);

  // Sync script override when toggle is enabled or project changes
  useEffect(() => {
    if (enableAIPostProcess) {
      const formattingScript = (Object.values(project.aiScripts || {}) as AIScript[]).find(s => s.title === "Formatting Output");
      if (formattingScript && !scriptOverride) {
        setScriptOverride(formattingScript.content);
      }
    }
  }, [enableAIPostProcess, project.aiScripts]);

  // Initialize selections if empty
  useMemo(() => {
    if (selectedChapterIds.size === 0 && chapters.length > 0) {
      setSelectedChapterIds(new Set(chapters.map(c => c.id)));
    }
  }, [chapters]);

  const toggleChapter = (id: string) => {
    const next = new Set(selectedChapterIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapterIds(next);
  };

  const incrementVersion = () => {
    const v = parseInt(version, 10);
    if (isNaN(v)) setVersion('01');
    else setVersion((v + 1).toString().padStart(2, '0'));
  };

  const selectAll = () => setSelectedChapterIds(new Set(chapters.map(c => c.id)));
  const selectNone = () => setSelectedChapterIds(new Set());

  const killerTitle = project.planning.logline.killerTitle || project.name || "Untitled Project";
  const fileName = `v${version}_${killerTitle.replace(/\s+/g, '_')}_${exportMode}`;

  const stats = useMemo(() => {
    const selectedList = chapters.filter(c => selectedChapterIds.has(c.id));
    const totalWords = selectedList.reduce((acc, c) => {
      const words = (c.draftContent || '').split(/\s+/).filter(Boolean).length;
      return acc + words;
    }, 0);
    return {
      count: selectedList.length,
      words: totalWords,
      pages: Math.ceil(totalWords / 250)
    };
  }, [chapters, selectedChapterIds]);

  const handlePublish = async () => {
    const selectedChapters = chapters.filter(c => selectedChapterIds.has(c.id));
    setIsPublishing(true);

    try {
      let finalHtmlBody = '';

      if (enableAIPostProcess) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const rawContent = selectedChapters.map(c => ({
          title: c.chapterTitle || c.title,
          description: c.description,
          content: c.draftContent || '',
          metadata: {
            conflict: c.conflict,
            tags: (c.tags || []).map(t => t.label)
          }
        }));

        const prompt = `
          Apply the following AI Formatting Script to the provided project chapters.
          Return ONLY valid HTML that can be injected into a <body> tag. 
          Use CSS for formatting where required (inline or style blocks).
          
          FORMATTING SCRIPT TO USE:
          ${scriptOverride || "Format the following chapters into a professional manuscript."}

          PROJECT DATA:
          ${JSON.stringify(rawContent)}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });

        finalHtmlBody = response.text || '<p>Error generating AI content.</p>';
      } else {
        selectedChapters.forEach((c, idx) => {
          finalHtmlBody += `<div class="chapter">`;
          finalHtmlBody += `<div class="chapter-title">${c.chapterTitle || c.title}</div>`;
          
          const showPlot = exportMode === 'FULL' || (exportMode === 'SELECTED' && includePlotMeta);
          const showWorld = exportMode === 'FULL' || (exportMode === 'SELECTED' && includeWorldMeta);
          const showDraft = exportMode === 'FULL' || exportMode === 'MAN' || (exportMode === 'SELECTED' && includeDraft);

          if (showPlot || showWorld) {
            finalHtmlBody += `<div class="meta-box">`;
            if (showPlot) {
              finalHtmlBody += `<div><span class="meta-label">Blueprint:</span> ${c.description || 'N/A'}</div>`;
              if (c.conflict) finalHtmlBody += `<div><span class="meta-label">Conflict:</span> ${c.conflict}</div>`;
            }
            if (showWorld) {
              const tags = (c.tags || []).map(t => t.label).join(', ');
              finalHtmlBody += `<div><span class="meta-label">Cast/Setting:</span> ${tags || 'None'}</div>`;
            }
            finalHtmlBody += `</div>`;
          }

          if (showDraft) {
            finalHtmlBody += `<div class="draft-content">${c.draftContent || '<i>(Chapter draft pending...)</i>'}</div>`;
          }
          finalHtmlBody += `</div>`;
        });
      }

      // Title Page logic
      const titlePageHtml = `
        <div class="title-page">
          <div class="title-main">${killerTitle}</div>
          <div class="title-meta">Version ${version} • ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <div class="title-author">Generated by Storyboard Architect</div>
        </div>
      `;

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${fileName}</title>
            <style>
              @page { 
                size: auto; 
                margin: 25mm 20mm 30mm 20mm; 
                counter-increment: page;
              }
              body { 
                font-family: 'Georgia', serif; 
                line-height: 1.8; 
                color: #111; 
                padding: 0; 
                max-width: 800px; 
                margin: 0 auto; 
                counter-reset: page 0;
              }
              
              /* Title Page Styles */
              .title-page { 
                height: 100vh; 
                display: flex; 
                flex-direction: column; 
                justify-content: center; 
                align-items: center; 
                text-align: center; 
                page-break-after: always;
                border: 1px solid transparent; 
              }
              .title-main { 
                font-size: 84px; 
                font-weight: 900; 
                letter-spacing: -4px; 
                line-height: 0.9; 
                margin-bottom: 32px; 
                text-transform: uppercase; 
                color: #000;
              }
              .title-meta { 
                font-size: 18px; 
                font-weight: bold; 
                text-transform: uppercase; 
                letter-spacing: 6px; 
                color: #888; 
              }
              .title-author { 
                margin-top: 150px; 
                font-size: 16px; 
                font-style: italic; 
                color: #aaa;
                letter-spacing: 1px;
              }

              .chapter { page-break-before: always; margin-bottom: 40px; }
              .chapter:first-of-type { page-break-before: auto; }
              
              .chapter-title { 
                font-size: 32px; 
                font-weight: bold; 
                border-bottom: 4px solid #000; 
                padding-bottom: 12px; 
                margin-bottom: 32px; 
                margin-top: 50px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              
              .meta-box { 
                background: #f8f8f8; 
                border-left: 4px solid #ddd; 
                padding: 20px; 
                margin-bottom: 32px; 
                font-size: 13px; 
                font-family: 'Arial', sans-serif; 
                color: #555; 
              }
              .meta-label { font-weight: bold; text-transform: uppercase; color: #222; margin-right: 12px; font-size: 11px; }
              
              .draft-content { 
                font-size: 19px; 
                text-align: justify; 
                white-space: pre-wrap; 
              }
              
              .manuscript { font-family: 'Courier New', Courier, monospace; line-height: 2; }
              .manuscript .draft-content { font-size: 16px; }

              /* Footer Styles for Print */
              ${includeFooter ? `
                .page-footer {
                  position: fixed;
                  bottom: -15mm;
                  left: 0;
                  right: 0;
                  font-family: 'Arial', sans-serif;
                  font-size: 11px;
                  color: #999;
                  display: flex;
                  justify-content: space-between;
                  border-top: 1px solid #eee;
                  padding-top: 12px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                }
                .page-footer::before { content: "${killerTitle}"; font-weight: 900; color: #444; }
                .page-footer::after { content: "Page " counter(page); }
              ` : ''}

              @media print {
                body { padding: 0; width: 100%; max-width: 100%; }
                .title-page { height: calc(100vh - 60mm); }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="${exportMode === 'MAN' ? 'manuscript' : ''}">
            ${titlePageHtml}
            ${includeFooter ? `<div class="page-footer"></div>` : ''}
            <div id="content-root">
              ${finalHtmlBody}
            </div>
          </body>
        </html>
      `;

      // Trigger the "File Interface" by launching the print dialog
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      
      // Delay slightly to allow rendering before the print dialog opens
      setTimeout(() => { 
        printWindow.print();
        // Option to close the window after printing (user experience)
        // printWindow.close();
      }, 500);

    } catch (err) {
      console.error("Publishing Failed:", err);
      alert("Encountered an issue during Publishing. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-teal-600"></div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-emerald-100">
              <FileDown size={40} />
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight truncate max-w-md">{killerTitle}</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] ml-1">Draft v{version} • Finalization Console</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-1">Draft Version</label>
            <div className="flex items-center gap-2">
               <span className="text-xl font-black text-slate-300">v</span>
               <input 
                 type="text" 
                 value={version}
                 onChange={e => setVersion(e.target.value.replace(/\D/g, '').slice(0, 2))}
                 className="w-16 bg-slate-50 border-2 border-slate-100 rounded-xl px-3 py-2 text-center text-lg font-black text-indigo-600 outline-none focus:border-indigo-500 transition-all"
               />
               <button 
                 onClick={incrementVersion}
                 className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 active:scale-95"
                 title="Next Version"
               >
                 <Plus size={16} />
               </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Output Settings */}
          <div className="lg:col-span-1 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <Settings2 size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Architectural Mode</h3>
              </div>
              <div className="flex flex-col gap-2">
                <ModeButton 
                  active={exportMode === 'MAN'} 
                  onClick={() => setExportMode('MAN')} 
                  label="Manuscript (MAN)" 
                  desc="Double-spaced Courier, standard submission format." 
                />
                <ModeButton 
                  active={exportMode === 'FULL'} 
                  onClick={() => setExportMode('FULL')} 
                  label="Architect Hub (FULL)" 
                  desc="Includes Plot, Conflict, and Cast metadata." 
                />
              </div>
            </section>

            <section className="space-y-4">
               <div className="flex items-center gap-3 text-slate-400">
                <Monitor size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Output Format</h3>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex gap-2">
                 <button 
                  onClick={() => setOutputFormat('PRINT')}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${outputFormat === 'PRINT' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Printer size={16} />
                   <span>Paper Print</span>
                 </button>
                 <button 
                  onClick={() => setOutputFormat('PDF')}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${outputFormat === 'PDF' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Download size={16} />
                   <span>PDF File</span>
                 </button>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-emerald-500">
                <Footprints size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Page Formatting</h3>
              </div>
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                <ToggleItem 
                  active={includeFooter} 
                  onClick={() => setIncludeFooter(!includeFooter)} 
                  label="Professional Footer" 
                />
                <div className="px-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Includes: {killerTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Page Counters (n of n)</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-violet-500">
                <Sparkles size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">AI Script Layer</h3>
              </div>
              <div className="p-6 bg-violet-50/50 rounded-[32px] border border-violet-100">
                <ToggleItem 
                  active={enableAIPostProcess} 
                  onClick={() => setEnableAIPostProcess(!enableAIPostProcess)} 
                  label="AI Formatting Script" 
                  color="bg-violet-600"
                />
              </div>
            </section>
          </div>

          {/* Right Column: Chapter Matrix */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 text-slate-400">
                <Layers size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Manuscript Selection</h3>
              </div>
              <div className="flex gap-4">
                <button onClick={selectAll} className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Select All</button>
                <button onClick={selectNone} className="text-[9px] font-black uppercase text-slate-400 hover:underline">Clear None</button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-8 max-h-[520px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-3">
                {chapters.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => toggleChapter(c.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${selectedChapterIds.has(c.id) ? 'bg-white border-indigo-200 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`transition-colors ${selectedChapterIds.has(c.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {selectedChapterIds.has(c.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-800">{c.chapterTitle || c.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Current Draft: {(c.draftContent || '').split(/\s+/).filter(Boolean).length} Words</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full-width AI Script Editor */}
        {enableAIPostProcess && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3 text-violet-500 mb-6">
              <Wand2 size={24} />
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Formatting Script</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Amend instructions before publishing</p>
              </div>
            </div>
            <div className="relative group">
              <textarea 
                value={scriptOverride}
                onChange={e => setScriptOverride(e.target.value)}
                className="w-full h-80 bg-violet-50/30 border-2 border-violet-100 rounded-[32px] p-10 text-lg font-mono text-violet-900 leading-relaxed focus:ring-8 focus:ring-violet-100 resize-none shadow-inner transition-all placeholder:text-violet-200"
                placeholder="Specify precise formatting rules for the AI (e.g., Font styles, chapter numbering rules...)"
              />
            </div>
          </div>
        )}

        {/* Bottom Bar: Action & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
          <section className="bg-amber-50 border border-amber-100 p-8 rounded-[32px] flex gap-6 items-start">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
               <Info size={24} />
             </div>
             <div className="space-y-1">
               <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Ready to Publish</h4>
               <p className="text-[10px] text-amber-700 leading-relaxed font-bold uppercase tracking-wider">
                 The <b>Killer Title</b> ("{killerTitle}") will appear in the page footer. Clicking the button below will open your system's file/print interface. 
               </p>
             </div>
          </section>

          <section className="p-8 bg-indigo-600 rounded-[32px] text-white space-y-6 shadow-2xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-center">
            {isPublishing && <div className="absolute inset-0 bg-indigo-600 flex flex-col items-center justify-center gap-4 z-10 animate-in fade-in">
              <Loader2 size={32} className="animate-spin text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Assembling {outputFormat}...</span>
            </div>}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 opacity-60">
                <Printer size={20} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Selection Overview</h3>
              </div>
              <div className="flex gap-8">
                 <div className="text-right">
                    <span className="block text-[8px] font-bold uppercase opacity-60">Chapters</span>
                    <span className="text-2xl font-black">{stats.count}</span>
                 </div>
                 <div className="text-right border-l border-white/10 pl-8">
                    <span className="block text-[8px] font-bold uppercase opacity-60">Word Count</span>
                    <span className="text-2xl font-black">{stats.words.toLocaleString()}</span>
                 </div>
              </div>
            </div>

            <button 
              onClick={handlePublish}
              disabled={selectedChapterIds.size === 0 || isPublishing}
              className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {enableAIPostProcess ? <Wand2 size={18} /> : (outputFormat === 'PDF' ? <Save size={18} /> : <Printer size={18} />)}
              {enableAIPostProcess ? `AI Generate ${outputFormat}` : (outputFormat === 'PDF' ? `Save ${outputFormat} File` : `Direct Print`)}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

const ModeButton = ({ active, onClick, label, desc }: any) => (
  <button 
    onClick={onClick}
    className={`p-5 rounded-[24px] border-2 text-left transition-all ${active ? 'bg-indigo-50 border-indigo-600 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
  >
    <div className={`text-xs font-black uppercase tracking-tight ${active ? 'text-indigo-700' : 'text-slate-900'}`}>{label}</div>
    <div className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">{desc}</div>
  </button>
);

const ToggleItem = ({ active, onClick, label, color }: any) => (
  <button onClick={onClick} className="flex items-center justify-between w-full group">
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
    <div className={`w-10 h-6 rounded-full p-1 transition-all ${active ? (color || 'bg-indigo-600') : 'bg-slate-200'}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-all ${active ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </button>
);

export default ExportHub;
