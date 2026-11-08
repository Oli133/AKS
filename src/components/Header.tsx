import React from 'react';
import { Cpu, Terminal, Play, FileCode, Bug, Layers, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onQuickSimulate: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onQuickSimulate }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-5 h-5" />
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className="text-left group cursor-pointer"
          >
            <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
              AndroKernel Studio
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single line, clean text, no pills) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'overview' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Overview & Feasibility
          </button>
          <button
            onClick={() => setActiveTab('configurator')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'configurator' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            SoC & Defconfig Tuner
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'scripts' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Build Scripts & CI
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'simulator' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Live Compiler Terminal
          </button>
          <button
            onClick={() => setActiveTab('troubleshooter')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'troubleshooter' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            AI Crash & Panic Debugger
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`transition-colors whitespace-nowrap hover:text-white cursor-pointer ${
              activeTab === 'architecture' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Boot & GKI Architecture
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickSimulate}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shadow-sm shadow-emerald-950 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Compiler</span>
          </button>
        </div>
      </div>
    </header>
  );
};
