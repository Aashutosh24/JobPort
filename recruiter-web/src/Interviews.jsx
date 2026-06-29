import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Play, Clock, Star, AlertCircle, ShieldAlert, Award, FileText, HelpCircle, CornerDownRight } from 'lucide-react';

const DimensionBar = ({ label, score }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{score}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: `${score}%` }} 
        transition={{ duration: 1 }}
        className="bg-indigo-500 h-full rounded-full"
      />
    </div>
  </div>
);

export default function Interviews({ selectedCandidate, selectedJob }) {
  const [activeAnswerIdx, setActiveAnswerIdx] = useState(0);

  if (!selectedCandidate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12">
        <h2 className="text-xl font-medium text-white mb-2">No Candidate Selected</h2>
        <p className="text-sm">Select a candidate from the Candidate Pipeline to view their interview details.</p>
      </div>
    );
  }

  const { name, title, company, skills, interviewStatus, interviewQuestions, interviewAnswers, scorecard, experienceSummary, experienceYears, flags } = selectedCandidate;

  // Calculate average scores if answers are available
  const hasAnswers = interviewAnswers && interviewAnswers.length > 0;
  const isCompleted = interviewStatus === 'Completed' && scorecard;

  return (
    <div className="p-12 w-full max-w-7xl mx-auto h-full overflow-y-auto bg-slate-950">
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 font-medium mb-3 inline-block">
            {selectedJob?.title || 'Job Role'}
          </span>
          <h1 className="text-3xl font-bold text-white mb-2">Interview Analysis</h1>
          <p className="text-slate-400 text-sm">Review AI-transcribed answers, communication clarity, and scorecard for {name}.</p>
        </div>
        <div className="flex space-x-3">
          <span className={`px-4 py-2 text-sm font-semibold rounded-xl border flex items-center ${
            interviewStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            interviewStatus === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            interviewStatus === 'Invited' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            Status: {interviewStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Panel: Candidate Profile */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 mb-4">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-3xl text-white">
                {name.charAt(0)}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <p className="text-indigo-400 font-medium mb-4">{title}</p>
            
            {company && (
              <p className="text-slate-500 text-sm mb-4">Previously at {company} • {experienceYears} years exp</p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {skills?.map(skill => (
                <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">
                  {skill}
                </span>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">AI Profile Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {experienceSummary || 'Candidate profile parsed from public records.'}
              </p>
            </div>

            {flags && flags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3 flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-1.5" /> Red Flags Detected
                </h3>
                <ul className="space-y-2">
                  {flags.map((flag, idx) => (
                    <li key={idx} className="text-xs text-rose-300 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Analysis & Response Player */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {isCompleted ? (
            <>
              {/* Overall Scorecard */}
              <div className="bg-slate-900/60 border border-white/5 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none" />
                
                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <BrainCircuit className="text-indigo-500 w-6 h-6" />
                    <h3 className="text-lg font-semibold text-white">Interview Scorecard</h3>
                  </div>
                  <div className="space-y-4">
                    <DimensionBar label="Relevance" score={Math.round(interviewAnswers.reduce((sum, a) => sum + (a.relevance || 0), 0) / interviewAnswers.length)} />
                    <DimensionBar label="Clarity" score={Math.round(interviewAnswers.reduce((sum, a) => sum + (a.clarity || 0), 0) / interviewAnswers.length)} />
                    <DimensionBar label="Specificity" score={Math.round(interviewAnswers.reduce((sum, a) => sum + (a.specificity || 0), 0) / interviewAnswers.length)} />
                    <DimensionBar label="Technical Depth" score={Math.round(interviewAnswers.reduce((sum, a) => sum + (a.depth || 0), 0) / interviewAnswers.length)} />
                  </div>
                </div>

                <div className="border-l border-white/5 pl-0 md:pl-8 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Qwen 2.5 Verdict</h4>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      "{scorecard.summary}"
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center ${
                      scorecard.verdict === 'Highly Recommended' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      scorecard.verdict === 'Recommended' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <Award className="w-4 h-4 mr-1.5" /> {scorecard.verdict}
                    </span>
                    <span className="text-xs text-slate-400">
                      Confidence: <strong className="text-white">{scorecard.confidence}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Follow-Up Questions */}
              {scorecard.followUpQuestions && scorecard.followUpQuestions.length > 0 && (
                <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2 text-indigo-400" /> Suggested Live Interview Follow-Ups
                  </h3>
                  <ul className="space-y-3">
                    {scorecard.followUpQuestions.map((q, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-300 bg-white/5 border border-white/5 p-3 rounded-xl">
                        <CornerDownRight className="w-4 h-4 text-indigo-400 mr-2 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Question & Video Browser */}
              <div className="bg-slate-900/60 border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white mb-6">Candidate Video Responses</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Question List */}
                  <div className="md:col-span-5 space-y-3">
                    {interviewAnswers.map((ans, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveAnswerIdx(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                          activeAnswerIdx === idx 
                            ? 'bg-indigo-600/10 border-indigo-500/40 text-white' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                          Question {idx + 1}
                        </span>
                        <p className="text-xs font-medium line-clamp-2">{ans.question}</p>
                      </button>
                    ))}
                  </div>

                  {/* Video Player & Transcript */}
                  <div className="md:col-span-7 space-y-4">
                    {interviewAnswers[activeAnswerIdx] && (
                      <>
                        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/5">
                          {interviewAnswers[activeAnswerIdx].videoUrl ? (
                            <video
                              src={`http://${window.location.hostname}:5000${interviewAnswers[activeAnswerIdx].videoUrl}`}
                              controls
                              className="w-full h-full object-contain"
                              poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                              Video file missing or corrupt.
                            </div>
                          )}
                        </div>

                        {/* Answer analysis details */}
                        <div className="space-y-4 pt-2">
                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">AI Summary</span>
                            <p className="text-sm text-slate-300 italic leading-relaxed">
                              "{interviewAnswers[activeAnswerIdx].summary}"
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-4 bg-white/5 p-3 rounded-2xl text-center">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Relevance</span>
                              <strong className="text-white text-sm">{interviewAnswers[activeAnswerIdx].relevance}%</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Clarity</span>
                              <strong className="text-white text-sm">{interviewAnswers[activeAnswerIdx].clarity}%</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Specificity</span>
                              <strong className="text-white text-sm">{interviewAnswers[activeAnswerIdx].specificity}%</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Depth</span>
                              <strong className="text-white text-sm">{interviewAnswers[activeAnswerIdx].depth}%</strong>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-1.5 text-indigo-400" /> Whisper Transcription
                            </span>
                            <div className="bg-slate-950/60 border border-white/5 p-4 rounded-2xl max-h-48 overflow-y-auto text-sm text-slate-300 leading-relaxed">
                              {interviewAnswers[activeAnswerIdx].transcription}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900/60 border border-white/5 p-8 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-indigo-500 mb-4 opacity-75" />
              <h3 className="text-xl font-semibold text-white mb-2">No Interview Data Available Yet</h3>
              <p className="text-slate-400 text-sm max-w-md mb-8">
                {interviewStatus === 'Invited' 
                  ? 'The candidate has been invited. We are waiting for them to complete the video interview via their link.' 
                  : 'The candidate has started the interview. Once they submit all answers, the AI will transcribe and score them.'}
              </p>

              {interviewQuestions && interviewQuestions.length > 0 && (
                <div className="w-full text-left max-w-lg border-t border-white/5 pt-8">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Assigned Interview Questions</h4>
                  <ul className="space-y-3">
                    {interviewQuestions.map((q, idx) => (
                      <li key={idx} className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-sm text-slate-300 flex">
                        <span className="text-indigo-400 font-bold mr-3">{idx + 1}.</span>
                        <div>
                          <p className="font-medium">{q.question}</p>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1 block">
                            Type: {q.type} | Think: {q.thinkTime}s | Max: {q.maxTime / 60}m
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}