
import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, ChevronDown, ArrowRightLeft, Layout, FileText, 
  Move, GripVertical, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Project, StoryCard, CardType } from './types';

interface Props {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

const MoveThingsAround: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [movingChapterId, setMovingChapterId] = useState<string | null>(null);

  const moveScene = (index: number, direction: 'UP' | 'DOWN') => {
    const newOrder = [...(project.sceneOrder || [])];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIdx, 0, moved);
    onUpdateProject({ sceneOrder: newOrder });
  };

  const moveChapter = (parentId: string, index: number, direction: 'UP' | 'DOWN') => {
    const parent = project.cards[parentId];
    if (!parent) return;
    const newChildren = [...parent.children];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newChildren.length) return;

    const [moved] = newChildren.splice(index, 1);
    newChildren.splice(targetIdx, 0, moved);
    onUpdateProject({
      cards: { ...project.cards, [parentId]: { ...parent, children: newChildren } }
    });
  };

  const reassignChapter = (chapterId: string, oldParentId: string, newParentId: string) => {
    if (oldParentId === newParentId) return;
    const oldParent = project.cards[oldParentId];
    const newParent = project.cards[newParentId];
    const chapter = project.cards[chapterId];
    if (!oldParent || !newParent || !chapter) return;

    const updatedCards = { ...project.cards };
    updatedCards[oldParentId] = { ...oldParent, children: oldParent.children.filter(id => id !== chapterId) };
    updatedCards[newParentId] = { ...newParent, children: [...newParent.children, chapterId] };
    updatedCards[chapterId] = { ...chapter, parentId: newParentId };

    onUpdateProject({ cards: updatedCards });
    setMovingChapterId(null);
  };

  const scenes = (project.sceneOrder || []).map(id => project.cards[id]).filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600"></div>
        
        <div className="flex items-center gap-6 mb-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center shadow-xl shadow-indigo-100">
            <ArrowRightLeft size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Structure Architect</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Relational Outline & Reordering</p>
          </div>
        </div>

        <div className="space-y-6">
          {scenes.map((scene, sIdx) => (
            <div key={scene.id} className="group/scene border-2 border-slate-100 rounded-[32px] overflow-hidden bg-slate-50/30">
              {/* Scene Row */}
              <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => moveScene(sIdx, 'UP')}
                      disabled={sIdx === 0}
                      className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveScene(sIdx, 'DOWN')}
                      disabled={sIdx === scenes.length - 1}
                      className="p-1 text-slate-300 hover:text-indigo-600 disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    {sIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight">{scene.title}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Narrative Scene Unit</p>
                  </div>
                </div>
              </div>

              {/* Chapters List */}
              <div className="p-4 space-y-3">
                {scene.children.map((chapterId, cIdx) => {
                  const chapter = project.cards[chapterId];
                  if (!chapter) return null;
                  return (
                    <div key={chapter.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/chapter">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => moveChapter(scene.id, cIdx, 'UP')}
                            disabled={cIdx === 0}
                            className="p-1 text-slate-200 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button 
                            onClick={() => moveChapter(scene.id, cIdx, 'DOWN')}
                            disabled={cIdx === scene.children.length - 1}
                            className="p-1 text-slate-200 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px]">
                          {sIdx + 1}.{cIdx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">{chapter.title}</h4>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Chapter Unit</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {movingChapterId === chapter.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <select 
                              onChange={(e) => reassignChapter(chapter.id, scene.id, e.target.value)}
                              className="text-[10px] font-black uppercase tracking-widest border-2 border-indigo-200 rounded-lg px-2 py-1.5 focus:ring-0 focus:border-indigo-600 outline-none"
                              defaultValue={scene.id}
                            >
                              <option disabled value={scene.id}>Move to Scene...</option>
                              {scenes.filter(s => s.id !== scene.id).map((s, i) => (
                                <option key={s.id} value={s.id}>Scene {i + 1}: {s.title}</option>
                              ))}
                            </select>
                            <button onClick={() => setMovingChapterId(null)} className="p-1.5 text-slate-400 hover:text-rose-500">
                               <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setMovingChapterId(chapter.id)}
                            className="opacity-0 group-hover/chapter:opacity-100 p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                          >
                            <Move size={14} /> Reassign
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {scene.children.length === 0 && (
                  <div className="py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No Chapters Assigned</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const X = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default MoveThingsAround;
