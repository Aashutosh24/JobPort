import React from 'react';

const StatCard = ({ title, value, trend, positive }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
    <div className="flex items-baseline justify-between">
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className={`text-sm font-medium ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const Dashboard = ({ onNavigate }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back, Recruiter</h2>
          <p className="text-slate-500 mt-1">Here is what's happening with your hiring pipeline today.</p>
        </div>
        <button 
          onClick={() => onNavigate('create-job')}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow text-sm font-medium transition-all"
        >
          + Create New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active Jobs" value="12" trend="+2 this week" positive={true} />
        <StatCard title="Total Candidates" value="1,432" trend="+18%" positive={true} />
        <StatCard title="Shortlisted" value="84" trend="-4%" positive={false} />
        <StatCard title="Interviews Done" value="28" trend="+12%" positive={true} />
        <StatCard title="Avg Match Score" value="88%" trend="+2.4%" positive={true} />
      </div>

      {/* Placeholder for charts/tables */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm h-96 flex items-center justify-center text-slate-400">
          [ Candidate Pipeline Chart ]
        </div>
        <div className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm h-96 flex items-center justify-center text-slate-400">
          [ Recent Activity Feed ]
        </div>
      </div>
    </div>
  );
};

export default Dashboard;