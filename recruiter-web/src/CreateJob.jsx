import React, { useState } from 'react';

const AICard = ({ title, items, confidence }) => (
  <div className="bg-slate-50 rounded-xl border border-indigo-100 p-4 mb-4">
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold text-indigo-900 text-sm">{title}</h4>
      <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
        {confidence}% Confidence
      </span>
    </div>
    <ul className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <li key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md shadow-sm">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const CreateJob = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  const handleAIAnalyze = (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setAiResults({
        requiredSkills: ['React', 'TypeScript', 'Node.js'],
        preferredSkills: ['GraphQL', 'AWS', 'Docker'],
        seniority: ['Mid-Level', 'Senior'],
        softSkills: ['Cross-functional communication', 'Mentorship'],
        implicit: ['Experience with scalable architecture', 'Agile/Scrum familiarity'],
        confidence: 94
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-8 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Create New Job</h2>
            <p className="text-slate-500 text-sm mt-1">Fill out the details or paste a description to let AI extract the requirements.</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
              Save Draft
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-all">
              Publish Job
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Form Section */}
          <div className="p-8 lg:col-span-2 border-r border-slate-200 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all" placeholder="e.g. Senior Frontend Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all" placeholder="e.g. San Francisco, CA or Remote" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employment Type</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Salary Range (Optional)</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="$120k - $150k" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
              <textarea 
                rows="10" 
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all resize-none" 
                placeholder="Paste the full job description here..."
              ></textarea>
            </div>
            
            <button 
              onClick={handleAIAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center py-3 px-4 border border-indigo-200 rounded-lg shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isAnalyzing ? '✨ Analyzing Job Description...' : '✨ AI Analyze Job Description'}
            </button>
          </div>

          {/* AI Analysis Side Panel */}
          <div className="p-8 bg-slate-50/50">
            <h3 className="text-lg font-medium text-slate-900 mb-6">AI Insights</h3>
            
            {!aiResults && !isAnalyzing && (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
                <span className="text-4xl mb-3 block">🤖</span>
                <p className="text-sm text-slate-500">Run the AI analyzer to automatically extract skills, requirements, and generate interview topics.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-slate-200">
                    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-slate-200 rounded w-16"></div>
                      <div className="h-6 bg-slate-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {aiResults && !isAnalyzing && (
              <div className="animate-in slide-in-from-right-4 duration-500">
                <AICard title="Required Skills" items={aiResults.requiredSkills} confidence={98} />
                <AICard title="Preferred Skills" items={aiResults.preferredSkills} confidence={85} />
                <AICard title="Soft Skills & Traits" items={aiResults.softSkills} confidence={92} />
                <AICard title="Implicit Requirements" items={aiResults.implicit} confidence={76} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;