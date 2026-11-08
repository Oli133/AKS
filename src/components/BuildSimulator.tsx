import React, { useState, useEffect, useRef } from 'react';
import { SocPreset, DefconfigOption, BuildLogLine } from '../types/kernel';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, Download, Terminal, HardDrive, Cpu, Clock, Layers } from 'lucide-react';

interface BuildSimulatorProps {
  selectedSoc: SocPreset;
  selectedConfigs: DefconfigOption[];
}

export const BuildSimulator: React.FC<BuildSimulatorProps> = ({ selectedSoc, selectedConfigs }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [logs, setLogs] = useState<BuildLogLine[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Planned real compilation log steps
  const simulationPlan = [
    { text: `[ENV] Initializing Kbuild environment: ARCH=arm64 SUBARCH=arm64`, type: 'info' },
    { text: `[ENV] Cross compiler: aarch64-linux-gnu- | Host: x86_64-linux-gnu`, type: 'info' },
    { text: `[TOOLCHAIN] Checking Clang version: ${selectedSoc.recommendedClang}`, type: 'cmd' },
    { text: `clang version 18.0.0 (https://android.googlesource.com/toolchain/llvm-project)`, type: 'info' },
    { text: `[KCONFIG] make O=out ARCH=arm64 ${selectedSoc.defaultDefconfig.split(' ')[0]}`, type: 'cmd' },
    { text: `configuration written to .config`, type: 'info' },
    { text: `[KCONFIG] Merging user defconfig fragments (${selectedConfigs.length} options)...`, type: 'info' },
    ...selectedConfigs.map(c => ({ text: `  + Applying ${c.key}=y [${c.name}]`, type: 'info' })),
    { text: `[KCONFIG] make O=out ARCH=arm64 olddefconfig`, type: 'cmd' },
    { text: `# Configuration written to out/.config (3,412 symbols resolved)`, type: 'info' },
    { text: `[BUILD] Invoking: make -j16 O=out ARCH=arm64 CC=clang LLVM=1 LLVM_IAS=1 Image.gz dtbs modules`, type: 'cmd' },
    { text: `  WRAP    arch/arm64/include/generated/uapi/asm/kvm_para.h`, type: 'compile' },
    { text: `  UPD     include/config/kernel.release`, type: 'compile' },
    { text: `  CC      init/main.o`, type: 'compile' },
    { text: `  CC      init/version.o`, type: 'compile' },
    { text: `  CC      kernel/fork.o`, type: 'compile' },
    { text: `  CC      kernel/sched/core.o`, type: 'compile' },
    { text: `  CC      kernel/sched/fair.o`, type: 'compile' },
    { text: `  CC      kernel/sched/topology.o`, type: 'compile' },
    { text: `  CC      kernel/power/main.o`, type: 'compile' },
    { text: `  CC      drivers/android/binder.o`, type: 'compile' },
    { text: `  CC      drivers/android/binder_alloc.o`, type: 'compile' },
    ...(selectedConfigs.some(c => c.key === 'CONFIG_KSU') ? [
      { text: `  CC      drivers/kernelsu/core.o`, type: 'compile' },
      { text: `  CC      drivers/kernelsu/ksu.o`, type: 'compile' },
      { text: `  CC      drivers/kernelsu/apk_sign.o`, type: 'compile' },
    ] : []),
    ...(selectedConfigs.some(c => c.key === 'CONFIG_WIREGUARD') ? [
      { text: `  CC      net/wireguard/main.o`, type: 'compile' },
      { text: `  CC      net/wireguard/noise.o`, type: 'compile' },
      { text: `  CC      net/wireguard/socket.o`, type: 'compile' },
    ] : []),
    ...(selectedConfigs.some(c => c.key === 'CONFIG_ZRAM_DEF_COMP_ZSTD') ? [
      { text: `  CC      mm/zram/zram_drv.o`, type: 'compile' },
      { text: `  CC      crypto/zstd.o`, type: 'compile' },
    ] : []),
    { text: `  CC      fs/erofs/super.o`, type: 'compile' },
    { text: `  CC      fs/f2fs/super.o`, type: 'compile' },
    { text: `  AR      built-in.a`, type: 'compile' },
    { text: `  LD      vmlinux.o`, type: 'link' },
    { text: `  MODPOST vmlinux.symvers`, type: 'link' },
    { text: `  KSYMS   .tmp_vmlinux.kallsyms2.S`, type: 'compile' },
    { text: `  AS      .tmp_vmlinux.kallsyms2.o`, type: 'compile' },
    { text: `  LD      vmlinux (ThinLTO optimizations applied)`, type: 'link' },
    { text: `  SORTTAB vmlinux`, type: 'info' },
    { text: `  SYSMAP  System.map`, type: 'info' },
    { text: `  OBJCOPY arch/arm64/boot/Image`, type: 'link' },
    { text: `  GZIP    arch/arm64/boot/Image.gz (18.4 MB)`, type: 'success' },
    { text: `  DTC     arch/arm64/boot/dts/vendor/${selectedSoc.codeName}.dtb`, type: 'compile' },
    { text: `[ANYKERNEL3] Packaging AnyKernel3 flashable package...`, type: 'cmd' },
    { text: `  + Injecting Image.gz into AnyKernel3/Image.gz`, type: 'info' },
    { text: `  + Injecting ${selectedSoc.codeName}.dtb into AnyKernel3/dtb`, type: 'info' },
    { text: `  + Generating ZIP: Kernel-${selectedSoc.codeName}-flashable.zip`, type: 'info' },
    { text: `[SUCCESS] Build completed in 3m 42s. Artifacts verified.`, type: 'success' },
    { text: `[CHECKSUM] SHA256: e8b94f02a39b4f2c01837d9284cf2918471e98bb48293758291a2749`, type: 'info' },
  ];

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Timer loop
  useEffect(() => {
    let timer: any;
    if (isRunning && !isCompleted) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isCompleted]);

  // Log execution step loop
  useEffect(() => {
    let timeout: any;
    if (isRunning && currentStepIndex < simulationPlan.length) {
      const delay = Math.max(80, Math.floor(450 / speed));
      timeout = setTimeout(() => {
        const step = simulationPlan[currentStepIndex];
        const now = new Date().toISOString().substring(11, 19);
        setLogs(prev => [
          ...prev,
          {
            id: `${currentStepIndex}-${Date.now()}`,
            timestamp: now,
            type: step.type as any,
            text: step.text,
          },
        ]);
        setCurrentStepIndex(prev => prev + 1);
        if (currentStepIndex + 1 >= simulationPlan.length) {
          setIsRunning(false);
          setIsCompleted(true);
        }
      }, delay);
    }
    return () => clearTimeout(timeout);
  }, [isRunning, currentStepIndex, speed, simulationPlan.length]);

  const handleStart = () => {
    if (isCompleted) {
      handleReset();
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setLogs([]);
    setElapsedSeconds(0);
  };

  const handleSimulatedDownload = () => {
    const manifest = {
      target: selectedSoc.name,
      soc: selectedSoc.codeName,
      kernelVersion: selectedSoc.kernelVersion,
      toolchain: selectedSoc.recommendedClang,
      optionsActive: selectedConfigs.map(c => c.key),
      compiledArtifacts: [
        'arch/arm64/boot/Image.gz',
        `arch/arm64/boot/dts/${selectedSoc.codeName}.dtb`,
        `Kernel-${selectedSoc.codeName}-flashable.zip`
      ],
      buildDate: new Date().toISOString(),
      status: 'VERIFIED_BOOT_READY'
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kernel-${selectedSoc.codeName}-manifest.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = Math.round((currentStepIndex / simulationPlan.length) * 100);

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Virtual Kernel Compiler Simulator</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulates the authentic Clang compilation pipeline for <span className="text-emerald-400 font-semibold">{selectedSoc.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-950"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{currentStepIndex === 0 ? 'Start Build' : 'Resume Build'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                  speed === s ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress & Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Progress</span>
            <span className="text-emerald-400 font-bold">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-400 h-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Time Elapsed</span>
          </div>
          <div className="text-base font-bold text-white font-mono tabular-nums">
            {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulated Cores</span>
          </div>
          <div className="text-base font-bold text-white font-mono">
            16 Threads <span className="text-xs font-normal text-slate-400">(-j16)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Target Image</span>
          </div>
          <div className="text-base font-bold text-emerald-400 font-mono truncate">
            Image.gz + DTB
          </div>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">compiler-stdout</span>
            <span className="text-slate-500">·</span>
            <span>{logs.length} lines logged</span>
          </div>

          {isCompleted && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>BUILD SUCCESS</span>
              </span>
              <button
                onClick={handleSimulatedDownload}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Package Manifest</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 h-[440px] overflow-y-auto font-mono text-xs leading-relaxed space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-12 text-center space-y-2">
              <p>Ready to compile Android kernel for {selectedSoc.name}.</p>
              <p className="text-xs">Click <strong>"Start Build"</strong> above to begin the simulated compilation pipeline.</p>
            </div>
          ) : (
            logs.map(log => {
              let color = 'text-slate-300';
              if (log.type === 'cmd') color = 'text-amber-300 font-bold';
              if (log.type === 'compile') color = 'text-slate-400';
              if (log.type === 'link') color = 'text-cyan-300';
              if (log.type === 'success') color = 'text-emerald-400 font-semibold';
              if (log.type === 'warn') color = 'text-amber-400';

              return (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-slate-600 select-none shrink-0 tabular-nums">{log.timestamp}</span>
                  <span className={`${color} break-all`}>{log.text}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
