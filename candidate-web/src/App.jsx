import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, ShieldAlert, Sparkles, Play, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const API_BASE_URL = "http://localhost:5000/api/interviews";
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

export default function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Interview state
  const [step, setStep] = useState('welcome'); // welcome, permissions, instructions, question, uploading, review, success
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  
  // Timer states
  const [timerState, setTimerState] = useState('think'); // think, record
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Media states
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingStatusText, setUploadingStatusText] = useState('');

  const videoPreviewRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // 1. Parse Token from URL on mount
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const urlToken = pathParts[pathParts.length - 1] || new URLSearchParams(window.location.search).get('token');
    
    if (!urlToken || urlToken === 'interview') {
      // Fallback for testing: if no token in URL, try to load a default or show error
      setError("Invalid interview link. Please check your invitation email.");
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
      if (!res.ok) throw new Error(data.message || "Failed to validate interview token");
      
      setCandidate(data.candidate);
      setJob(data.job);
      setQuestions(data.questions);

      // Check if candidate already finished
      if (data.candidate.interviewStatus === 'Completed') {
        setStep('success');
      } else if (data.candidate.interviewStatus === 'In Progress') {
        // Find the first unanswered question by checking upload status
        determineResumeQuestion(urlToken, data.questions);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the interview server.");
    } finally {
      setLoading(false);
    }
  };

  const determineResumeQuestion = async (urlToken, qList) => {
    try {
      for (let i = 0; i < qList.length; i++) {
        const res = await fetch(`${API_BASE_URL}/${urlToken}/upload-status?questionIndex=${i}`);
        const data = await res.json();
        // If no chunks are uploaded or it's incomplete, resume from here
        if (!data.uploadedChunks || data.uploadedChunks.length === 0) {
          setCurrentQIdx(i);
          break;
        }
      }
    } catch (e) {
      console.warn("Failed to determine resume question:", e);
    }
  };

  // 2. Request Camera & Mic Permissions
  const requestPermissions = async () => {
    setPermissionState('prompt');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      setPermissionState('granted');
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
      setStep('instructions');
    } catch (err) {
      console.error(err);
      setPermissionState('denied');
      setError("Camera and Microphone permissions are required to complete this interview.");
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // 3. Start Interview
  const startInterview = () => {
    setStep('question');
    startThinkTime();
  };

  // 4. Timer Controls
  const startThinkTime = () => {
    setTimerState('think');
    setTimeLeft(30);
    clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    setTimerState('record');
    setTimeLeft(180); // 3 minutes max
    chunksRef.current = [];
    setRecordedChunks([]);

    try {
      // Re-acquire stream if lost
      let activeStream = stream;
      if (!activeStream || !activeStream.active) {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(activeStream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = activeStream;
        }
      }

      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder;
      try {
        recorder = new MediaRecorder(activeStream, options);
      } catch (e) {
        recorder = new MediaRecorder(activeStream); // fallback MIME type
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
        uploadVideoInChunks(videoBlob);
      };

      // Record in 2-second slices so chunks are gathered continuously
      recorder.start(2000);
      setMediaRecorder(recorder);

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            stopRecording(recorder);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setError("Could not start video recorder: " + err.message);
    }
  };

  const stopRecording = (activeRecorder = mediaRecorder) => {
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.stop();
    }
    clearInterval(timerRef.current);
  };

  // 5. Chunked Uploading with Resume-on-Failure
  const uploadVideoInChunks = async (videoBlob) => {
    setStep('uploading');
    setUploadProgress(0);
    setUploadingStatusText('Preparing video files...');

    const totalChunks = Math.ceil(videoBlob.size / CHUNK_SIZE);
    
    // Validate already uploaded chunks in case of connection recovery
    let startChunkIndex = 0;
    try {
      const res = await fetch(`${API_BASE_URL}/${token}/upload-status?questionIndex=${currentQIdx}`);
      const data = await res.json();
      const uploaded = data.uploadedChunks || [];
      // Resume from the first missing chunk index
      while (uploaded.includes(startChunkIndex)) {
        startChunkIndex++;
      }
    } catch (e) {
      console.warn("Failed to fetch upload status, starting from chunk 0", e);
    }

    for (let i = startChunkIndex; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(videoBlob.size, start + CHUNK_SIZE);
      const chunkBlob = videoBlob.slice(start, end);
      
      const formData = new FormData();
      formData.append('chunk', chunkBlob, 'chunk.webm');
      formData.append('chunkIndex', String(i));
      formData.append('totalChunks', String(totalChunks));
      formData.append('questionIndex', String(currentQIdx));

      let success = false;
      let retries = 0;
      const maxRetries = 5;

      while (!success && retries < maxRetries) {
        try {
          setUploadingStatusText(`Uploading chunk ${i + 1}/${totalChunks}...`);
          const res = await fetch(`${API_BASE_URL}/${token}/upload-chunk`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error("Upload failed");
          
          success = true;
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
        } catch (err) {
          retries++;
          setUploadingStatusText(`Connection lost. Retrying chunk ${i + 1} (Attempt ${retries}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 2000 * retries)); // exponential backoff
        }
      }

      if (!success) {
        setError("Network connection failed. We saved your progress. Please check your internet connection and click retry.");
        return;
      }
    }

    // Question complete, move to next or review
    if (currentQIdx < questions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
      setStep('question');
      startThinkTime();
    } else {
      setStep('review');
    }
  };

  // 6. Final Submit
  const submitInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error("Submission failed");
      
      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      setStep('success');
    } catch (err) {
      setError("Failed to submit interview: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-slate-400">Loading interview details...</p>
      </div>
    );
  }

  if (error && step !== 'uploading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 bg-rose-500/15 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-6">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">An Error Occurred</h2>
        <p className="text-slate-400 text-center max-w-md mb-8">{error}</p>
        <button 
          onClick={() => { setError(''); validateToken(token); }}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-white relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hero-glow rounded-full blur-[140px] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/20 backdrop-blur-xl py-5 px-8 relative z-10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Video className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-sm">TalentScreen AI</span>
        </div>
        {job && (
          <span className="text-xs text-slate-400 font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            {job.title} • {job.company}
          </span>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* WELCOME SCREEN */}
          {step === 'welcome' && (
            <motion.div 
              key="welcome" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center max-w-xl flex flex-col items-center"
            >
              <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 font-semibold mb-6 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Shortlisted Candidate Interview
              </span>
              <h1 className="text-4xl font-bold text-white mb-4">
                Hi {candidate?.name || 'Candidate'}, Welcome!
              </h1>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                You have been invited to complete a short asynchronous video interview for the <strong>{job?.title}</strong> role at <strong>{job?.company}</strong>.
              </p>

              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl text-left w-full space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Interview Details</h3>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Questions</span>
                  <strong>{questions.length} Questions</strong>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Think Time</span>
                  <strong>30 seconds per question</strong>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Max Duration</span>
                  <strong>3 minutes per answer</strong>
                </div>
              </div>

              <button
                onClick={() => setStep('permissions')}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-full shadow-[0_0_30px_rgba(79,124,255,0.3)] hover:bg-primary/90 transition-all flex items-center"
              >
                Let's Get Started <Play className="w-4 h-4 ml-2 fill-white" />
              </button>
            </motion.div>
          )}

          {/* PERMISSIONS SCREEN */}
          {step === 'permissions' && (
            <motion.div 
              key="permissions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center max-w-md flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6">
                <Mic className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Enable Camera & Microphone</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                This interview requires video and audio recording. Please grant camera and microphone access when prompted by your browser.
              </p>
              
              <button
                onClick={requestPermissions}
                className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all"
              >
                Grant Permissions
              </button>
            </motion.div>
          )}

          {/* INSTRUCTIONS */}
          {step === 'instructions' && (
            <motion.div 
              key="instructions" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-md text-center flex flex-col items-center"
            >
              <h2 className="text-2xl font-bold mb-4">Interview Instructions</h2>
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl text-left space-y-4 mb-8">
                <div className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-slate-300">You will see each question on the screen. You have 30 seconds to think about your answer.</p>
                </div>
                <div className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-slate-300">Recording starts automatically after the think time, or when you click "Start Recording".</p>
                </div>
                <div className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-slate-300">You have up to 3 minutes to answer. Once submitted, answers cannot be re-recorded.</p>
                </div>
              </div>

              <button
                onClick={startInterview}
                className="px-8 py-3.5 bg-primary text-white font-semibold rounded-xl shadow-[0_0_25px_rgba(79,124,255,0.2)] hover:bg-primary/90 transition-all"
              >
                I'm Ready, Start
              </button>
            </motion.div>
          )}

          {/* RECORDING / QUESTION INTERFACE */}
          {step === 'question' && (
            <motion.div 
              key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              {/* Question & Timer Panel */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block mb-1">
                    Question {currentQIdx + 1} of {questions.length}
                  </span>
                  <h2 className="text-2xl font-bold text-white leading-snug">
                    {questions[currentQIdx]?.question}
                  </h2>
                </div>

                <div className="bg-slate-900/60 border border-white/5 p-6 rounded-2xl">
                  {timerState === 'think' ? (
                    <div className="space-y-3 text-center">
                      <span className="text-xs text-slate-400 uppercase tracking-wider block">Thinking Time Left</span>
                      <strong className="text-4xl text-indigo-400 font-bold block">{timeLeft}s</strong>
                      <button
                        onClick={() => stopRecording()} // stops think timer and starts recording
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all"
                      >
                        Skip & Start Recording
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs text-rose-400 uppercase tracking-wider font-semibold">Recording Answer</span>
                      </div>
                      <strong className="text-4xl text-white font-bold block">
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                      </strong>
                      <button
                        onClick={() => stopRecording()}
                        className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all"
                      >
                        Submit Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Panel */}
              <div className="md:col-span-7 aspect-video bg-slate-950 rounded-3xl overflow-hidden border border-white/5 relative">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {timerState === 'record' && (
                  <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>REC</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* UPLOADING SCREEN */}
          {step === 'uploading' && (
            <motion.div 
              key="uploading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center max-w-md flex flex-col items-center"
            >
              <div className="relative flex items-center justify-center w-24 h-24 mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                  <circle 
                    cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={264} 
                    strokeDashoffset={264 - (264 * uploadProgress) / 100}
                    className="text-primary transition-all duration-300" 
                  />
                </svg>
                <span className="absolute text-lg font-bold text-white">{uploadProgress}%</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Uploading Answer</h2>
              <p className="text-slate-400 text-sm mb-4">{uploadingStatusText}</p>
              <p className="text-xs text-slate-500">Please do not close this window. We are saving your video in secure chunks.</p>
            </motion.div>
          )}

          {/* REVIEW & SUBMIT SCREEN */}
          {step === 'review' && (
            <motion.div 
              key="review" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center max-w-md flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">All Questions Answered!</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Your answers have been successfully recorded and uploaded. Click below to submit your interview to the hiring team.
              </p>
              
              <button
                onClick={submitInterview}
                className="px-8 py-4 bg-primary text-white font-semibold rounded-xl shadow-[0_0_25px_rgba(79,124,255,0.2)] hover:bg-primary/90 transition-all"
              >
                Submit Interview
              </button>
            </motion.div>
          )}

          {/* SUCCESS SCREEN */}
          {step === 'success' && (
            <motion.div 
              key="success" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white mb-6 shadow-[0_0_20px_rgba(79,124,255,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Interview Submitted!</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Thank you for completing your video interview. Your responses have been submitted to <strong>{job?.company || 'the hiring team'}</strong>. You may now close this window.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-xs text-slate-600 border-t border-white/5 relative z-10 bg-slate-900/10">
        © 2026 TalentScreen AI. All rights reserved. Secure chunked upload enabled.
      </footer>
    </div>
  );
}
