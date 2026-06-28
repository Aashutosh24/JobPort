import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle2, ChevronRight, Video, FileText } from 'lucide-react';

const CandidateCard = ({ name, role, company, match, skills, flags, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative p-6 rounded-3xl border bg-slate-900 transition-all duration-300 hover:-translate-y-1 ${
        match > 90 ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-xl text-white">
              {name.charAt(0)}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{name}</h3>
            <p className="text-slate-400 text-sm">{role} at {company}</p>
          </div>
        </div>

        {/* AI Match Ring */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
            <circle 
              cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
              strokeDasharray={175} 
              strokeDashoffset={175 - (175 * match) / 100}
              className={`${match > 90 ? 'text-emerald-500' : 'text-indigo-500'} transition-all duration-1000`} 
            />
          </svg>
          <span className="absolute text-sm font-bold text-white">{match}%</span>
        </div>
      </div>

      {/* Skills & Flags */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
              {skill}
            </span>
          ))}
        </div>
        
        {flags.length > 0 && (
          <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              {flags.map((flag, i) => (
                <span key={i} className="text-xs text-rose-400">{flag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
        <button className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
          Invite to Interview
        </button>
        <button className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors" title="View Resume">
          <FileText className="w-5 h-5" />
        </button>
        <button className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors" title="View Full Profile">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default function Candidates() {
  const mockCandidates = [
    {
      name: "Priya Sharma",
      role: "Senior Backend Engineer",
      company: "Stripe",
      match: 96,
      skills: ["Node.js", "PostgreSQL", "System Design", "AWS"],
      flags: []
    },
    {
      name: "Marcus Chen",
      role: "Platform Engineer",
      company: "Vercel",
      match: 88,
      skills: ["Go", "Kubernetes", "Docker", "TypeScript"],
      flags: ["Has not worked with your primary database (MongoDB)"]
    },
    {
      name: "Sarah Jenkins",
      role: "Backend Developer",
      company: "Shopify",
      match: 92,
      skills: ["Ruby on Rails", "Redis", "GraphQL"],
      flags: []
    }
  ];

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Candidate Pipeline</h1>
          <p className="text-slate-400">Reviewing top AI matches for Backend Engineer.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-sm bg-slate-900 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5">
            Filter by Skill
          </button>
          <button className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Auto-Invite Top Matches
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCandidates.map((candidate, i) => (
          <CandidateCard key={i} {...candidate} delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}