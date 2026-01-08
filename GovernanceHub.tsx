
import React, { useState } from 'react';
import { 
  UserPlus, ShieldCheck, Gavel, Trash2, Key, Mail, Lock, 
  CheckCircle2, AlertTriangle, ShieldAlert, Users, Edit3, 
  Save, X, Shield, Terminal, Database, Rocket, FileDown, 
  ArrowRightLeft, FileUp, BookOpen, Sparkles, Cloud, Binary, Wifi
} from 'lucide-react';
import { StoryboardState, UserProfile } from './types';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
}

const ALL_PERMISSIONS = [
  { key: 'ADMIN', label: 'Admin Access', icon: <ShieldCheck size={14} /> },
  { key: 'KB', label: 'KB Editor', icon: <BookOpen size={14} /> },
  { key: 'AI_SCRIPTS', label: 'AI Scripts', icon: <Terminal size={14} /> },
  { key: 'AI_CLEANUP', label: 'AI Cleanup', icon: <Sparkles size={14} /> },
  { key: 'FIREBASE', label: 'Branch Manager', icon: <Cloud size={14} /> },
  { key: 'DATA_EXPLORER', label: 'Data Explorer', icon: <Binary size={14} /> },
  { key: 'GOVERNANCE', label: 'Governance', icon: <Gavel size={14} /> },
  { key: 'PUBLISHING', label: 'Publishing', icon: <FileDown size={14} /> },
  { key: 'DATABASE_SYNC', label: 'Database Sync', icon: <Wifi size={14} /> },
  { key: 'PROJECT_BOOST', label: 'Project Boost', icon: <Rocket size={14} /> },
  { key: 'MOVE_THINGS_AROUND', label: 'Move Items', icon: <ArrowRightLeft size={14} /> },
  { key: 'EXPORT_IMPORT', label: 'Export & Import', icon: <FileUp size={14} /> },
];

const INITIAL_PERMS = ALL_PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.key]: false }), {});

const GovernanceHub: React.FC<Props> = ({ state, onUpdateState }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPerms, setNewPerms] = useState<Record<string, boolean>>({ ...INITIAL_PERMS, ADMIN: true });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});

  const handleCreateUser = () => {
    if (!newEmail || !newPass) {
      alert("Email and Password are required.");
      return;
    }

    const userId = Math.random().toString(36).substr(2, 9);
    const newUser: UserProfile = {
      id: userId,
      email: newEmail.toLowerCase(),
      password: newPass,
      isSuperuser: false,
      permissions: { ...newPerms }
    };

    onUpdateState({
      ...state,
      users: {
        ...state.users,
        [userId]: newUser
      }
    });

    setNewEmail('');
    setNewPass('');
    setNewPerms({ ...INITIAL_PERMS, ADMIN: true });
  };

  const startEditing = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditEmail(user.email);
    setEditPass(user.password || '');
    setEditPerms({ ...INITIAL_PERMS, ...(user.permissions || {}) });
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveEdit = () => {
    if (!editingUserId) return;
    const updatedUser = {
      ...state.users[editingUserId],
      email: editEmail.toLowerCase(),
      password: editPass,
      permissions: { ...editPerms }
    };

    onUpdateState({
      ...state,
      users: {
        ...state.users,
        [editingUserId]: updatedUser
      }
    });
    setEditingUserId(null);
  };

  const handleDeleteUser = (id: string) => {
    if (state.users[id]?.email === "dave@bigagility.com") {
      alert("The Oracle cannot be removed.");
      return;
    }
    if (!confirm("Remove this user's access?")) return;

    const newUsers = { ...state.users };
    delete newUsers[id];
    onUpdateState({ ...state, users: newUsers });
  };

  const toggleNewPerm = (perm: string) => {
    setNewPerms(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  const toggleEditPerm = (perm: string) => {
    setEditPerms(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  const userList = Object.values(state.users || {}) as UserProfile[];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      {/* Creation Section */}
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-indigo-900"></div>
        
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-indigo-100">
            <Gavel size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Governance <span className="text-indigo-600">Hub</span></h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Architectural Access Control</p>
          </div>
        </div>

        <section className="space-y-8 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
           <div className="flex items-center gap-3 text-indigo-600">
             <UserPlus size={24} />
             <h3 className="text-xl font-black uppercase tracking-tight">Onboard New Member</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
               <div className="relative">
                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                   type="email" 
                   value={newEmail} 
                   onChange={e => setNewEmail(e.target.value)} 
                   className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                   placeholder="writer@bigagility.com"
                 />
               </div>
             </div>
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Secure Password</label>
               <div className="relative">
                 <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                   type="text" 
                   value={newPass} 
                   onChange={e => setNewPass(e.target.value)} 
                   className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                   placeholder="narrative-pass-123"
                 />
               </div>
             </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Module Permissions Registry</label>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {ALL_PERMISSIONS.map(p => (
                 <button 
                   key={p.key}
                   onClick={() => toggleNewPerm(p.key)}
                   className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newPerms[p.key] ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                 >
                   <div className={newPerms[p.key] ? 'text-white' : 'text-slate-300'}>{p.icon}</div>
                   {p.label}
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={handleCreateUser}
             className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95"
           >
             Authorize Global Access
           </button>
        </section>

        <section className="pt-10 border-t border-slate-50 space-y-8">
           <div className="flex items-center gap-3 text-slate-400">
             <Users size={24} />
             <h3 className="text-xl font-black uppercase tracking-tight">Active User Registry</h3>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {userList.map(u => (
                <div key={u.id} className={`p-8 border-2 rounded-[40px] transition-all relative ${editingUserId === u.id ? 'bg-indigo-50/30 border-indigo-200 ring-4 ring-indigo-50' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                  {editingUserId === u.id ? (
                    <div className="space-y-8 animate-in fade-in duration-300">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Edit3 size={24}/></div>
                            <h4 className="text-xl font-black text-slate-900 uppercase">Editing Member</h4>
                         </div>
                         <button onClick={cancelEditing} className="p-3 hover:bg-white rounded-2xl text-slate-400"><X size={24}/></button>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                           <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none" />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                           <input value={editPass} onChange={e => setEditPass(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none" />
                         </div>
                       </div>

                       <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Update Permissions</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ALL_PERMISSIONS.map(p => (
                              <button 
                                key={p.key}
                                onClick={() => toggleEditPerm(p.key)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${editPerms[p.key] ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100'}`}
                              >
                                {p.icon}
                                {p.label}
                              </button>
                            ))}
                         </div>
                       </div>

                       <div className="flex gap-4">
                          <button onClick={saveEdit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                             <Save size={18} /> Save Member State
                          </button>
                          <button onClick={cancelEditing} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                       </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/row">
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-lg transition-transform group-hover/row:scale-110 ${u.email === 'dave@bigagility.com' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                          {u.email === 'dave@bigagility.com' ? <ShieldCheck size={32} /> : <Users size={32} />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="text-xl font-black text-slate-800">{u.email}</span>
                            {u.email === 'dave@bigagility.com' && <span className="text-[8px] font-black uppercase bg-indigo-600 text-white px-2.5 py-1 rounded-full tracking-[0.2em] shadow-sm">The Oracle</span>}
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                              <Key size={12} className="text-indigo-400"/> {u.password}
                            </span>
                            <div className="flex flex-wrap gap-1 max-w-sm">
                               {Object.keys(u.permissions || {}).filter(k => u.permissions[k]).map(k => {
                                 const meta = ALL_PERMISSIONS.find(ap => ap.key === k);
                                 return (
                                   <span key={k} className="text-[7px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50" title={meta?.label}>
                                     {k.replace('_', ' ')}
                                   </span>
                                 );
                               })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover/row:opacity-100 transition-all">
                        <button 
                          onClick={() => startEditing(u)}
                          className="p-4 bg-white border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm"
                          title="Edit User"
                        >
                          <Edit3 size={20} />
                        </button>
                        {u.email !== 'dave@bigagility.com' && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-4 bg-white border-2 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
                            title="Remove User"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default GovernanceHub;
