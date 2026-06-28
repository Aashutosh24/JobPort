import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BarChart2 } from 'lucide-react';

const data = [
  { name: 'Week 1', candidates: 400, matches: 240 },
  { name: 'Week 2', candidates: 600, matches: 398 },
  { name: 'Week 3', candidates: 850, matches: 580 },
  { name: 'Week 4', candidates: 1200, matches: 890 },
];

export default function Analytics() {
  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center space-x-3 mb-12">
        <BarChart2 className="text-indigo-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Conversion Funnel / Area Chart */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Candidate Velocity & AI Matches</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tick={{fill: '#94a3b8'}} axisLine={false} />
                <YAxis stroke="#475569" tick={{fill: '#94a3b8'}} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="candidates" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCandidates)" />
                <Area type="monotone" dataKey="matches" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorMatches)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hiring Conversion */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-6">Pipeline Conversion</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { stage: 'Sourced', count: 1200 },
                { stage: 'Matched', count: 890 },
                { stage: 'Interviewed', count: 150 },
                { stage: 'Offers', count: 12 }
              ]} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}