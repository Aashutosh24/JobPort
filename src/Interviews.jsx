import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Play, MessageSquare, Star, Clock } from 'lucide-react';

export default function Interviews() {
  const scores = [
    { label: "Technical Depth", score: 94 },
    { label: "Communication", score: 88 },
    { label: "Leadership", score: 76 },
    { label: "Domain Expertise", score: 92 }
  ];

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Analysis</h1>
          <p className="text-slate-400">AI behavioral and technical breakdown for Priya Sharma.</p>
        </div>
        <button className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
          Move to Offer
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left: Resume & Summary */}
        <div className="col-span-4 space-y-6">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 mb-4">
              <img src="https://i.pravatar.cc/150?img=47" alt="Priya" className="w-full h-full object-cover rounded-[14px]" />
            </div>
            <h2 className="text-xl font-semibold text-white">Priya Sharma</h2>
            <p className="text-indigo-400 font-medium mb-4">Senior Backend Engineer</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {['Node.js', 'System Design', 'AWS', 'GraphQL'].map(skill => (
                <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
                  {skill}
                </span>
              ))}
            </div>
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Employment History</h3>
              <div>
                <p className="text-white font-medium">Stripe</p>
                <p className="text-sm text-slate-500">Backend Engineer • 2020 - Present</p>
              </div>
              <div>
                <p className="text-white font-medium">Uber</p>
                <p className="text-sm text-slate-500">Software Engineer • 2017 - 2020</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Analysis & Transcript */}
        <div className="col-span-8 space-y-6">
          {/* AI Score Breakdown */}
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl grid grid-cols-2 gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] pointer-events-none" />
            
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <BrainCircuit className="text-indigo-500 w-6 h-6" />
                <h3 className="text-lg font-semibold text-white">AI Score Breakdown</h3>
              </div>
              <div className="space-y-4">
                {scores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">{s.label}</span>
                      <span className="text-white font-medium">{s.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ delay: 0.5, duration: 1 }}
                        className="bg-indigo-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-l border-white/10 pl-8 flex flex-col justify-center">
              <h4 className="text-sm font-semibold text-slate-400 mb-2">AI Verdict</h4>
              <p className="text-slate-300 leading-relaxed mb-4">
                "Priya demonstrates exceptional depth in distributed systems. She clearly communicated tradeoffs between microservices and monoliths during the system design phase."
              </p>
              <div className="flex space-x-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center">
                  <Star className="w-3 h-3 mr-1" /> Highly Recommended
                </span>
              </div>
            </div>
          </div>

          {/* Transcript / Video Segment */}
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl">
            <h3 className="text-lg font-semibold text-white mb-6">Key Interview Moments</h3>
            <div className="space-y-4">
              {[
                { time: "14:23", q: "How do you handle race conditions in distributed databases?", tag: "Technical Depth" },
                { time: "28:45", q: "Tell me about a time you disagreed with a product manager.", tag: "Behavioral" }
              ].map((item, i) => (
                <div key={i} className="flex p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-xs font-medium text-indigo-400">{item.tag}</span>
                      <span className="text-xs text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1" />{item.time}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{item.q}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}