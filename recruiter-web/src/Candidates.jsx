import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './utils/api';
import { ShieldAlert, CheckCircle2, ChevronRight, Loader2, Check, X, RefreshCw, Mail, Link2, Copy, AlertCircle } from 'lucide-react';

const CandidateCard = ({ candidate, onStatusUpdate, onInviteTrigger, onViewDetails, delay }) => {
  const { name, title, company, matchScore, skills, scoreBreakdown, redFlags, strengths, aiRecommendation, isSynthetic, status, interviewStatus, source, overallRank, percentile, _id } = candidate;
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
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 p-0.5">
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
            <p className="text-slate-500 text-xs flex items-center gap-2 flex-wrap">
              {company || 'Public Profile'}
              {source && <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wide">{source}</span>}
              {isSynthetic && <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wide">Synthetic Profile</span>}
            </p>
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
        {/* Detailed Breakdown */}
        {scoreBreakdown && (
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Technical Fit</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.technicalFit || 0}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Experience</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.experienceMatch || 0}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Domain</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.domainMatch || 0}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Resume</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.resumeQuality || 0}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Communication</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.communicationPrediction || 0}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white/5 rounded-lg">
              <span className="text-slate-400">Location</span>
              <span className="text-indigo-400 font-medium">{scoreBreakdown.locationMatch || 0}%</span>
            </div>
          </div>
        )}

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
        
        {strengths && strengths.length > 0 && (
          <div className="flex items-start space-x-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl mt-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[11px] text-emerald-400 font-medium">Strengths: {strengths.join(", ")}</span>
            </div>
          </div>
        )}

        {redFlags && redFlags.length > 0 && (
          <div className="flex items-start space-x-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl mt-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <div className="flex flex-col">
              {redFlags.map((flag, i) => (
                <span key={i} className="text-[11px] text-rose-400 leading-relaxed">⚠ {flag.reason}</span>
              ))}
            </div>
          </div>
        )}

        {aiRecommendation && (
          <div className="mt-3 text-center">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              aiRecommendation === 'Highly Recommended' ? 'bg-emerald-500/20 text-emerald-400' :
              aiRecommendation === 'Recommended' ? 'bg-indigo-500/20 text-indigo-400' :
              aiRecommendation === 'Reject' ? 'bg-rose-500/20 text-rose-400' :
              'bg-slate-700 text-slate-300'
            }`}>
              AI: {aiRecommendation}
            </span>
            {(overallRank || percentile !== undefined) && (
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-center gap-2 flex-wrap">
                {overallRank && <span>Rank #{overallRank}</span>}
                {percentile !== undefined && <span>Top {100 - percentile}% of applicants</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 pt-4 border-t border-white/5">
        {interviewStatus === 'Not Invited' ? (
          <button
            onClick={() => onInviteTrigger(candidate)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center"
          >
            Invite to Interview
          </button>
        ) : (
          <button
            onClick={onViewDetails}
            className="flex-1 text-center py-2.5 bg-white/5 border border-white/5 text-xs font-medium text-indigo-400 rounded-xl hover:bg-white/10 transition-all"
          >
            Interview {interviewStatus}
          </button>
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
          {loadingAction === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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
          {loadingAction === 'status' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
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

  // Invitation Modal State
  const [inviteCandidate, setInviteCandidate] = useState(null);
  const [emailOption, setEmailOption] = useState('candidate'); // candidate, recruiter, custom
  const [customEmail, setCustomEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null); // stores link on success
  const [copied, setCopied] = useState(false);

  const recruiterEmail = api.getCurrentUser()?.email || 'admin@talent.ai';

  const fetchCandidates = async (showLoading = true) => {
    if (!selectedJob) return;
    if (showLoading) setLoading(true);
    try {
      const data = await api.getCandidates(selectedJob._id);
      setCandidates(data);
      
      const isAnyProcessing = data.some(c => c.processingStatus === 'Processing' || c.processingStatus === 'Pending');
      setScraping(isAnyProcessing);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJob]);

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

  const handleSendInvite = async () => {
    if (!inviteCandidate) return;

    let targetEmail = inviteCandidate.email;
    if (emailOption === 'recruiter') {
      targetEmail = recruiterEmail;
    } else if (emailOption === 'custom') {
      if (!customEmail) {
        alert("Please enter a custom email address.");
        return;
      }
      targetEmail = customEmail;
    }

    setInviting(true);
    try {
      const res = await api.inviteCandidate(inviteCandidate._id, targetEmail);
      setInviteSuccess(res.webFallbackUrl);
      fetchCandidates(false);
    } catch (error) {
      alert("Failed to send invitation: " + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteSuccess) return;
    navigator.clipboard.writeText(inviteSuccess);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto bg-slate-950 relative">
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
              onInviteTrigger={(c) => {
                setInviteCandidate(c);
                setEmailOption('candidate');
                setInviteSuccess(null);
              }}
              onViewDetails={() => onSelectCandidate(candidate)}
              delay={i * 0.05} 
            />
          ))}
        </div>
      )}

      {/* INVITATION MODAL */}
      <AnimatePresence>
        {inviteCandidate && (
          <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setInviteCandidate(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {!inviteSuccess ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                    <Mail className="w-5 h-5 mr-2.5 text-indigo-400" /> Invite to Video Interview
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    Configure who receives the interview invitation link for <strong>{inviteCandidate.name}</strong>.
                  </p>

                  <div className="space-y-4 mb-6">
                    {/* Option 1: Candidate Email */}
                    <label className="flex items-start p-3.5 bg-slate-950/50 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                      <input 
                        type="radio" 
                        name="emailOpt" 
                        checked={emailOption === 'candidate'} 
                        onChange={() => setEmailOption('candidate')}
                        className="mt-1 mr-3 accent-indigo-500" 
                      />
                      <div>
                        <span className="text-sm font-semibold text-white block">Send to Candidate's Email</span>
                        <span className="text-xs text-slate-500">{inviteCandidate.email}</span>
                      </div>
                    </label>

                    {/* Option 2: Recruiter Email */}
                    <label className="flex items-start p-3.5 bg-slate-950/50 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                      <input 
                        type="radio" 
                        name="emailOpt" 
                        checked={emailOption === 'recruiter'} 
                        onChange={() => setEmailOption('recruiter')}
                        className="mt-1 mr-3 accent-indigo-500" 
                      />
                      <div>
                        <span className="text-sm font-semibold text-white block">Send to My Recruiter Email (Testing)</span>
                        <span className="text-xs text-slate-500">{recruiterEmail}</span>
                      </div>
                    </label>

                    {/* Option 3: Custom Email */}
                    <label className="flex flex-col p-3.5 bg-slate-950/50 border border-white/5 rounded-xl cursor-pointer hover:border-white/10 transition-colors">
                      <div className="flex items-start mb-2">
                        <input 
                          type="radio" 
                          name="emailOpt" 
                          checked={emailOption === 'custom'} 
                          onChange={() => setEmailOption('custom')}
                          className="mt-1 mr-3 accent-indigo-500" 
                        />
                        <span className="text-sm font-semibold text-white">Send to Custom Email</span>
                      </div>
                      {emailOption === 'custom' && (
                        <input 
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="test@example.com"
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 mt-2"
                        />
                      )}
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setInviteCandidate(null)}
                      className="flex-1 py-3 border border-white/5 bg-white/5 text-slate-300 text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendInvite}
                      disabled={inviting}
                      className="flex-1 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invitation'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Invitation Sent!</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    The video interview link has been generated and sent. You can also copy it directly below:
                  </p>

                  <div className="bg-slate-950/60 border border-white/5 p-3 rounded-2xl flex items-center justify-between mb-8">
                    <Link2 className="w-4 h-4 text-indigo-400 shrink-0 mr-2" />
                    <span className="text-xs text-slate-300 truncate flex-1 text-left select-all">
                      {inviteSuccess}
                    </span>
                    <button 
                      onClick={handleCopyLink}
                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg ml-2 shrink-0 transition-colors"
                      title="Copy Link"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => setInviteCandidate(null)}
                    className="w-full py-3 bg-white text-slate-950 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}