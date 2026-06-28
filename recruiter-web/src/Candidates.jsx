import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from './utils/api';
import { ShieldAlert, CheckCircle2, ChevronRight, FileText, Loader2, Play, Check, X, RefreshCw } from 'lucide-react';

const CandidateCard = ({ candidate, onStatusUpdate, onInvite, onViewDetails, delay }) => {
  const { name, title, company, matchScore, skills, flags, status, interviewStatus, _id } = candidate;
  const [loadingAction, setLoadingAction] = useState(null);

  const handleStatusChange = async (newStatus) => {
    setLoadingAction('status');
    try {
      await onStatusUpdate(_id, newStatus);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async () => {
    setLoadingAction('invite');
    try {
      await onInvite(_id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative p-6 rounded-3xl border bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
        matchScore > 85 ? 'border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.08)]' : 'border-white/5 hover:border-white/10'
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
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold text-white">{name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {status}
              </span>
            </div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-slate-500 text-xs">{company || 'Public Profile'}</p>
          </div>
        </div>

        {/* AI Match Ring */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
            <circle 
              cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
              strokeDasharray={175} 
              strokeDashoffset={175 - (175 * matchScore) / 100}
              className={`${matchScore > 85 ? 'text-emerald-500' : 'text-indigo-500'} transition-all duration-1000`} 
            />
          </svg>
          <span className="absolute text-sm font-bold text-white">{matchScore}%</span>
        </div>
      </div>

      {/* Skills & Flags */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 5).map((skill, i) => (
            <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
              {skill}
            </span>
          ))}
          {skills.length > 5 && (
            <span className="px-2 py-1 bg-white/5 text-slate-500 rounded-lg text-xs font-medium">
              +{skills.length - 5} more
            </span>
          )}
        </div>
        
        {flags && flags.length > 0 && (
          <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              {flags.map((flag, i) => (
                <span key={i} className="text-[11px] text-rose-400 leading-relaxed">{flag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-white/5">
        {interviewStatus === 'Not Invited' ? (
          <button
            onClick={handleInvite}
            disabled={loadingAction === 'invite'}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center"
          >
            {loadingAction === 'invite' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Invite to Interview'
            )}
          </button>
        ) : (
          <div className="flex-1 text-center py-2.5 bg-white/5 border border-white/5 text-xs font-medium text-indigo-400 rounded-xl">
            Interview {interviewStatus}
          </div>
        )}

        {/* Shortlist/Reject manual overrides */}
        <button
          onClick={() => handleStatusChange(status === 'Shortlisted' ? 'Applied' : 'Shortlisted')}
          disabled={loadingAction === 'status'}
          className={`p-2.5 rounded-xl border transition-all ${
            status === 'Shortlisted' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-white/5 text-slate-400 border-white/5 hover:border-emerald-500/20 hover:text-emerald-400'
          }`}
          title="Shortlist Candidate"
        >
          <Check className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleStatusChange(status === 'Rejected' ? 'Applied' : 'Rejected')}
          disabled={loadingAction === 'status'}
          className={`p-2.5 rounded-xl border transition-all ${
            status === 'Rejected' 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
              : 'bg-white/5 text-slate-400 border-white/5 hover:border-rose-500/20 hover:text-rose-400'
          }`}
          title="Reject Candidate"
        >
          <X className="w-4 h-4" />
        </button>

        <button
          onClick={onViewDetails}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 transition-colors"
          title="View Details / Interview"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default function Candidates({ selectedJob, onSelectCandidate }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);

  const fetchCandidates = async (showLoading = true) => {
    if (!selectedJob) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.getCandidates(selectedJob._id);
      setCandidates(data);
      
      // If any candidate is currently processing, keep scraping/processing state active
      const isAnyProcessing = data.some(c => c.processingStatus === 'Processing' || c.processingStatus === 'Pending');
      if (isAnyProcessing) {
        setScraping(true);
      } else {
        setScraping(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJob]);

  // Polling for candidate updates while scraping is running
  useEffect(() => {
    let interval;
    if (scraping && selectedJob) {
      interval = setInterval(() => {
        fetchCandidates(false);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [scraping, selectedJob]);

  const handleStatusUpdate = async (candidateId, newStatus) => {
    try {
      const updated = await api.updateCandidateStatus(candidateId, newStatus);
      setCandidates(prev => prev.map(c => c._id === candidateId ? updated : c));
    } catch (error) {
      alert("Failed to update status: " + error.message);
    }
  };

  const handleInvite = async (candidateId) => {
    try {
      const res = await api.inviteCandidate(candidateId);
      alert(`Invitation email sent! \n\nWeb Fallback Link: ${res.webFallbackUrl}`);
      // Refresh candidates list
      fetchCandidates(false);
    } catch (error) {
      alert("Failed to send invitation: " + error.message);
    }
  };

  const handleScrape = async () => {
    if (!selectedJob) return;
    setScraping(true);
    try {
      await api.scrapeCandidates(selectedJob._id);
    } catch (error) {
      console.error(error);
      setScraping(false);
    }
  };

  if (!selectedJob) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12">
        <h2 className="text-xl font-medium text-white mb-2">No Job Selected</h2>
        <p className="text-sm">Please select a job from the Dashboard or Jobs tab to view its candidate pipeline.</p>
      </div>
    );
  }

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto bg-slate-950">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 font-medium mb-3 inline-block">
            {selectedJob.company}
          </span>
          <h1 className="text-3xl font-bold text-white mb-2">{selectedJob.title} - Pipeline</h1>
          <p className="text-slate-400 text-sm">Review, shortlist, and invite candidates sourced from public repositories & web profiles.</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => fetchCandidates(true)}
            className="p-2.5 bg-slate-900 border border-white/5 text-slate-400 rounded-xl hover:bg-white/5 hover:text-white transition-all"
            title="Refresh Pipeline"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleScrape}
            disabled={scraping}
            className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-indigo-800 transition-all flex items-center"
          >
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping & Scoring Profiles...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Trigger Candidate Search
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-slate-900/10">
          <Loader2 className={`w-12 h-12 text-slate-600 mb-4 ${scraping ? 'animate-spin text-primary' : ''}`} />
          <h3 className="text-lg font-semibold text-white">
            {scraping ? 'Scraping public sources...' : 'No candidates in pipeline'}
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm text-center">
            {scraping 
              ? 'AI is currently scraping GitHub and search engines to populate this pipeline. This takes about 15-30 seconds.' 
              : 'Click "Trigger Candidate Search" above to scrape and evaluate candidate profiles.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, i) => (
            <CandidateCard 
              key={candidate._id} 
              candidate={candidate} 
              onStatusUpdate={handleStatusUpdate}
              onInvite={handleInvite}
              onViewDetails={() => onSelectCandidate(candidate)}
              delay={i * 0.05} 
            />
          ))}
        </div>
      )}
    </div>
  );
}