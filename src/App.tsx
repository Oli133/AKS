/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { KernelConfigurator } from './components/KernelConfigurator';
import { ScriptGenerator } from './components/ScriptGenerator';
import { BuildSimulator } from './components/BuildSimulator';
import { PanicTroubleshooter } from './components/PanicTroubleshooter';
import { BootArchitectureExplorer } from './components/BootArchitectureExplorer';
import { KernelCopilotChat } from './components/KernelCopilotChat';
import { SOC_PRESETS, DEFCONFIG_OPTIONS } from './data/kernelPresets';
import { SocPreset, DefconfigOption } from './types/kernel';
import { MessageSquare, ExternalLink, Terminal, Cpu, GitFork } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedSoc, setSelectedSoc] = useState<SocPreset>(SOC_PRESETS[0]);
  
  // Default active defconfig options: highly capable modern performance + stealth setup
  const [selectedConfigs, setSelectedConfigs] = useState<DefconfigOption[]>(
    DEFCONFIG_OPTIONS.filter(o => o.recommended)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickSimulate={() => setActiveTab('simulator')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'overview' && (
          <ExecutiveSummary
            onGoToConfig={() => setActiveTab('configurator')}
            onGoToScripts={() => setActiveTab('scripts')}
            onGoToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'configurator' && (
          <KernelConfigurator
            selectedSoc={selectedSoc}
            setSelectedSoc={setSelectedSoc}
            selectedConfigs={selectedConfigs}
            setSelectedConfigs={setSelectedConfigs}
            onGoToScripts={() => setActiveTab('scripts')}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptGenerator
            selectedSoc={selectedSoc}
            selectedConfigs={selectedConfigs}
            onGoToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'simulator' && (
          <BuildSimulator
            selectedSoc={selectedSoc}
            selectedConfigs={selectedConfigs}
          />
        )}

        {activeTab === 'troubleshooter' && (
          <PanicTroubleshooter
            deviceContext={`${selectedSoc.name} (${selectedSoc.codeName})`}
          />
        )}

        {activeTab === 'architecture' && (
          <BootArchitectureExplorer />
        )}

        {activeTab === 'copilot' && (
          <KernelCopilotChat />
        )}

        {/* Global Copilot Banner on non-copilot tabs */}
        {activeTab !== 'copilot' && (
          <section className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Have a specific Android kernel question?</h4>
                <p className="text-xs text-slate-400">Ask the AI Kernel Copilot for instant advice on drivers, headers, or Kbuild configs.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('copilot')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Open Kernel Copilot &rarr;
            </button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>AndroKernel Studio</span>
            <span aria-hidden="true">·</span>
            <span>AOSP & Linux Kernel Workbench</span>
            <span aria-hidden="true">·</span>
            <span>GPLv2 Licensed Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <a
              href="https://android.googlesource.com/kernel/common"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>AOSP Common Kernel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>·</span>
            <a
              href="https://source.android.com/docs/core/architecture/kernel/gki"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Google GKI Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
