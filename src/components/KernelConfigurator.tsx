import React, { useState } from 'react';
import { SocPreset, DefconfigOption } from '../types/kernel';
import { SOC_PRESETS, DEFCONFIG_OPTIONS } from '../data/kernelPresets';
import { Search, Check, Copy, Sparkles, Filter, Info, Shield, Zap, Battery, Sliders, ExternalLink } from 'lucide-react';

interface KernelConfiguratorProps {
  selectedSoc: SocPreset;
  setSelectedSoc: (soc: SocPreset) => void;
  selectedConfigs: DefconfigOption[];
  setSelectedConfigs: React.Dispatch<React.SetStateAction<DefconfigOption[]>>;
  onGoToScripts: () => void;
}

export const KernelConfigurator: React.FC<KernelConfiguratorProps> = ({
  selectedSoc,
  setSelectedSoc,
  selectedConfigs,
  setSelectedConfigs,
  onGoToScripts,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [aiOptimizing, setAiOptimizing] = useState<boolean>(false);
  const [optimizationRationale, setOptimizationRationale] = useState<string | null>(null);

  const categories = ['All', 'Root & Hooks', 'CPU & Scheduler', 'Memory & Storage', 'Security & SELinux', 'Networking'];

  const filteredOptions = DEFCONFIG_OPTIONS.filter(opt => {
    const matchesCategory = selectedCategory === 'All' || opt.category === selectedCategory;
    const matchesSearch =
      opt.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isEnabled = (key: string) => selectedConfigs.some(c => c.key === key);

  const toggleOption = (option: DefconfigOption) => {
    if (isEnabled(option.key)) {
      setSelectedConfigs(prev => prev.filter(c => c.key !== option.key));
    } else {
      setSelectedConfigs(prev => [...prev, option]);
    }
  };

  const generatedFragment = selectedConfigs
    .map(c => `# [${c.category}] ${c.name}\n${c.kconfigSnippet}`)
    .join('\n\n');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedFragment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiOptimize = async (focus: 'gaming' | 'battery' | 'root_stealth') => {
    setAiOptimizing(true);
    setOptimizationRationale(null);
    try {
      const res = await fetch('/api/kernel/optimize-defconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soc: selectedSoc.name,
          kernelVersion: selectedSoc.kernelVersion,
          focus,
          features: selectedConfigs.map(c => c.name),
        }),
      });
      const data = await res.json();
      if (data.recommendedConfigs) {
        // Auto-select corresponding options
        if (focus === 'gaming') {
          setSelectedConfigs(DEFCONFIG_OPTIONS.filter(o => o.impact === 'performance' || o.key === 'CONFIG_HZ_300'));
        } else if (focus === 'battery') {
          setSelectedConfigs(DEFCONFIG_OPTIONS.filter(o => o.impact === 'battery' || o.key === 'CONFIG_CPU_FREQ_DEFAULT_GOV_SCHEDUTIL'));
        } else {
          setSelectedConfigs(DEFCONFIG_OPTIONS.filter(o => o.category === 'Root & Hooks' || o.impact === 'modding'));
        }
        setOptimizationRationale(data.rationale || `Configuration adjusted for ${focus} profile on ${selectedSoc.name}.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiOptimizing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Target Hardware & SoC Selector */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Select Target Device Platform (SoC)</h2>
            <p className="text-xs text-slate-400">
              Pick your device's chipset to automatically load recommended compiler flags, defconfig name, and branch.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Selected: <span className="text-emerald-400 font-semibold">{selectedSoc.codeName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SOC_PRESETS.map(preset => {
            const isSelected = selectedSoc.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedSoc(preset)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-sm shadow-emerald-950'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-white">{preset.vendor}</span>
                  <span className="font-mono text-emerald-400">{preset.gkiType}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{preset.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Linux {preset.kernelVersion}</span>
                  <span>{preset.codeName}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Hardware Profile Info Card */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono">
          <div>
            <span className="text-slate-500">Base Defconfig:</span> <span className="text-emerald-400">{selectedSoc.defaultDefconfig}</span>
          </div>
          <div>
            <span className="text-slate-500">Compiler:</span> <span className="text-white">{selectedSoc.recommendedClang}</span>
          </div>
          <div>
            <span className="text-slate-500">AOSP Branch:</span> <span className="text-white">{selectedSoc.sourceBranch}</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          <strong>Compatible Devices:</strong> {selectedSoc.devices.join(', ')}
        </div>
      </section>

      {/* 3. AI Tuning Presets */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Quick Tuning Profiles</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Auto-configures optimal Kconfig flags</span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleAiOptimize('gaming')}
            disabled={aiOptimizing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Gaming & Ultra Responsiveness</span>
          </button>
          <button
            onClick={() => handleAiOptimize('battery')}
            disabled={aiOptimizing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Driver (Endurance & Thermals)</span>
          </button>
          <button
            onClick={() => handleAiOptimize('root_stealth')}
            disabled={aiOptimizing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>KernelSU + SuSFS Stealth Root</span>
          </button>
        </div>

        {optimizationRationale && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
            {optimizationRationale}
          </div>
        )}
      </section>

      {/* 4. Interactive Defconfig Options & Kconfig Live Preview Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Toggles & Filters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search CONFIG_*, driver, or keyword..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
            
            {/* Active Count */}
            <div className="text-xs text-slate-400 shrink-0 font-mono">
              <span className="text-emerald-400 font-bold">{selectedConfigs.length}</span> of {DEFCONFIG_OPTIONS.length} active
            </div>
          </div>

          {/* Category Tabs (Segmented Button Controls) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Option List */}
          <div className="space-y-2.5">
            {filteredOptions.map(option => {
              const active = isEnabled(option.key);
              return (
                <div
                  key={option.key}
                  onClick={() => toggleOption(option)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{option.name}</span>
                        <code className="text-xs font-mono text-emerald-400/90 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                          {option.key}
                        </code>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{option.description}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        active
                          ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                          : 'border-slate-700 bg-slate-950'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Kconfig Fragment & Exporter (5 cols) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Generated Defconfig Fragment</h3>
                <span className="text-xs text-slate-400 font-mono">Appended to arch/arm64/configs/...</span>
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 max-h-[460px] overflow-y-auto leading-relaxed selection:bg-emerald-500/30">
                {generatedFragment || '# No custom options selected. Select options from the left.'}
              </pre>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Ready for compilation</span>
              <button
                onClick={onGoToScripts}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Generate build.sh & CI &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
