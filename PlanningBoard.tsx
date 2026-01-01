
import React, { useState } from 'react';
import { Target, Info, ChevronRight, Edit3, Plus, Zap, User, X, Users } from 'lucide-react';
import { STCPlanning, ProjectInfo, Character, HeroTransformation } from './types';
import { STCEditorField } from './CommonUI';

const SNYDER_GENRES: Record<string, string[]> = {
  "Monster in the House": ["Monster", "House", "Sin"],
  "Golden Fleece": ["Road", "Team", "Prize"],
  "Out of the Bottle": ["Wish/Curse", "Spell", "Lesson"],
  "Dude with a Problem": ["Innocent Hero", "Sudden Event", "Life/Death Stakes"],
  "Rites of Passage": ["Life Problem", "Wrong Way", "Acceptance"],
  "Buddy Love": ["Incomplete Hero", "Counterpart", "Complication"],
  "Whydunit": ["Secret", "Detective", "Dark Turn"],
  "The Fool Triumphant": ["Fool", "Establishment", "Transmutation"],
  "Institutionalized": ["Group", "Choice", "Sacrifice"],
  "Superhero": ["Power", "Nemesis", "Curse"]
};

interface Props {
  planning: STCPlanning;
  projects: ProjectInfo[];
  characters: Character[];
  activeProjectId: string;
  onSwitchProject: (id: string) => void;
  onCreateProject: () => void;
  setPlanning: (updates: Partial<STCPlanning>) => void;
}

const PlanningBoard: React.FC<Props> = ({ planning, projects, characters, activeProjectId, onSwitchProject, onCreateProject, setPlanning }) => {
  const [editingCategory, setEditingCategory] = useState<'LOGLINE' | 'GENRE' | 'GROUP_HERO' | 'INDIVIDUAL_HERO' | null>(null);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);

  const heroIdsInGang = Object.keys(planning.heroTransformations || {});
  const activeHeroId = selectedHeroId || heroIdsInGang[0] || (characters.length > 0 ? characters[0].id : null);

  const handleAddHeroToGang = (charId: string) => {
    if (heroIdsInGang.length >= 4) return;
    const newTransformations = { ...planning.heroTransformations };
    if (!newTransformations[charId]) {
      newTransformations[charId] = { wants: "", needs: "", primalGoal: "", transformationArc: "" };
      setPlanning({ heroTransformations: newTransformations });
    }
  };

  const handleRemoveHeroFromGang = (charId: string) => {
    const newTransformations = { ...planning.heroTransformations };
    delete newTransformations[charId];
    setPlanning({ heroTransformations: newTransformations });
  };

  const updateIndividualHeroData = (charId: string, updates: Partial<HeroTransformation>) => {
    const newTransformations = { ...planning.heroTransformations };
    if (!newTransformations[charId]) {
       newTransformations[charId] = { wants: "", needs: "", primalGoal: "", transformationArc: "" };
    }
    newTransformations[charId] = { ...newTransformations[charId], ...updates };
    setPlanning({ heroTransformations: newTransformations });
  };

  const updateGroupData = (updates: Partial<HeroTransformation>) => {
    setPlanning({ groupTransformation: { ...planning.groupTransformation, ...updates } });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-40">
      {/* Project Metadata Selector Section */}
      <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 ml-1">Current Active Project</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={activeProjectId}
                  onChange={(e) => onSwitchProject(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 min-w-[320px] cursor-pointer hover:border-indigo-200 transition-all"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
              <button 
                onClick={onCreateProject}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
              >
                <Plus size={16} /> New Project
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end pr-4 border-l border-slate-100 pl-8">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Architecture Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold text-slate-600">Structure Verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Logline Card */}
        <PlanningCard 
          title="Logline Laboratory" 
          subtitle="Hook & Irony"
          icon={<Target className="text-white" size={24} />}
          iconBg="bg-indigo-500"
          description={planning.logline.irony || "Craft your hook and mental picture."}
          onClick={() => setEditingCategory('LOGLINE')}
          footerLabel="4 Requirements"
        />

        {/* Genre Card */}
        <PlanningCard 
          title="Genre Architect" 
          subtitle={planning.genre.type}
          icon={<Info className="text-white" size={24} />}
          iconBg="bg-amber-500"
          description={`Focusing on the ${planning.genre.type} requirements.`}
          onClick={() => setEditingCategory('GENRE')}
          footerLabel="Blake Snyder"
        />

        {/* Hero Gang (Collective) Card */}
        <PlanningCard 
          title="The Hero Gang" 
          subtitle="Collective Journey"
          icon={<Users className="text-white" size={24} />}
          iconBg="bg-emerald-500"
          description={planning.groupTransformation.transformationArc || "How does the team change as one?"}
          onClick={() => setEditingCategory('GROUP_HERO')}
          footerLabel={`${heroIdsInGang.length}/4 Members`}
        />

        {/* Individual Arcs Card */}
        <PlanningCard 
          title="Individual Arcs" 
          subtitle="Character Soul"
          icon={<Zap className="text-white" size={24} />}
          iconBg="bg-violet-500"
          description="Drill down into any hero's personal transformation."
          onClick={() => setEditingCategory('INDIVIDUAL_HERO')}
          footerLabel="Internal Logic"
        />
      </div>

      {/* Side Editor Panel */}
      {editingCategory && (
        <div className="fixed inset-y-0 right-0 w-[580px] bg-white shadow-2xl z-[1000] border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-6">
              <button onClick={() => setEditingCategory(null)} className="p-3 hover:bg-slate-200 rounded-full text-slate-500">
                <ChevronRight size={32} />
              </button>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {editingCategory === 'LOGLINE' ? 'Logline Laboratory' : 
                   editingCategory === 'GENRE' ? 'Genre Architect' : 
                   editingCategory === 'GROUP_HERO' ? 'The Hero Gang' : 'Individual Arcs'}
                </h3>
                <span className="text-base font-black uppercase text-slate-400 tracking-widest">
                  Story Architecture
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
            {editingCategory === 'LOGLINE' && (
              <div className="space-y-10">
                <STCEditorField label="Irony (The Hook)" value={planning.logline.irony} onChange={(v: string) => setPlanning({ logline: { ...planning.logline, irony: v } })} />
                <div className="space-y-4">
                  <label className="text-base font-black uppercase text-slate-400 tracking-widest">Compelling Mental Picture</label>
                  <textarea value={planning.logline.mentalPicture} onChange={e => setPlanning({ logline: { ...planning.logline, mentalPicture: e.target.value } })} className="w-full h-48 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none font-desc italic" />
                </div>
                <STCEditorField label="Killer Title" value={planning.logline.killerTitle} onChange={(v: string) => setPlanning({ logline: { ...planning.logline, killerTitle: v } })} />
              </div>
            )}

            {editingCategory === 'GENRE' && (
              <div className="space-y-12">
                <div className="space-y-6">
                  <label className="text-base font-black uppercase text-slate-400 tracking-widest">Select Genre</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(SNYDER_GENRES).map(g => (
                      <button key={g} onClick={() => setPlanning({ genre: { ...planning.genre, type: g } })} className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${planning.genre.type === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-10 pt-10 border-t border-slate-100">
                  <label className="text-base font-black uppercase text-slate-400 tracking-widest">Genre Requirements</label>
                  {SNYDER_GENRES[planning.genre.type]?.map((req, i) => (
                    <STCEditorField key={req} label={req} value={i === 0 ? planning.genre.requirementA : i === 1 ? planning.genre.requirementB : planning.genre.requirementC} onChange={(v: string) => setPlanning({ genre: { ...planning.genre, [i === 0 ? 'requirementA' : i === 1 ? 'requirementB' : 'requirementC']: v } })} />
                  ))}
                </div>
              </div>
            )}

            {editingCategory === 'GROUP_HERO' && (
              <div className="space-y-12">
                <div className="space-y-6">
                   <label className="text-base font-black uppercase text-slate-400 tracking-widest mb-4">Assign Hero Gang Members (Max 4)</label>
                   
                   {/* Visual Selection Area */}
                   <div className="space-y-8">
                     {/* Currently in Gang */}
                     <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Gang Members</span>
                        <div className="flex flex-wrap gap-2 min-h-[48px] p-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                          {heroIdsInGang.length === 0 ? (
                            <span className="text-xs text-slate-400 font-desc italic">No members assigned yet. Click characters below to add them.</span>
                          ) : (
                            heroIdsInGang.map(hid => {
                              const char = characters.find(c => c.id === hid);
                              return (
                                <button key={hid} onClick={() => handleRemoveHeroFromGang(hid)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all group">
                                  <User size={14} /> 
                                  {char?.name || 'Unknown'}
                                  <X size={12} className="ml-1 opacity-60 group-hover:opacity-100" />
                                </button>
                              );
                            })
                          )}
                        </div>
                     </div>

                     {/* Available Cast */}
                     <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Cast</span>
                        <div className="flex flex-wrap gap-2">
                          {characters.filter(c => !heroIdsInGang.includes(c.id)).length === 0 ? (
                            <span className="text-xs text-slate-400 font-desc italic">Full cast assigned.</span>
                          ) : (
                            characters.filter(c => !heroIdsInGang.includes(c.id)).map(char => (
                              <button key={char.id} onClick={() => handleAddHeroToGang(char.id)} className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-100 text-slate-600 rounded-full text-sm font-bold hover:border-emerald-400 hover:text-emerald-600 transition-all">
                                <Plus size={14} className="text-slate-300" />
                                {char.name}
                              </button>
                            ))
                          )}
                        </div>
                     </div>
                   </div>
                </div>

                <div className="space-y-10 pt-10 border-t border-slate-100">
                  <label className="text-base font-black uppercase text-slate-400 tracking-widest">The Collective Journey</label>
                  <STCEditorField label="Primal Group Goal" value={planning.groupTransformation.primalGoal} onChange={(v: string) => updateGroupData({ primalGoal: v })} placeholder="Collective survival, status, etc." />
                  <div className="space-y-4">
                    <label className="text-base font-black uppercase text-slate-400 tracking-widest">Group Want vs Need</label>
                    <textarea value={planning.groupTransformation.wants} onChange={e => updateGroupData({ wants: e.target.value })} className="w-full h-32 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none mb-4" placeholder="What the gang thinks they want..." />
                    <textarea value={planning.groupTransformation.needs} onChange={e => updateGroupData({ needs: e.target.value })} className="w-full h-32 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none" placeholder="What the gang actually needs..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-base font-black uppercase text-slate-400 tracking-widest">Group Transformation Arc</label>
                    <textarea value={planning.groupTransformation.transformationArc} onChange={e => updateGroupData({ transformationArc: e.target.value })} className="w-full h-48 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-indigo-100 resize-none font-desc italic" placeholder="Summarize the change for the team..." />
                  </div>
                </div>
              </div>
            )}

            {editingCategory === 'INDIVIDUAL_HERO' && (
              <div className="space-y-10">
                <div className="space-y-6">
                  <label className="text-base font-black uppercase text-slate-400 tracking-widest">Select Hero to Detail</label>
                  <div className="relative">
                    <select 
                      value={activeHeroId || ''} 
                      onChange={e => setSelectedHeroId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xl font-bold text-slate-700 focus:ring-2 focus:ring-violet-200 appearance-none cursor-pointer"
                    >
                      {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                    </select>
                    <ChevronRight size={24} className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {activeHeroId && (
                  <div className="space-y-10 pt-10 border-t border-slate-100 animate-in fade-in duration-500">
                    <STCEditorField label="Personal Primal Goal" value={planning.heroTransformations[activeHeroId]?.primalGoal || ''} onChange={(v: string) => updateIndividualHeroData(activeHeroId, { primalGoal: v })} />
                    <div className="space-y-4">
                      <label className="text-base font-black uppercase text-slate-400 tracking-widest">Individual Want</label>
                      <textarea value={planning.heroTransformations[activeHeroId]?.wants || ''} onChange={e => updateIndividualHeroData(activeHeroId, { wants: e.target.value })} className="w-full h-32 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-violet-100 resize-none" placeholder="What does this specific hero think they want?" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-base font-black uppercase text-slate-400 tracking-widest">Individual Need</label>
                      <textarea value={planning.heroTransformations[activeHeroId]?.needs || ''} onChange={e => updateIndividualHeroData(activeHeroId, { needs: e.target.value })} className="w-full h-32 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-violet-100 resize-none" placeholder="What must this specific hero realize?" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-base font-black uppercase text-slate-400 tracking-widest">Personal Transformation Arc</label>
                      <textarea value={planning.heroTransformations[activeHeroId]?.transformationArc || ''} onChange={e => updateIndividualHeroData(activeHeroId, { transformationArc: e.target.value })} className="w-full h-48 bg-slate-50 border-none rounded-3xl p-6 text-xl font-medium focus:ring-2 focus:ring-violet-100 resize-none font-desc italic" placeholder="Summarize their personal growth..." />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlanningCard = ({ title, subtitle, icon, iconBg, description, onClick, footerLabel }: any) => (
  <div 
    onClick={onClick}
    className="bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col group transition-all relative hover:shadow-2xl hover:border-indigo-100 cursor-pointer h-[240px]"
  >
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit3 size={16} className="text-slate-400" />
      </div>
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{subtitle}</p>
    <p className="mt-4 text-xs text-slate-500 font-desc italic leading-relaxed line-clamp-2">{description}</p>
    
    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
       <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{footerLabel}</span>
       <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default PlanningBoard;
