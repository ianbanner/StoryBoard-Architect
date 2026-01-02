
import React, { useState } from 'react';
// Added Users to imports
import { UserPlus, ShieldCheck, Gavel, Trash2, Key, Mail, Lock, CheckCircle2, AlertTriangle, ShieldAlert, Users } from 'lucide-react';
import { StoryboardState, UserProfile } from './types';

interface Props {
  state: StoryboardState;
  onUpdateState: (newState: StoryboardState) => void;
}

const GovernanceHub: React.FC<Props> = ({ state, onUpdateState }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPerms, setNewPerms] = useState({
    ADMIN: true,
    KB: true,
    AI_CLEANUP: true,
    FIREBASE: true,
    DATA_EXPLORER: true
  });

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

  const togglePerm = (perm: string) => {
    setNewPerms(prev => ({ ...prev, [perm]: !prev[perm as keyof typeof prev] }));
  };

  // Fixed: Cast to UserProfile[] to resolve unknown type errors in mapping
  const userList = Object.values(state.users || {}) as UserProfile[];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      <div className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-sm space-y-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-indigo-900"></div>
        
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-indigo-100">
            <Gavel size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Governance Hub</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Member Access & Permissions</p>
          </div>
        </div>

        <section className="space-y-8">
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
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
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
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                   placeholder="narrative-pass-123"
                 />
               </div>
             </div>
           </div>

           <div className="space-y-4">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Module Access (Admin Menu)</label>
             <div className="flex flex-wrap gap-4">
               {Object.keys(newPerms).map(p => (
                 <button 
                   key={p}
                   onClick={() => togglePerm(p)}
                   className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newPerms[p as keyof typeof newPerms] ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100'}`}
                 >
                   {newPerms[p as keyof typeof newPerms] ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                   {p.replace('_', ' ')}
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={handleCreateUser}
             className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all"
           >
             Authorize Member Access
           </button>
        </section>

        <section className="pt-10 border-t border-slate-50 space-y-8">
           <div className="flex items-center gap-3 text-slate-400">
             {/* Fixed: Added missing icon to imports */}
             <Users size={24} />
             <h3 className="text-xl font-black uppercase tracking-tight">Active Registry</h3>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {userList.map(u => (
                <div key={u.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-6">
                    {/* Fixed: Added missing icon to imports */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${u.email === 'dave@bigagility.com' ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-300'}`}>
                      <Users size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-800">{u.email}</span>
                        {u.email === 'dave@bigagility.com' && <span className="text-[8px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded tracking-widest">Oracle</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Key size={10}/> {u.password}</span>
                        <div className="flex gap-1">
                           {Object.keys(u.permissions || {}).filter(k => u.permissions[k]).map(k => (
                             <span key={k} className="text-[8px] font-black uppercase text-indigo-400 bg-white border border-indigo-50 px-1.5 py-0.5 rounded">{k}</span>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {u.email !== 'dave@bigagility.com' && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
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
