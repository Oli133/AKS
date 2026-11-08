import React, { useState } from 'react';
import { SocPreset, DefconfigOption } from '../types/kernel';
import { generateBuildScript, generateGitHubWorkflow, generateDockerfile, generateAnyKernelScript } from '../utils/scriptTemplates';
import { Copy, Download, FileCode, Terminal, GitBranch, Box, Check, Play } from 'lucide-react';

interface ScriptGeneratorProps {
  selectedSoc: SocPreset;
  selectedConfigs: DefconfigOption[];
  onGoToSimulator: () => void;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  selectedSoc,
  selectedConfigs,
  onGoToSimulator,
}) => {
  const [activeFile, setActiveFile] = useState<'build.sh' | 'github_workflow' | 'dockerfile' | 'anykernel.sh'>('build.sh');
  const [copied, setCopied] = useState<boolean>(false);

  const buildScript = generateBuildScript(selectedSoc, selectedConfigs);
  const githubWorkflow = generateGitHubWorkflow(selectedSoc);
  const dockerfile = generateDockerfile(selectedSoc);
  const anykernelScript = generateAnyKernelScript(selectedSoc);

  const getActiveContent = () => {
    switch (activeFile) {
      case 'build.sh':
        return { filename: 'build.sh', content: buildScript, lang: 'bash' };
      case 'github_workflow':
        return { filename: '.github/workflows/kernel.yml', content: githubWorkflow, lang: 'yaml' };
      case 'dockerfile':
        return { filename: 'Dockerfile', content: dockerfile, lang: 'dockerfile' };
      case 'anykernel.sh':
        return { filename: 'anykernel.sh', content: anykernelScript, lang: 'bash' };
    }
  };

  const { filename, content } = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.split('/').pop() || 'kernel-file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Production Kernel Build Artifacts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-configured for <span className="text-emerald-400 font-semibold">{selectedSoc.name}</span> with {selectedConfigs.length} active Kconfig extensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test In Live Simulator</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveFile('build.sh')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeFile === 'build.sh'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>build.sh (Local Bash)</span>
        </button>

        <button
          onClick={() => setActiveFile('github_workflow')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeFile === 'github_workflow'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>.github/workflows/kernel.yml (Cloud CI)</span>
        </button>

        <button
          onClick={() => setActiveFile('dockerfile')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeFile === 'dockerfile'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>Dockerfile (Container)</span>
        </button>

        <button
          onClick={() => setActiveFile('anykernel.sh')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
            activeFile === 'anykernel.sh'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>anykernel.sh (TWRP Flasher)</span>
        </button>
      </div>

      {/* Editor & Instructions Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
            <span className="font-semibold text-white">{filename}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{content.split('\n').length} lines</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            {content}
          </pre>
        </div>
      </div>

      {/* Usage guide for active file */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">How to execute this artifact:</h3>
        {activeFile === 'build.sh' && (
          <div className="text-xs text-slate-300 space-y-2">
            <p>1. Place <code className="text-emerald-400 font-mono">build.sh</code> into the root of your cloned kernel source directory.</p>
            <p>2. Grant execute permissions: <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">chmod +x build.sh</code></p>
            <p>3. Run the compiler: <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">./build.sh</code></p>
            <p>4. Once completed, your flashable zip will be generated in the current directory.</p>
          </div>
        )}
        {activeFile === 'github_workflow' && (
          <div className="text-xs text-slate-300 space-y-2">
            <p>1. In your GitHub repository, create a directory: <code className="text-emerald-400 font-mono">.github/workflows/</code></p>
            <p>2. Save this file as <code className="text-emerald-400 font-mono">.github/workflows/kernel.yml</code> and push to GitHub.</p>
            <p>3. Under your repository's <strong>Actions</strong> tab, click <strong>Build Android Kernel CI</strong> &rarr; <strong>Run workflow</strong>.</p>
            <p>4. GitHub compiles the entire kernel in the cloud in ~12 minutes and saves the zip in the workflow artifacts!</p>
          </div>
        )}
        {activeFile === 'dockerfile' && (
          <div className="text-xs text-slate-300 space-y-2">
            <p>1. Build the container image: <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">docker build -t androkernel-env .</code></p>
            <p>2. Mount your kernel source tree and run: <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">docker run --rm -v $(pwd):/workspace androkernel-env</code></p>
          </div>
        )}
        {activeFile === 'anykernel.sh' && (
          <div className="text-xs text-slate-300 space-y-2">
            <p>1. Clone osm0sis AnyKernel3: <code className="text-emerald-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">git clone https://github.com/osm0sis/AnyKernel3.git</code></p>
            <p>2. Replace <code className="text-emerald-400 font-mono">AnyKernel3/anykernel.sh</code> with this file.</p>
            <p>3. Copy your compiled <code className="text-emerald-400 font-mono">Image.gz</code> into the folder, zip the contents, and flash in TWRP or KernelSU app!</p>
          </div>
        )}
      </div>
    </div>
  );
};
