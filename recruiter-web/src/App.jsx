import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './utils/api';
import Auth from './Auth';
import Candidates from './Candidates';
import Interviews from './Interviews';
import Compare from './Compare';
import Analytics from './Analytics';
import WSettings from './Settings';
import {
  Briefcase, Users, Calendar, BarChart2,
  Settings, Plus, Sparkles, Video, GitMerge,
  ChevronRight, BrainCircuit, Activity, LogOut, Loader2
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
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
    <div className="h-screen w-20 flex flex-col items-center py-8 bg-slate-900/40 border-r border-white/5 backdrop-blur-xl z-50 justify-between">
      <div className="flex flex-col items-center w-full">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(79,124,255,0.4)] mb-12">
          <BrainCircuit className="text-white w-6 h-6" />
        </div>

        <nav className="w-full flex flex-col items-center space-y-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative group p-3 rounded-2xl transition-all duration-300"
                title={item.label}
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

      <button
        onClick={onLogout}
        className="p-3 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
        title="Logout"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </div>
  );
};

// --- LANDING HERO ---
const LandingHero = ({ onNavigate, recruiterName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hero-glow rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 font-medium mb-6 flex items-center space-x-2"
        >
          <span>Welcome back, {recruiterName || 'Recruiter'}</span>
          <span className="text-xl">👋</span>
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-6xl font-bold text-white tracking-tight mb-6"
        >
          Find Your Next Top Performer <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">with Open-Source AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-lg text-slate-400 mb-12 max-w-2xl"
        >
          Create a job description and let Qwen 2.5 and BGE Embeddings discover, score, interview, and compare the best candidates automatically.
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

        <div className="grid grid-cols-3 gap-6 mt-24 w-full">
          {[
            { icon: BrainCircuit, title: "BGE Embeddings", desc: "True semantic matching. Cosine similarity." },
            { icon: Video, title: "Video Interviews", desc: "Resumable uploads & Whisper transcription." },
            { icon: GitMerge, title: "Qwen 2.5 Grading", desc: "Detailed scorecard & candidate comparison." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              whileHover={{ y: -5, borderColor: 'rgba(79,124,255,0.4)' }}
              className="bg-slate-900/50 border border-white/5 backdrop-blur-md p-6 rounded-3xl flex flex-col items-center text-center transition-colors"
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

// --- CREATE JOB FORM WITH AI INSIGHTS ---
const CreateJobView = ({ onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [experience, setExperience] = useState('2-5 years');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [createdJobId, setCreatedJobId] = useState(null);
  const [scrapingStarted, setScrapingStarted] = useState(false);

  const handleAnalyze = async () => {
    if (!title || !description || !company || !location) {
      alert("Please fill in Job Title, Company, Location, and Description first!");
      return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Save Job
      const job = await api.createJob({
        title,
        company,
        location,
        employmentType,
        experience,
        salary,
        description,
        requiredSkills: [],
        preferredSkills: []
      });

      setCreatedJobId(job._id);

      // 2. Trigger AI Analysis
      const analysis = await api.analyzeJob(job._id);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze job: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFindCandidates = async () => {
    if (!createdJobId) return;
    setScrapingStarted(true);
    try {
      await api.scrapeCandidates(createdJobId);
      onJobCreated(createdJobId);
    } catch (error) {
      console.error(error);
      alert("Failed to trigger candidate search: " + error.message);
      setScrapingStarted(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex h-full w-full"
    >
      {/* Editor Side */}
      <div className="flex-1 p-12 overflow-y-auto space-y-6 border-r border-white/5 bg-slate-950/20">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Create New Role</h2>
          <p className="text-slate-400 text-sm">Write your job details and let Qwen 2.5 extract skills and analyze requirements.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote / San Francisco"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Employment Type</label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Experience Range</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3-5 years"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Salary Range (Optional)</label>
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. $140k - $170k"
            className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and key requirements..."
            rows={10}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none leading-relaxed"
          />
        </div>

        {!aiAnalysis && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Qwen 2.5 Extracting Requirements...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Job Description
              </>
            )}
          </button>
        )}
      </div>

      {/* AI Analysis Panel */}
      <div className="w-[400px] bg-slate-900/40 border-l border-white/5 backdrop-blur-xl p-8 flex flex-col justify-between">
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Sparkles className="text-primary w-5 h-5" />
            <h2 className="text-lg font-medium text-white">Live AI Insights</h2>
          </div>

          {!aiAnalysis ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center py-20">
              <Activity className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Submit the description to extract required skills, seniority, and implicit expectations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seniority & Experience */}
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Seniority & Exp</span>
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold text-lg">{aiAnalysis.seniority?.level}</span>
                  <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    {aiAnalysis.experienceRange?.min}-{aiAnalysis.experienceRange?.max} Yrs
                  </span>
                </div>
              </div>

              {/* Required Skills */}
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Required Skills</span>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.extractedSkills?.map((s, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-medium">
                      {s.skill} ({s.confidence}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Implicit Requirements */}
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Implicit Needs (Qwen Analysis)</span>
                <ul className="space-y-2 text-sm text-slate-300">
                  {aiAnalysis.implicitRequirements?.map((r, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>{r.requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {aiAnalysis && (
          <button
            onClick={handleFindCandidates}
            disabled={scrapingStarted}
            className="w-full py-4 bg-white text-slate-950 font-semibold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {scrapingStarted ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Scraping Public Sources...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                Find Candidates & Build Pipeline
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- PIPELINE DASHBOARD ---
const JobPipelines = ({ jobs, onSelectJob }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Active Job Pipelines</h1>
          <p className="text-slate-400">Manage screening, invitations, and scoring for your active roles.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-slate-900/10">
          <Briefcase className="w-16 h-16 text-slate-700 mb-4" />
          <h3 className="text-xl font-semibold text-white">No active roles</h3>
          <p className="text-slate-500 mt-1 max-w-sm text-center">Create a job description using our AI creator to start building candidate pipelines.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <motion.div
              key={job._id}
              onClick={() => onSelectJob(job)}
              whileHover={{ scale: 1.01, borderColor: 'rgba(79,124,255,0.3)' }}
              className="group bg-slate-900/30 border border-white/5 p-6 rounded-3xl transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">{job.title}</h3>
                  <span className="text-slate-400 text-sm">{job.company}</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {job.location}
                  </span>
                </div>

                <div className="flex space-x-12 text-sm text-slate-400">
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Employment Type</span>
                    <span className="text-white font-medium">{job.employmentType}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Experience Req</span>
                    <span className="text-white font-medium">{job.experience}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 mb-1">Status</span>
                    <span className="text-emerald-400 font-medium">{job.status}</span>
                  </div>
                </div>
              </div>

              <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-slate-400 transition-all duration-300">
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// --- MAIN ENTRY ---
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [recruiterName, setRecruiterName] = useState('');

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const user = api.getCurrentUser();
      if (user) setRecruiterName(user.name);
      loadJobs();
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  const handleJobCreated = (jobId) => {
    loadJobs();
    // Set selected job by ID
    api.getJobDetails(jobId).then(job => {
      setSelectedJob(job);
      setActiveTab('candidates');
    });
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-white overflow-hidden selection:bg-primary/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 relative overflow-hidden flex bg-slate-950">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <LandingHero key="hero" onNavigate={setActiveTab} recruiterName={recruiterName} />
          )}
          {activeTab === 'jobs' && (
            <JobPipelines
              key="jobs"
              jobs={jobs}
              onSelectJob={(job) => {
                setSelectedJob(job);
                setActiveTab('candidates');
              }}
            />
          )}
          {activeTab === 'create-job' && (
            <CreateJobView key="create" onJobCreated={handleJobCreated} />
          )}
          {activeTab === 'candidates' && (
            <Candidates
              key="candidates"
              selectedJob={selectedJob}
              onSelectCandidate={(candidate) => {
                setSelectedCandidate(candidate);
                setActiveTab('interviews');
              }}
            />
          )}
          {activeTab === 'interviews' && (
            <Interviews
              key="interviews"
              selectedCandidate={selectedCandidate}
              selectedJob={selectedJob}
            />
          )}
          {activeTab === 'compare' && (
            <Compare key="compare" selectedJob={selectedJob} />
          )}
          {activeTab === 'analytics' && <Analytics key="analytics" />}
          {activeTab === 'settings' && <WSettings key="settings" />}
        </AnimatePresence>
      </main>
    </div>
  );
}