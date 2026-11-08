import React, { useState } from 'react';
import { Layers, ShieldCheck, Cpu, HardDrive, ArrowRight, Zap, Info, ChevronRight, Lock } from 'lucide-react';

export const BootArchitectureExplorer: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(3); // Default to Kernel stage

  const stages = [
    {
      step: '01',
      title: 'BootROM (PBL)',
      subtitle: 'Primary Boot Loader',
      description: 'Hardcoded into the SoC silicon ROM. Initializes minimal CPU registers, loads crypto keys, verifies the signature of the Secondary Boot Loader (XBL), and jumps to SRAM.',
      details: 'Read-only, completely immutable. If verification fails, phone falls into Qualcomm Emergency Download (EDL 9008) mode.',
    },
    {
      step: '02',
      title: 'XBL / SBL',
      subtitle: 'eXtensible Boot Loader',
      description: 'Initializes DDR RAM memory controllers, PMIC power rails, clock trees, and loads the TrustZone (QSEE/TEE) secure monitor operating system.',
      details: 'Stored in xbl / sbl partitions on UFS storage. Authenticated via hardware root-of-trust.',
    },
    {
      step: '03',
      title: 'ABL (Fastboot)',
      subtitle: 'Android Boot Loader',
      description: 'The open-source LittleKernel (LK) or UEFI implementation. Checks bootloader lock state, processes fastboot USB commands, and verifies the boot.img signature via AVB 2.0.',
      details: 'Unlocking bootloader in developer options disables cryptographic signature enforcement on the boot partition.',
    },
    {
      step: '04',
      title: 'Kernel & Ramdisk',
      subtitle: 'boot.img / vendor_boot.img',
      description: 'The Linux kernel image (Image.gz) is decompressed into RAM. The kernel initializes CPU scheduler, memory management, device drivers via DTB, and launches /init.',
      details: 'In Android 13+ GKI, the generic kernel resides in boot.img, OEM modules in vendor_boot, and the generic ramdisk in init_boot.',
    },
    {
      step: '05',
      title: 'Android Init',
      subtitle: '/system/bin/init',
      description: 'First userspace process (PID 1). Mounts dynamic partitions (system, vendor, product, odm), enforces SELinux policies, and starts native daemons from init.rc.',
      details: 'This is where Magisk and KernelSU inject their mount namespaces and su binary.',
    },
    {
      step: '06',
      title: 'Zygote & System Server',
      subtitle: 'Android Runtime (ART)',
      description: 'Zygote preloads all core Android Java framework classes. Spawns System Server (ActivityManager, WindowManager, PackageManager) and Android Launcher UI.',
      details: 'Once surfaceflinger renders the home screen, boot is declared complete by the OS.',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Android Boot Chain & GKI 2.0 Architecture</h2>
        <p className="text-xs text-slate-400 mt-1">
          Understanding the sequence of execution from physical power-on to the Android home screen launcher.
        </p>
      </div>

      {/* Boot Chain Horizontal Steps */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map((stage, idx) => {
            const isSelected = selectedStage === idx;
            return (
              <button
                key={stage.step}
                onClick={() => setSelectedStage(idx)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 text-white shadow-sm shadow-emerald-950'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono text-emerald-400 font-bold mb-1">{stage.step}</div>
                <div className="text-xs font-bold text-white truncate">{stage.title}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{stage.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              STAGE {stages[selectedStage].step}
            </span>
            <h3 className="text-base font-bold text-white">{stages[selectedStage].title} — {stages[selectedStage].subtitle}</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {stages[selectedStage].description}
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 font-mono">
            <strong>Technical Note:</strong> {stages[selectedStage].details}
          </div>
        </div>
      </div>

      {/* Android 13+ Partition Layout Blueprint */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Modern Android GKI Partition Blueprint (Header v4)</h3>
          <p className="text-xs text-slate-400">
            Android 12 and 13 decoupled the kernel and vendor ramdisk across dedicated physical partitions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-bold">/dev/block/.../boot</span>
              <span>Header v4</span>
            </div>
            <h4 className="text-sm font-bold text-white">boot Partition</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains <strong>only</strong> the uncompressed or gzip Linux kernel binary (<code className="text-slate-300">Image</code>). In GKI 2.0, this image is 100% generic across all devices.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-bold">/dev/block/.../init_boot</span>
              <span>Android 13+</span>
            </div>
            <h4 className="text-sm font-bold text-white">init_boot Partition</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains the Google generic ramdisk (<code className="text-slate-300">init</code> binary and core selinux policies). Flashing Magisk on Android 13+ patches this partition instead of boot.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-bold">/dev/block/.../vendor_boot</span>
              <span>OEM Hardware</span>
            </div>
            <h4 className="text-sm font-bold text-white">vendor_boot Partition</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains the OEM Device Tree (<code className="text-slate-300">dtb</code>), vendor ramdisk, and early boot kernel modules (<code className="text-slate-300">.ko</code>) like touchscreen and display.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
              <span className="font-bold">/dev/block/.../dtbo</span>
              <span>Overlay DTB</span>
            </div>
            <h4 className="text-sm font-bold text-white">dtbo Partition</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Device Tree Blob Overlays applied dynamically at boot time to account for minor board revisions or different display panel suppliers.
            </p>
          </div>
        </div>
      </section>

      {/* Rooting Architectures Compared */}
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">Modern Kernel-Level Rooting Technologies</h3>
          <p className="text-xs text-slate-400">
            How custom kernels interface with root mechanisms in Android today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-2.5">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">In-Kernel Hook</div>
            <h4 className="text-base font-bold text-white">KernelSU (KSU)</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Operates purely inside kernel space by intercepting the <code className="text-emerald-400">prctl</code> syscall. Since it does not patch <code className="text-slate-300">/system</code> or userspace binaries, it is undetectable by banking apps and anti-cheat engines.
            </p>
            <div className="text-xs font-mono text-slate-400 pt-1">
              Requires: CONFIG_KSU=y
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="text-xs font-mono text-indigo-400 font-bold uppercase">Dynamic Kprobe Hook</div>
            <h4 className="text-base font-bold text-white">APatch</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Uses Linux <code className="text-indigo-400">kprobes</code> to patch kernel execution in memory at boot time. Can be used on stock pre-compiled GKI boot images without needing full kernel source code recompilation.
            </p>
            <div className="text-xs font-mono text-slate-400 pt-1">
              Requires: CONFIG_KPROBES=y
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="text-xs font-mono text-amber-400 font-bold uppercase">Userspace Overlay</div>
            <h4 className="text-base font-bold text-white">Magisk</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traditional userspace root solution. Injects into ramdisk <code className="text-amber-400">/init</code>, mounts systemless overlays over <code className="text-slate-300">/system</code>, and runs the magiskd background daemon.
            </p>
            <div className="text-xs font-mono text-slate-400 pt-1">
              Patches: init_boot.img or boot.img
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
