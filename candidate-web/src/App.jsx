import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, Sparkles, Play, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Camera, Shield, Zap } from 'lucide-react';

const API_BASE_URL = `http://${window.location.hostname}:5000/api/interviews`;
const CHUNK_SIZE = 2 * 1024 * 1024;

/* ─── Glassmorphism Components ─── */
const GlassCard = ({ children, className = '', glowColor = 'indigo' }) => {
  const glowMap = {
    indigo: 'shadow-[0_0_40px_rgba(99,102,241,0.08)] border-indigo-500/10',
    emerald: 'shadow-[0_0_40px_rgba(16,185,129,0.08)] border-emerald-500/10',
    rose: 'shadow-[0_0_40px_rgba(244,63,94,0.08)] border-rose-500/10',
    purple: 'shadow-[0_0_40px_rgba(168,85,247,0.08)] border-purple-500/10',
  };
  return (
    <div className={`bg-white/[0.03] backdrop-blur-2xl border border-white/[0.07] rounded-3xl ${glowMap[glowColor] || ''} ${className}`}>
      {children}
    </div>
  );
};

const StepBadge = ({ current, total }) => (
  <div className="flex items-center space-x-2">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < current ? 'bg-indigo-500 w-6' : i === current ? 'bg-white w-8' : 'bg-white/20 w-3'}`} />
    ))}
  </div>
);

const AnimatedScore = ({ value, color = '#6366f1', size = 96 }) => {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * value) / 100;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
};

const Orb = ({ className }) => (
  <div className={`absolute rounded-full blur-[80px] pointer-events-none opacity-30 ${className}`} />
);

export default function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [step, setStep] = useState('welcome');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timerState, setTimerState] = useState('think');
  const [timeLeft, setTimeLeft] = useState(30);

  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingStatusText, setUploadingStatusText] = useState('');

  const videoPreviewRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const urlToken = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('token');
    if (!urlToken || urlToken === 'interview') {
      setError('Invalid interview link. Please check your invitation email.');
      setLoading(false);
      return;
    }
    setToken(urlToken);
    validateToken(urlToken);
  }, []);

  const validateToken = async (urlToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${urlToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to validate interview token');
      setCandidate(data.candidate);
      setJob(data.job);
      setQuestions(data.questions);
      if (data.candidate.interviewStatus === 'Completed') setStep('success');
      else if (data.candidate.interviewStatus === 'In Progress') determineResumeQuestion(urlToken, data.questions);
    } catch (err) {
      setError(err.message || 'Failed to connect to the interview server.');
    } finally {
      setLoading(false);
    }
  };

  const determineResumeQuestion = async (urlToken, qList) => {
    try {
      for (let i = 0; i < qList.length; i++) {
        const res = await fetch(`${API_BASE_URL}/${urlToken}/upload-status?questionIndex=${i}`);
        const data = await res.json();
        if (!data.uploadedChunks || data.uploadedChunks.length === 0) { setCurrentQIdx(i); break; }
      }
    } catch (e) { console.warn('Failed to determine resume question:', e); }
  };

  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: true });
      setStream(mediaStream);
      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = mediaStream;
      setStep('instructions');
    } catch (err) {
      setError('Camera and Microphone permissions are required to complete this interview.');
    }
  };

  useEffect(() => { return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, [stream]);

  const startInterview = () => { setStep('question'); startThinkTime(); };

  const startThinkTime = () => {
    setTimerState('think');
    setTimeLeft(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); startRecording(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    setTimerState('record');
    setTimeLeft(180);
    chunksRef.current = [];
    try {
      let activeStream = stream;
      if (!activeStream || !activeStream.active) {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(activeStream);
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = activeStream;
      }
      let recorder;
      try { recorder = new MediaRecorder(activeStream, { mimeType: 'video/webm;codecs=vp9,opus' }); }
      catch (e) { recorder = new MediaRecorder(activeStream); }
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => uploadVideoInChunks(new Blob(chunksRef.current, { type: 'video/webm' }));
      recorder.start(2000);
      setMediaRecorder(recorder);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); stopRecording(recorder); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) { setError('Could not start video recorder: ' + err.message); }
  };

  const stopRecording = (activeRecorder = mediaRecorder) => {
    if (activeRecorder?.state !== 'inactive') activeRecorder?.stop();
    clearInterval(timerRef.current);
  };

  const uploadVideoInChunks = async (videoBlob) => {
    setStep('uploading');
    setUploadProgress(0);
    setUploadingStatusText('Preparing your answer...');
    const totalChunks = Math.ceil(videoBlob.size / CHUNK_SIZE);
    let startChunkIndex = 0;
    try {
      const res = await fetch(`${API_BASE_URL}/${token}/upload-status?questionIndex=${currentQIdx}`);
      const data = await res.json();
      const uploaded = data.uploadedChunks || [];
      while (uploaded.includes(startChunkIndex)) startChunkIndex++;
    } catch (e) { console.warn('Failed to fetch upload status', e); }

    for (let i = startChunkIndex; i < totalChunks; i++) {
      const chunkBlob = videoBlob.slice(i * CHUNK_SIZE, Math.min(videoBlob.size, (i + 1) * CHUNK_SIZE));
      const formData = new FormData();
      formData.append('chunk', chunkBlob, 'chunk.webm');
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));
      formData.append('questionIndex', String(currentQIdx));
      let success = false, retries = 0;
      while (!success && retries < 5) {
        try {
          setUploadingStatusText(`Uploading part ${i + 1} of ${totalChunks}...`);
          const res = await fetch(`${API_BASE_URL}/${token}/upload-chunk`, { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Upload failed');
          success = true;
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
        } catch (err) {
          retries++;
          setUploadingStatusText(`Retrying... (${retries}/5)`);
          await new Promise(r => setTimeout(r, 2000 * retries));
        }
      }
      if (!success) { setError('Network connection failed. Your progress is saved — please retry.'); return; }
    }
    if (currentQIdx < questions.length - 1) { setCurrentQIdx(prev => prev + 1); setStep('question'); startThinkTime(); }
    else setStep('review');
  };

  const submitInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${token}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Submission failed');
      if (stream) stream.getTracks().forEach(t => t.stop());
      setStep('success');
    } catch (err) {
      setError('Failed to submit interview: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Loading ─── */
  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">
      <Orb className="w-96 h-96 bg-indigo-600 top-1/4 left-1/4" />
      <Orb className="w-64 h-64 bg-purple-600 bottom-1/4 right-1/4" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
          <Video className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Loading your interview session...</p>
      </div>
    </div>
  );

  /* ─── Error ─── */
  if (error && step !== 'uploading') return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden p-6">
      <Orb className="w-96 h-96 bg-rose-900 top-1/3 left-1/3" />
      <GlassCard className="relative z-10 p-10 max-w-md text-center" glowColor="rose">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">{error}</p>
        <button onClick={() => { setError(''); validateToken(token); }}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity">
          Retry Connection
        </button>
      </GlassCard>
    </div>
  );

  /* ─── Main App ─── */
  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient background orbs */}
      <Orb className="w-[600px] h-[600px] bg-indigo-900/60 -top-48 -left-48" />
      <Orb className="w-[500px] h-[500px] bg-purple-900/40 top-1/2 -right-32" />
      <Orb className="w-[400px] h-[400px] bg-blue-900/30 bottom-0 left-1/3" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.05] backdrop-blur-2xl bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white">TalentScreen</span>
              <span className="text-indigo-400 font-bold text-sm"> AI</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {job && (
              <span className="hidden sm:flex text-xs text-slate-400 bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-lg items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{job.title} · {job.company}</span>
              </span>
            )}
            {step === 'question' && (
              <StepBadge current={currentQIdx} total={questions.length} />
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-73px)] p-6">
        <AnimatePresence mode="wait">

          {/* ── WELCOME ── */}
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl w-full">
              <div className="text-center mb-10">
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Powered Video Interview</span>
                </motion.span>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-5xl font-bold bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight mb-4">
                  Welcome, {candidate?.name?.split(' ')[0] || 'Candidate'}! 👋
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-slate-400 text-lg leading-relaxed">
                  You've been shortlisted for the <span className="text-white font-semibold">{job?.title}</span> role at <span className="text-indigo-400 font-semibold">{job?.company}</span>.
                </motion.p>
              </div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <GlassCard className="p-6 mb-6">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">What to Expect</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: '🎯', label: 'Questions', value: `${questions.length} total` },
                      { icon: '⏱', label: 'Think Time', value: '30 sec each' },
                      { icon: '🎬', label: 'Max Answer', value: '3 min each' },
                    ].map((item, i) => (
                      <div key={i} className="text-center bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06]">
                        <span className="text-2xl block mb-2">{item.icon}</span>
                        <span className="text-xs text-slate-500 block">{item.label}</span>
                        <span className="text-sm font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { icon: Shield, text: 'Secure & Private', color: 'text-emerald-400' },
                    { icon: Zap, text: 'AI-Powered Analysis', color: 'text-indigo-400' },
                    { icon: Camera, text: 'Video Recording', color: 'text-purple-400' },
                  ].map(({ icon: Icon, text, color }, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-slate-400 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5">
                      <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => setStep('permissions')}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] flex items-center justify-center text-lg">
                  Begin Interview <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ── PERMISSIONS ── */}
          {step === 'permissions' && (
            <motion.div key="permissions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="max-w-md w-full">
              <GlassCard className="p-10 text-center" glowColor="purple">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Camera & Mic Access</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  This interview requires your camera and microphone. Please click <em>Allow</em> when your browser asks for permission.
                </p>
                <div className="space-y-3 text-left mb-8">
                  {['Your video is encrypted in transit', 'Only the hiring team can view recordings', 'You can end the session at any time'].map((t, i) => (
                    <div key={i} className="flex items-center space-x-3 text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <button onClick={requestPermissions}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  Grant Access & Continue
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ── INSTRUCTIONS ── */}
          {step === 'instructions' && (
            <motion.div key="instructions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-md w-full">
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold mb-6">How it works</h2>
                <div className="space-y-5 mb-8">
                  {[
                    { n: 1, title: '30s Think Time', desc: 'Read the question. Plan your answer calmly — no pressure.' },
                    { n: 2, title: 'Auto Recording', desc: 'Recording starts automatically when think time ends, or sooner if you choose.' },
                    { n: 3, title: '3 Min Max', desc: 'Answer naturally. Quality matters more than length. Submit early if done.' },
                    { n: 4, title: 'Instant Upload', desc: 'Your answer is securely uploaded in chunks immediately after you finish.' },
                  ].map(({ n, title, desc }) => (
                    <div key={n} className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-sm font-bold flex items-center justify-center shrink-0">{n}</div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={startInterview}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <Play className="w-4 h-4 mr-2 fill-white" /> I'm Ready — Start Interview
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ── QUESTION + RECORDING ── */}
          {step === 'question' && (
            <motion.div key={`question-${currentQIdx}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Question + Timer */}
              <div className="lg:col-span-5 space-y-5">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Question {currentQIdx + 1} / {questions.length}
                    </span>
                    <StepBadge current={currentQIdx} total={questions.length} />
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">
                    {questions[currentQIdx]?.question}
                  </h2>
                  {questions[currentQIdx]?.type && (
                    <span className="inline-flex items-center mt-3 text-xs font-medium text-slate-500 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full">
                      {questions[currentQIdx].type}
                    </span>
                  )}
                </GlassCard>

                {/* Timer Card */}
                <GlassCard className={`p-6 transition-all duration-500 ${timerState === 'record' ? 'border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.08)]' : ''}`}
                  glowColor={timerState === 'record' ? 'rose' : 'indigo'}>
                  {timerState === 'think' ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4 relative">
                        <AnimatedScore value={(timeLeft / 30) * 100} color="#6366f1" size={100} />
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">{timeLeft}</span>
                          <span className="text-[10px] text-slate-500">seconds</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">Think time — compose your answer</p>
                      <button onClick={() => { clearInterval(timerRef.current); startRecording(); }}
                        className="w-full py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors border border-indigo-500/30">
                        Skip & Start Recording
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Recording</span>
                      </div>
                      <div className="flex items-center justify-center mb-4 relative">
                        <AnimatedScore value={(timeLeft / 180) * 100} color="#f43f5e" size={100} />
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-bold text-white">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </span>
                          <span className="text-[10px] text-slate-500">remaining</span>
                        </div>
                      </div>
                      <button onClick={() => stopRecording()}
                        className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 text-sm font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                        ✓ Submit Answer
                      </button>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Right: Video Preview */}
              <div className="lg:col-span-7">
                <div className="aspect-video bg-slate-900/60 rounded-3xl overflow-hidden border border-white/[0.07] relative backdrop-blur-sm">
                  <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  {timerState === 'think' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                      <div className="text-center">
                        <Clock className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                        <p className="text-xs text-slate-400">Recording starts in {timeLeft}s</p>
                      </div>
                    </div>
                  )}
                  {timerState === 'record' && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>REC</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-xs text-slate-300 font-medium">
                    {candidate?.name} — Q{currentQIdx + 1}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── UPLOADING ── */}
          {step === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="max-w-sm w-full">
              <GlassCard className="p-10 text-center" glowColor="indigo">
                <div className="relative flex items-center justify-center mb-6 mx-auto" style={{ width: 112, height: 112 }}>
                  <AnimatedScore value={uploadProgress} color="#6366f1" size={112} />
                  <span className="absolute text-xl font-bold text-white">{uploadProgress}%</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Saving Your Answer</h2>
                <p className="text-slate-400 text-sm mb-3">{uploadingStatusText}</p>
                <p className="text-xs text-slate-600">Do not close this window — your progress is auto-saved.</p>
              </GlassCard>
            </motion.div>
          )}

          {/* ── REVIEW & SUBMIT ── */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-md w-full">
              <GlassCard className="p-10 text-center" glowColor="emerald">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3">All {questions.length} Questions Done!</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Every answer is securely saved. Submit now to send your interview to the hiring team at <strong>{job?.company}</strong>.
                </p>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-8 text-left space-y-2">
                  {questions.map((q, i) => (
                    <div key={i} className="flex items-center space-x-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-400 truncate">Q{i + 1}: {q.question?.slice(0, 55)}...</span>
                    </div>
                  ))}
                </div>
                <button onClick={submitInterview}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  Submit Interview ✓
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(99,102,241,0.5)]">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-4">
                Interview Complete!
              </h1>
              <p className="text-slate-400 text-base leading-relaxed mb-10">
                Your responses have been submitted to <strong className="text-white">{job?.company || 'the hiring team'}</strong>. Expect to hear back within 3–5 business days. You may close this window.
              </p>
              <GlassCard className="p-6 text-left" glowColor="purple">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">What happens next</h3>
                <div className="space-y-3">
                  {['AI analysis of your interview responses', 'Recruiter review of your scorecard', 'Decision communicated via email'].map((t, i) => (
                    <div key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">{i + 1}</div>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-5 px-6 text-center text-xs text-slate-700 border-t border-white/[0.04]">
        © 2026 TalentScreen AI · Secured with end-to-end chunked upload · Interview ID: {token?.slice(0, 12)}...
      </footer>
    </div>
  );
}
