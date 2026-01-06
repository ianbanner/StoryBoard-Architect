
import React, { useState } from 'react';
import { Rocket, Zap, Layout, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Project, CardType, StoryCard } from './types';

interface Props {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ProjectBoost: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [isBoosting, setIsBoosting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleBoost = async () => {
    setIsBoosting(true);
    setSuccessCount(null);
    
    // Slight delay for visual feedback
    await new Promise(r => setTimeout(r, 800));

    const currentSceneCount = project.sceneOrder?.length || 0;
    const targetCount = 40;
    const needed = targetCount - currentSceneCount;

    if (needed <= 0) {
      alert(`Project already has ${currentSceneCount} scenes. No boost required.`);
      setIsBoosting(false);
      return;
    }

    const newCards = { ...project.cards };
    const newSceneOrder = [...(project.sceneOrder || [])];

    for (let i = 0; i < needed; i++) {
      const id = generateId();
      const newCard: StoryCard = {
        id,
        type: CardType.SCENE,
        title: `Boosted Scene ${currentSceneCount + i + 1}`,
        description: "Scaffolded narrative unit. Replace with architectural details.",
        tags: [],
        children: [],
        associatedBeats: []
      };
      newCards[id] = newCard;
      newSceneOrder.push(id);
    }

    onUpdateProject({
      cards: newCards,
      sceneOrder: newSceneOrder
    });

    setSuccessCount(needed);
    setIsBoosting(false);
  };

  const currentCount = project.sceneOrder?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-16 shadow-sm flex flex-col items-center text-center space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-600"></div>
        
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-rose-100">
          <Rocket size={48} className={isBoosting ? "animate-bounce" : ""} />
        </div>

        <div className="space-y-4">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Project <span className="text-rose-500">Boost</span></h2>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.4em]">Rapid Narrative Scaffolding</p>
        </div>

        <p className="text-xl text-slate-500 font-desc italic max-w-2xl leading-relaxed">
          Instantly scale your storyboard to full length. If your project has fewer than 40 scenes, this utility will generate generic structural units to fill the gap, allowing you to focus on the writing.
        </p>

        <div className="grid grid-cols-2 gap-8 w-full max-w-md">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Scenes</span>
            <span className="text-4xl font-black text-slate-800">{currentCount}</span>
          </div>
          <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Target Scenes</span>
            <span className="text-4xl font-black text-indigo-600">40</span>
          </div>
        </div>

        <div className="pt-8 w-full max-w-md">
          <button 
            onClick={handleBoost}
            disabled={isBoosting || currentCount >= 40}
            className={`w-full py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 ${
              currentCount >= 40 
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-slate-900 text-white hover:bg-rose-600 shadow-rose-100'
            }`}
          >
            {isBoosting ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} fill="currentColor" />}
            {isBoosting ? 'Igniting Boost Sequence...' : currentCount >= 40 ? 'Project Already Full' : 'Fill In Project'}
          </button>
        </div>

        {successCount !== null && (
          <div className="flex items-center gap-4 text-emerald-600 bg-emerald-50 px-8 py-4 rounded-full border border-emerald-100 animate-in zoom-in-95">
            <CheckCircle2 size={24} />
            <span className="font-black uppercase tracking-widest text-[10px]">Successfully Injected {successCount} Narrative Units</span>
          </div>
        )}

        {currentCount >= 40 && successCount === null && (
          <div className="flex items-center gap-3 text-slate-400">
            <AlertCircle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Structural target achieved. No action required.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBoost;
