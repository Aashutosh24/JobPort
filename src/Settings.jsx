import React from 'react';
import { Settings as SettingsIcon, Bell, Key, User, Shield } from 'lucide-react';

export default function Settings() {
  const tabs = [
    { name: 'Profile', icon: User, active: true },
    { name: 'Notifications', icon: Bell, active: false },
    { name: 'AI & Integrations', icon: Key, active: false },
    { name: 'Security', icon: Shield, active: false },
  ];

  return (
    <div className="p-12 w-full max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center space-x-3 mb-12">
        <SettingsIcon className="text-indigo-500 w-8 h-8" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex space-x-12 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-64 space-y-2 shrink-0">
          {tabs.map((tab, i) => (
            <button key={i} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${tab.active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-8">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl font-bold border border-indigo-500/30">
                  R
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
                  Change Avatar
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                  <input type="text" defaultValue="Recruiter Admin" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                  <input type="email" defaultValue="admin@talent.ai" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}