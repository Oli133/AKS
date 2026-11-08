import React, { useState } from 'react';
import { DiagnosticResult } from '../types/kernel';
import { SAMPLE_ERRORS, SampleError } from '../data/sampleErrors';
import { Bug, Sparkles, Copy, Check, AlertCircle, ShieldAlert, Cpu, Wrench, ArrowRight } from 'lucide-react';

interface PanicTroubleshooterProps {
  deviceContext: string;
}

export const PanicTroubleshooter: React.FC<PanicTroubleshooterProps> = ({ deviceContext }) => {
  const [selectedSample, setSelectedSample] = useState<SampleError | null>(SAMPLE_ERRORS[0]);
  const [logInput, setLogInput] = useState<string>(SAMPLE_ERRORS[0].log);
  const [contextType, setContextType] = useState<string>('compilation');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [copiedPatch, setCopiedPatch] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleError) => {
    setSelectedSample(sample);
    setLogInput(sample.log);
    setDiagnosticResult(null);
  };

  const handleRunDiagnosis = async () => {
    if (!logInput.trim()) return;
    setIsAnalyzing(true);
    setDiagnosticResult(null);

    try {
      const res = await fetch('/api/kernel/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log: logInput,
          context: contextType,
          device: deviceContext,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setDiagnosticResult(data.result);
        setApiSource(data.source || 'gemini');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPatch = () => {
    if (diagnosticResult?.patch) {
      navigator.clipboard.writeText(diagnosticResult.patch);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">AI Kernel Panic & Compilation Troubleshooter</h2>
        <p className="text-xs text-slate-400 mt-1">
          Paste compiler errors, <code className="text-slate-200">ld.lld</code> missing symbols, or <code className="text-slate-200">dmesg</code> / <code className="text-slate-200">ramoops</code> bootloop logs to diagnose the exact root cause and get code patches.
        </p>
      </div>

      {/* Preset Error Samples Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Quick Test: Common Android Kernel Errors</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {SAMPLE_ERRORS.map(sample => {
            const isSelected = selectedSample?.id === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
                  <span>{sample.category}</span>
                </div>
                <div className="text-xs font-semibold truncate text-slate-200">{sample.title}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{sample.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Input & Diagnosis Button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Kernel Log or Compiler Output:
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Log Type:</span>
            <select
              value={contextType}
              onChange={e => setContextType(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none"
            >
              <option value="compilation">Compiler / Linker Make Error</option>
              <option value="dmesg_panic">Early Boot Panic (dmesg / ramoops)</option>
              <option value="selinux">SELinux Denial (AVC audit)</option>
              <option value="device_tree">Device Tree (DTS / DTB syntax)</option>
            </select>
          </div>
        </div>

        <textarea
          rows={9}
          value={logInput}
          onChange={e => {
            setLogInput(e.target.value);
            setSelectedSample(null);
          }}
          placeholder="Paste your make output, compiler backtrace, or dmesg panic log here..."
          className="w-full p-3 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by Gemini AI Diagnostic Engine & Built-in Linux Kernel Knowledge Base
          </span>

          <button
            onClick={handleRunDiagnosis}
            disabled={isAnalyzing || !logInput.trim()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-emerald-950"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? 'Analyzing Kernel Subsystems...' : 'Diagnose Error with AI'}</span>
          </button>
        </div>
      </div>

      {/* Diagnosis Results Card */}
      {diagnosticResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  diagnosticResult.severity === 'fatal_panic'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    : diagnosticResult.severity === 'error'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}
              >
                {diagnosticResult.severity === 'fatal_panic' ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase font-bold text-slate-400">
                    {diagnosticResult.severity.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-emerald-400 font-semibold">{diagnosticResult.subsystem}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">Root Cause Identified</h3>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>Confidence: {Math.round(diagnosticResult.confidence * 100)}%</span>
              <span>Source: {apiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Kernel Engine'}</span>
            </div>
          </div>

          {/* Root cause text */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-400">Analysis:</h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              {diagnosticResult.rootCause}
            </p>
          </div>

          {/* Step by step solution */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-400">Actionable Resolution:</h4>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 font-mono">
              {diagnosticResult.solution}
            </div>
          </div>

          {/* Patch snippet */}
          {diagnosticResult.patch && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-400">Suggested Code / Defconfig Patch:</h4>
                <button
                  onClick={copyPatch}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedPatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPatch ? 'Copied' : 'Copy Patch'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {diagnosticResult.patch}
              </pre>
            </div>
          )}

          {/* Related Kconfig symbols */}
          {diagnosticResult.relatedConfigs?.length > 0 && (
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Related Kconfig Symbols:</span>
              {diagnosticResult.relatedConfigs.map(sym => (
                <code
                  key={sym}
                  className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                >
                  {sym}
                </code>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
