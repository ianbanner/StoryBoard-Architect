
import React, { useState } from 'react';
import { Zap, LogIn, X, Check, Sparkles, Rocket, Layers, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface LandingPageProps {
  onLogin: (email: string, pass: string) => void;
  dbStatus: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
  dbErrorMsg: string | null;
  showInitModal: boolean;
  onCloseInitModal: () => void;
  membershipError: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, dbStatus, dbErrorMsg, showInitModal, onCloseInitModal, membershipError }) => {
  const [landingSection, setLandingSection] = useState<'BENEFITS' | 'PRICING' | 'FEATURES'>('BENEFITS');
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-ui text-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-12 z-[100]">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onLogin('dave@bigagility.com', 'funnypig')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors duration-500 cursor-pointer hover:scale-110 active:scale-95 ${dbStatus === 'ERROR' ? 'bg-rose-500 shadow-rose-200' : 'bg-indigo-600 shadow-indigo-200'}`}
          >
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Story Architect</span>
        </div>
        
        <div className="flex items-center gap-10">
          <nav className="flex items-center gap-8">
            <button onClick={() => setLandingSection('BENEFITS')} className={`text-sm font-bold uppercase tracking-widest ${landingSection === 'BENEFITS' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>The Method</button>
            <button onClick={() => setLandingSection('FEATURES')} className={`text-sm font-bold uppercase tracking-widest ${landingSection === 'FEATURES' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Your Toolkit</button>
            <button onClick={() => setLandingSection('PRICING')} className={`text-sm font-bold uppercase tracking-widest ${landingSection === 'PRICING' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Plans</button>
          </nav>
          <button 
            onClick={() => setShowLogin(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"
          >
            <LogIn size={16} /> Logon
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-20 px-12 max-w-7xl mx-auto w-full">
        {landingSection === 'BENEFITS' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-6 mb-20">
              <h1 className="text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">Your Story deserves a <span className="text-indigo-600">Great Plot.</span></h1>
              <p className="text-xl text-slate-500 max-w-3xl mx-auto font-desc italic">Stop staring at a blank page. We guide you through the proven blueprints of legendary storytellers, turning your creative sparks into an unputdownable masterpiece.</p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <BenefitCard icon={<Sparkles />} title="The Proven Roadmap" text="Follow the 'Save the Cat' 16-beat method used by Hollywood's biggest hits to ensure your story never drags." />
              <BenefitCard icon={<Rocket />} title="Defeat Writer's Block" text="Our visual pacing tools show you exactly what needs to happen next, so you never get stuck in the 'sagging middle'." />
              <BenefitCard icon={<Layers />} title="Guided Growth" text="Start with a simple idea and watch it blossom into a complex draft with our step-by-step hierarchical guidance." />
            </div>
          </div>
        )}

        {landingSection === 'FEATURES' && (
          <div className="grid grid-cols-2 gap-16 items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-8">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Everything you need <br/>to become an Author.</h2>
              <div className="space-y-6">
                <FeatureItem title="Guided Character Creation" text="Build deep, relatable heroes and villains with built-in prompts for goals, flaws, and 'Save the Cat' moments." />
                <FeatureItem title="The World Builder" text="Organize your settings in a dynamic atlas that links your locations directly to the scenes where they matter most." />
                <FeatureItem title="Visual Beat Boards" text="A drag-and-drop kanban interface that makes complex plotting feel like playing a game." />
              </div>
            </div>
            <div className="bg-indigo-600 rounded-[40px] aspect-square shadow-2xl shadow-indigo-200 flex items-center justify-center p-12">
               <div className="w-full h-full bg-white/10 rounded-[32px] border border-white/20 flex items-center justify-center text-white/40">
                  <Zap size={120} />
               </div>
            </div>
          </div>
        )}

        {landingSection === 'PRICING' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900">Start Your Writing Journey</h2>
              <p className="text-slate-500 mt-2 font-medium">Pick the tier that matches your creative ambition.</p>
            </div>
            <div className="grid grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard tier="Novice" price="Free" features={["1 Story Project", "The Basic Beat Board", "Local Drafting Only"]} />
              <PricingCard tier="Apprentice" price="$12/mo" features={["Unlimited Stories", "Full Character Bible", "Cloud Backup", "Emotional Pacing Guide"]} active />
              <PricingCard tier="Author" price="$29/mo" features={["Collaborative Plotting", "Advanced Story Audits", "AI Narrative Mentor", "Priority Support"]} />
            </div>
          </div>
        )}
      </main>

      {/* DB Status Modal */}
      {showInitModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div className="relative bg-white w-full max-lg rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex flex-col items-center text-center">
              {dbStatus === 'LOADING' && (
                <>
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                    <Loader2 size={32} className="animate-spin" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Calling the Writing Mentor</h3>
                  <p className="text-slate-500 font-medium mt-2">Connecting to your personal story vault. We're setting up your workspace...</p>
                </>
              )}
              {dbStatus === 'SUCCESS' && (
                <>
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Your Desk is Ready</h3>
                  <p className="text-slate-500 font-medium mt-2">Your stories are safe and synced. We’ve laid out the blueprints for your next great chapter.</p>
                  <button 
                    onClick={onCloseInitModal}
                    className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Let's Start Plotting
                  </button>
                </>
              )}
              {dbStatus === 'ERROR' && (
                <>
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Inspiration Interrupted</h3>
                  <p className="text-rose-500 font-bold uppercase text-[10px] tracking-widest mt-2">We couldn't reach the story vault</p>
                  <div className="mt-6 w-full bg-slate-900 rounded-2xl p-6 text-left font-mono text-[11px] text-rose-400 overflow-auto max-h-40 custom-scrollbar border border-slate-800">
                    <p className="text-slate-500 mb-2 border-b border-slate-800 pb-2 uppercase tracking-widest font-black text-[9px]">Diagnostic Log</p>
                    <pre className="whitespace-pre-wrap">{dbErrorMsg}</pre>
                  </div>
                  <button 
                    onClick={onCloseInitModal}
                    className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 transition-all"
                  >
                    Go Back to Drafts
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowLogin(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
            <div className="flex flex-col items-center text-center mb-10">
              <div 
                onClick={() => onLogin('dave@bigagility.com', 'funnypig')}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 transition-all cursor-pointer hover:scale-110 active:scale-95 ${dbStatus === 'ERROR' ? 'bg-rose-500 shadow-rose-100' : 'bg-indigo-600 shadow-indigo-100'}`}
              >
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Welcome Back, Writer</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Enter your details to continue your story</p>
            </div>
            
            {membershipError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="text-rose-600 shrink-0" size={20} />
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-900 uppercase tracking-widest">Access Denied</p>
                  <p className="text-xs text-rose-700 font-medium">You are not a member of the Storyboard Club. Email <span className="font-bold underline">ian@bigagility.com</span> to get permission to use the system.</p>
                </div>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              onLogin(formData.get('email') as string, formData.get('password') as string);
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Your Writer Email</label>
                <input name="email" type="email" required defaultValue="dave@bigagility.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all">
                Let's Start Plotting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal Sub-components
const BenefitCard = ({ icon, title, text }: any) => (
  <div className="bg-white border border-slate-100 p-10 rounded-[40px] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-desc italic">{text}</p>
  </div>
);

const FeatureItem = ({ title, text }: any) => (
  <div className="flex gap-6 group">
    <div className="shrink-0 w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      <Check size={20} />
    </div>
    <div className="space-y-1">
      <h4 className="text-xl font-bold text-slate-900">{title}</h4>
      <p className="text-slate-500 leading-relaxed">{text}</p>
    </div>
  </div>
);

const PricingCard = ({ tier, price, features, active }: any) => (
  <div className={`p-10 rounded-[40px] border-2 flex flex-col transition-all hover:scale-105 ${active ? 'bg-white border-indigo-600 shadow-2xl shadow-indigo-100 relative' : 'bg-slate-50 border-slate-200'}`}>
    {active && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>}
    <h3 className="text-xl font-black text-slate-900 mb-2">{tier}</h3>
    <div className="flex items-baseline gap-1 mb-8">
      <span className="text-4xl font-black text-slate-900">{price}</span>
      {price !== 'Free' && <span className="text-slate-400 text-sm font-bold">/lifetime</span>}
    </div>
    <div className="space-y-4 mb-10 flex-1">
      {features.map((f: string) => (
        <div key={f} className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center"><Check size={12} /></div>
          {f}
        </div>
      ))}
    </div>
    <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-900 text-white'}`}>Choose {tier}</button>
  </div>
);

export default LandingPage;
