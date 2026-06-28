import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Candidates from './Candidates'
import Interviews from './Interviews';
import Compare from './Compare';
import Analytics from './Analytics';
import WSettings from './Settings';
import {
  Briefcase, Users, Calendar, BarChart2,
  Settings, Plus, Sparkles, Video, GitMerge,
  ChevronRight, BrainCircuit, Activity
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', icon: Sparkles, label: 'Dashboard' },
    { id: 'jobs', icon: Briefcase, label: 'Jobs' },
    { id: 'candidates', icon: Users, label: 'Candidates' },
    { id: 'interviews', icon: Calendar, label: 'Interviews' },
    { id: 'compare', icon: GitMerge, label: 'Compare' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen w-20 flex flex-col items-center py-8 bg-surface/50 border-r border-white/5 backdrop-blur-xl z-50">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(79,124,255,0.4)] mb-12">
        <BrainCircuit className="text-white w-6 h-6" />
      </div>

      <nav className="flex-1 w-full flex flex-col items-center space-y-6">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative group p-3 rounded-2xl transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-6 h-6 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// --- LANDING DASHBOARD ---
const LandingHero = ({ onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hero-glow rounded-full blur-[120px] opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 font-medium mb-6 flex items-center space-x-2"
        >
          <span>Good Morning, Recruiter</span>
          <span className="text-xl">👋</span>
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-6xl font-bold text-white tracking-tight mb-6"
        >
          Find Your Next Top Performer <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-lg text-slate-400 mb-12 max-w-2xl"
        >
          Create a job description and let AI discover, rank, interview, and compare the best candidates automatically.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('create-job')}
          className="group relative px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-[0_0_40px_-10px_#4F7CFF] overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <span className="relative z-10 flex items-center text-lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Create AI Job
          </span>
        </motion.button>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-6 mt-24 w-full">
          {[
            { icon: BrainCircuit, title: "Semantic Matching", desc: "Beyond keywords. True intent." },
            { icon: Video, title: "Video Analysis", desc: "Automated behavioral scoring." },
            { icon: GitMerge, title: "Smart Comparison", desc: "Side-by-side data-driven ranking." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              whileHover={{ y: -5, borderColor: 'rgba(79,124,255,0.4)' }}
              className="bg-surface/50 border border-white/5 backdrop-blur-md p-6 rounded-3xl flex flex-col items-center text-center transition-colors"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-indigo-500">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-white font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// --- CREATE JOB (Notion + AI UI) ---
const CreateJob = () => {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulated live analysis
  useEffect(() => {
    if (content.length > 20) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => setIsAnalyzing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [content]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex h-full w-full"
    >
      {/* Editor Side */}
      <div className="flex-1 p-16 overflow-y-auto">
        <input
          type="text"
          placeholder="Job Title..."
          className="w-full bg-transparent text-5xl font-bold text-white placeholder-slate-700 outline-none mb-8"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the role, responsibilities, and the kind of person you are looking for..."
          className="w-full h-[600px] bg-transparent text-xl text-slate-300 placeholder-slate-700 outline-none resize-none leading-relaxed"
        />
      </div>

      {/* AI Analysis Panel */}
      <div className="w-[400px] bg-surface/40 border-l border-white/5 backdrop-blur-xl p-8 flex flex-col">
        <div className="flex items-center space-x-3 mb-8">
          <Sparkles className="text-primary w-5 h-5" />
          <h2 className="text-lg font-medium text-white">Live AI Insights</h2>
        </div>

        {content.length < 20 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">Start typing to see AI extract requirements, skills, and match criteria in real-time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface border border-white/10 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-slate-400">Required Skills</span>
                {isAnalyzing ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 2 }}>
                    <Activity className="w-4 h-4 text-primary" />
                  </motion.div>
                ) : (
                  <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">94% Confidence</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {isAnalyzing ? (
                  <>
                    <div className="w-20 h-7 bg-white/5 animate-pulse rounded-lg" />
                    <div className="w-24 h-7 bg-white/5 animate-pulse rounded-lg" />
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm">React</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm">System Design</span>
                  </>
                )}
              </div>
            </div>

            {/* Additional AI Cards can go here... */}
            <button className="w-full py-4 mt-auto bg-white text-background font-semibold rounded-2xl hover:bg-slate-200 transition-colors">
              Publish & Find Candidates
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- PIPELINE DASHBOARD ---
const JobPipelines = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Active Pipelines</h1>
          <p className="text-slate-400">Monitoring 4 active roles and 432 candidates.</p>
        </div>
        <button className="px-5 py-2.5 bg-surface border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" /> New Role
        </button>
      </div>

      <div className="space-y-4">
        {[
          { title: "Senior Backend Engineer", candidates: 132, matches: 42, interviews: 18, matchScore: 96 },
          { title: "Product Designer", candidates: 89, matches: 12, interviews: 4, matchScore: 88 },
        ].map((job, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-surface/50 border border-white/5 hover:border-primary/30 p-6 rounded-3xl transition-all duration-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  {job.matchScore}% Best Match
                </span>
              </div>

              <div className="flex space-x-12 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Found</span>
                  <span className="text-white font-medium">{job.candidates}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">AI Matches</span>
                  <span className="text-primary font-medium">{job.matches}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Interviews</span>
                  <span className="text-white font-medium">{job.interviews}</span>
                </div>

                {/* Pipeline Progress Bar */}
                <div className="flex-1 max-w-xs pt-1">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div className="bg-primary/40 h-full w-[30%]" />
                    <div className="bg-primary/70 h-full w-[20%]" />
                    <div className="bg-primary h-full w-[10%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-slate-400 transition-all duration-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// --- MAIN ENTRY ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-white overflow-hidden selection:bg-primary/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 relative overflow-hidden flex">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <LandingHero key="hero" onNavigate={setActiveTab} />}
          {activeTab === 'jobs' && <JobPipelines key="jobs" />}
          {activeTab === 'create-job' && <CreateJob key="create" />}
          {activeTab === 'candidates' && <Candidates key="candidates" />}
          {activeTab === 'interviews' && <Interviews key="interviews" />}
          {activeTab === 'compare' && <Compare key="compare" />}
          {activeTab === 'analytics' && <Analytics key="analytics" />}
          {activeTab === 'settings' && <WSettings key="settings" />}
        </AnimatePresence>
      </main>
    </div>
  );
}