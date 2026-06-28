import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, GitMerge } from 'lucide-react';

export default function Compare() {
  const candidates = [
    { name: "Priya Sharma", score: 96, current: "Stripe", exp: "8 Yrs", tech: 94, comm: 88 },
    { name: "Marcus Chen", score: 88, current: "Vercel", exp: "5 Yrs", tech: 89, comm: 92 },
    { name: "Sarah Jenkins", score: 92, current: "Shopify", exp: "7 Yrs", tech: 91, comm: 85 },
  ];

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <GitMerge className="text-indigo-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Compare Candidates</h1>
      </div>

      {/* AI Recommendation Banner */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-6 rounded-3xl mb-12 flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="relative z-10 flex items-start space-x-6">
          <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/50">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-indigo-300 font-semibold mb-1 flex items-center">
              AI Recommendation <Trophy className="w-4 h-4 ml-2 text-yellow-500" />
            </h3>
            <p className="text-white text-lg font-medium">Priya Sharma is the strongest fit.</p>
            <p className="text-slate-400 mt-1 max-w-2xl">Highest technical depth in system design. Low hiring risk based on tenure at previous roles.</p>
          </div>
        </div>
        <div className="relative z-10 text-right">
          <span className="block text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            96%
          </span>
          <span className="text-sm text-indigo-300/80 uppercase tracking-wider font-semibold">Confidence</span>
        </div>
      </motion.div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="pt-24 space-y-12">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Current Role</div>
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Experience</div>
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tech Score</div>
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Comm Score</div>
        </div>

        {candidates.map((c, i) => (
          <motion.div 
            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-slate-900 border ${i === 0 ? 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/10'} p-6 rounded-3xl relative`}
          >
            {i === 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Top Match</div>}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 text-white flex items-center justify-center text-xl font-bold mb-3 border border-white/10">
                {c.name.charAt(0)}
              </div>
              <h3 className="text-lg font-semibold text-white">{c.name}</h3>
              <p className="text-indigo-400 font-medium text-sm">{c.score}% Match</p>
            </div>

            <div className="space-y-12 text-center text-slate-300 font-medium">
              <div>{c.current}</div>
              <div>{c.exp}</div>
              
              <div className="w-full">
                <span className="block mb-2">{c.tech}%</span>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="bg-indigo-500 h-full rounded-full" style={{ width: `${c.tech}%` }}/></div>
              </div>

              <div className="w-full">
                <span className="block mb-2">{c.comm}%</span>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{ width: `${c.comm}%` }}/></div>
              </div>
            </div>
            
            <button className={`w-full mt-10 py-3 rounded-xl font-medium transition-colors ${i === 0 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'}`}>
              Select Candidate
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}