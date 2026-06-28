import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './utils/api';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { GitMerge, Sparkles, Trophy, ChevronDown, ChevronUp, Star, Award, AlertCircle } from 'lucide-react';

export default function Compare({ selectedJob }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!selectedJob) return;
      try {
        const data = await api.getCandidates(selectedJob._id);
        // Only compare candidates who have been evaluated (i.e. have a matchScore)
        setCandidates(data.filter(c => c.matchScore > 0));
      } catch (error) {
        console.error(error);
      }
    };
    fetchCandidates();
  }, [selectedJob]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) {
        alert("You can compare a maximum of 4 candidates at once.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedCandidates = candidates.filter(c => selectedIds.includes(c._id));

  // Prepare radar chart data
  const getRadarData = () => {
    if (comparedCandidates.length === 0) return [];
    
    return [
      {
        subject: 'Technical Skills',
        ...comparedCandidates.reduce((acc, c) => ({ ...acc, [c.name]: c.scoreBreakdown?.technicalSkills || 50 }), {})
      },
      {
        subject: 'Seniority Fit',
        ...comparedCandidates.reduce((acc, c) => ({ ...acc, [c.name]: c.scoreBreakdown?.seniorityIndicators || 50 }), {})
      },
      {
        subject: 'Domain Exp',
        ...comparedCandidates.reduce((acc, c) => ({ ...acc, [c.name]: c.scoreBreakdown?.domainExperience || 50 }), {})
      },
      {
        subject: 'Avg Relevance',
        ...comparedCandidates.reduce((acc, c) => ({ ...acc, [c.name]: c.interviewAnswers?.length ? Math.round(c.interviewAnswers.reduce((sum, a) => sum + (a.relevance || 0), 0) / c.interviewAnswers.length) : 0 }), {})
      },
      {
        subject: 'Avg Depth',
        ...comparedCandidates.reduce((acc, c) => ({ ...acc, [c.name]: c.interviewAnswers?.length ? Math.round(c.interviewAnswers.reduce((sum, a) => sum + (a.depth || 0), 0) / c.interviewAnswers.length) : 0 }), {})
      }
    ];
  };

  // Generate ranking recommendation
  const getRecommendation = () => {
    if (comparedCandidates.length === 0) return null;
    const sorted = [...comparedCandidates].sort((a, b) => b.matchScore - a.matchScore);
    const top = sorted[0];
    
    let justification = `${top.name} is the strongest fit for this role. `;
    if (top.scoreBreakdown?.technicalSkills > 85) {
      justification += `They demonstrated exceptional technical depth in their interview responses and possess a highly aligned skillset. `;
    }
    if (top.flags?.length === 0) {
      justification += `Furthermore, they present zero red flags, making them a low-risk, high-return hiring choice. `;
    } else {
      justification += `Despite minor flags, their overall score remains the highest in the pipeline. `;
    }

    return {
      name: top.name,
      score: top.matchScore,
      justification
    };
  };

  const rec = getRecommendation();
  const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b'];

  if (!selectedJob) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12">
        <h2 className="text-xl font-medium text-white mb-2">No Job Selected</h2>
        <p className="text-sm">Please select a job from the Dashboard or Jobs tab to compare candidates.</p>
      </div>
    );
  }

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto bg-slate-950">
      <div className="flex items-center space-x-3 mb-8">
        <GitMerge className="text-indigo-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Compare Candidates</h1>
      </div>

      {/* Candidate Selector Bar */}
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl mb-8 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Select Candidates to Compare (2 to 4)</h3>
        {candidates.length === 0 ? (
          <p className="text-slate-500 text-sm">No evaluated candidates available for this job yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {candidates.map((c) => {
              const isSelected = selectedIds.includes(c._id);
              return (
                <button
                  key={c._id}
                  onClick={() => handleToggleSelect(c._id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/25 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                  }`}
                >
                  {c.name} ({c.matchScore}%)
                </button>
              );
            })}
          </div>
        )}
      </div>

      {comparedCandidates.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-slate-900/10 text-slate-500">
          <AlertCircle className="w-12 h-12 mb-4 text-slate-700" />
          <h3 className="text-lg font-semibold text-white">Select more candidates</h3>
          <p className="text-sm mt-1">Please select at least 2 candidates above to perform a side-by-side comparison.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* AI Recommendation Banner */}
          {rec && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/25 p-6 rounded-3xl flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.12)] relative overflow-hidden backdrop-blur-xl"
            >
              <div className="relative z-10 flex items-start space-x-6">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-indigo-300 font-semibold mb-1 flex items-center">
                    AI Recommendation <Trophy className="w-4 h-4 ml-2 text-yellow-500" />
                  </h3>
                  <p className="text-white text-lg font-medium">{rec.name} is the strongest fit.</p>
                  <p className="text-slate-400 mt-1 max-w-2xl text-sm leading-relaxed">{rec.justification}</p>
                </div>
              </div>
              <div className="relative z-10 text-right">
                <span className="block text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {rec.score}%
                </span>
                <span className="text-xs text-indigo-300/80 uppercase tracking-wider font-semibold">Match Confidence</span>
              </div>
            </motion.div>
          )}

          {/* Radar Chart & High Level Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Radar Chart */}
            <div className="lg:col-span-6 bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl h-[400px] flex flex-col">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Semantic Dimension Comparison</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" r="80%" data={getRadarData()}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} axisLine={false} />
                    {comparedCandidates.map((c, idx) => (
                      <Radar
                        key={c._id}
                        name={c.name}
                        dataKey={c.name}
                        stroke={colors[idx]}
                        fill={colors[idx]}
                        fillOpacity={0.15}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Profile Stats Table */}
            <div className="lg:col-span-6 bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl overflow-x-auto">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Pipeline Comparison</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-xs font-semibold text-slate-500 uppercase">Candidate</th>
                    <th className="pb-4 text-xs font-semibold text-slate-500 uppercase text-center">Score</th>
                    <th className="pb-4 text-xs font-semibold text-slate-500 uppercase">Experience</th>
                    <th className="pb-4 text-xs font-semibold text-slate-500 uppercase">Stated Title</th>
                  </tr>
                </thead>
                <tbody>
                  {comparedCandidates.map((c, idx) => (
                    <tr key={c._id} className="border-b border-white/5 last:border-0">
                      <td className="py-4 flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors[idx] }}>
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-sm text-white">{c.name}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-bold text-sm" style={{ color: colors[idx] }}>{c.matchScore}%</span>
                      </td>
                      <td className="py-4 text-sm text-slate-300">{c.experienceYears} Years</td>
                      <td className="py-4 text-sm text-slate-400 max-w-[180px] truncate">{c.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Question-by-Question Parallel Responses */}
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">Parallel Interview Answers</h3>
            <p className="text-slate-400 text-sm mb-6">Expand any question to compare the AI-generated summaries of the candidates' responses side-by-side.</p>

            <div className="space-y-4">
              {comparedCandidates[0]?.interviewQuestions?.map((q, qIdx) => {
                const isExpanded = expandedQuestionIdx === qIdx;
                return (
                  <div key={qIdx} className="border border-white/5 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQuestionIdx(isExpanded ? null : qIdx)}
                      className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-start">
                        <span className="text-indigo-400 font-bold mr-3">{qIdx + 1}.</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{q.question}</p>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">Type: {q.type}</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-slate-950/40"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {comparedCandidates.map((c, idx) => {
                              // Find answer for this question
                              const ans = c.interviewAnswers?.find(a => a.question === q.question);
                              return (
                                <div key={c._id} className="bg-slate-900/40 border border-white/5 p-4 rounded-xl space-y-3">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: colors[idx] }}>
                                        {c.name.charAt(0)}
                                      </div>
                                      <span className="text-xs font-semibold text-white">{c.name}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                      Score: <strong className="text-white">{ans ? Math.round((ans.relevance + ans.depth + ans.clarity) / 3) : 0}%</strong>
                                    </span>
                                  </div>

                                  {ans ? (
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">AI Answer Summary</span>
                                        <p className="text-xs text-slate-300 italic leading-relaxed">
                                          "{ans.summary || 'Summary processing...'}"
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Snippet</span>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                                          {ans.transcription}
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-600 italic">Interview not completed or answer missing.</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}