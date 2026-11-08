import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Shield, Cpu, HardDrive, Terminal, GitBranch, Zap, Sparkles } from 'lucide-react';

interface ExecutiveSummaryProps {
  onGoToConfig: () => void;
  onGoToScripts: () => void;
  onGoToSimulator: () => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  onGoToConfig,
  onGoToScripts,
  onGoToSimulator,
}) => {
  return (
    <div className="space-y-12">
      {/* Hero Direct Answer Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 sm:p-10">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>AOSP Open Source</span>
            <span aria-hidden="true">·</span>
            <span>GPLv2 Compliant</span>
            <span aria-hidden="true">·</span>
            <span>ARM64 / Linux Foundation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
            Yes, You Can Build a Custom Kernel for Android.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Android runs on top of the Linux kernel. Every phone manufacturer (Google, Samsung, Xiaomi, OnePlus, Motorola) is legally required by the GNU General Public License (GPLv2) to release their kernel source code. With an ARM64 cross-compiler and the correct device tree, you can compile, customize, and flash your own kernel.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onGoToConfig}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>Configure Device & Defconfig</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGoToScripts}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <span>View Free GitHub CI & Scripts</span>
            </button>
            <button
              onClick={onGoToSimulator}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Simulate Real Build Process</span>
            </button>
          </div>
        </div>
      </section>

      {/* The 6 Pillars of Building an Android Kernel */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">The 6 Essential Milestones</h2>
          <p className="text-sm text-slate-400 mt-1">
            Understanding the end-to-end pipeline from source checkout to your device's flash partition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              01
            </div>
            <h3 className="text-base font-semibold text-white">Kernel Source Tree</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Obtained either from Google's AOSP common kernel (for GKI devices) or OEM GitHub repositories (for device-specific vendor trees). Typically 4GB to 25GB in size.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              git clone android.googlesource.com/...
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              02
            </div>
            <h3 className="text-base font-semibold text-white">Clang / LLVM Cross-Compiler</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modern Android kernels exclusively target Clang with LLD and integrated assembler (<code className="text-slate-200">LLVM=1 LLVM_IAS=1</code>). GCC is deprecated for ARM64 Android since Android 10.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              clang-r487747c / Proton-Clang
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              03
            </div>
            <h3 className="text-base font-semibold text-white">Defconfig Tuning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The <code className="text-slate-200">.config</code> file determines which drivers and subsystems compile. Here you toggle KernelSU, WireGuard, schedutil governor, ZRAM zstd compression, and eBPF.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              make O=out ARCH=arm64 vendor_defconfig
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              04
            </div>
            <h3 className="text-base font-semibold text-white">Device Tree Compilation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DTS files map physical SoC memory addresses, GPIO pinmux, PMIC power regulators, and panel display timings. Compiled by <code className="text-slate-200">dtc</code> into binary <code className="text-slate-200">.dtb</code> files.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              arch/arm64/boot/dts/vendor/*.dtb
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              05
            </div>
            <h3 className="text-base font-semibold text-white">AnyKernel3 Packaging</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The universal TWRP/Kernel flashing framework. Instead of wiping vendor ramdisk, it surgical unzips existing boot.img, replaces <code className="text-slate-200">Image</code> and DTB, and repacks without breaking device encryption.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              tools/ak3-core.sh &gt; flashable.zip
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold font-mono">
              06
            </div>
            <h3 className="text-base font-semibold text-white">Device Flashing & Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flashed either via Custom Recovery (TWRP / OrangeFox) or directly via bootloader fastboot (<code className="text-slate-200">fastboot flash boot boot.img</code>). Monitored via <code className="text-slate-200">adb logcat</code> and <code className="text-slate-200">dmesg</code>.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-400/90">
              fastboot flash boot boot.img
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Modern GKI 2.0 vs Legacy Non-GKI */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">GKI 2.0 vs Legacy Non-GKI</h2>
          <p className="text-sm text-slate-400 mt-1">
            Understanding your phone's architecture dictates how your kernel must be built.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Dimension</th>
                <th className="py-3 px-4 text-emerald-400">GKI 2.0 (Android 12 – 15+)</th>
                <th className="py-3 px-4 text-slate-300">Legacy Non-GKI (Android 8 – 11)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium text-white">Kernel Image Origin</td>
                <td className="py-3 px-4">Built from Google AOSP common branch (pure upstream)</td>
                <td className="py-3 px-4">Forked OEM source with thousands of custom patches</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Hardware Drivers</td>
                <td className="py-3 px-4">Compiled as loadable modules (.ko) in <code className="text-slate-200 font-mono text-xs">vendor_boot</code> / <code className="text-slate-200 font-mono text-xs">vendor_dlkm</code></td>
                <td className="py-3 px-4">Baked directly into a monolithic <code className="text-slate-200 font-mono text-xs">Image.gz-dtb</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">KMI (Kernel Module Interface)</td>
                <td className="py-3 px-4 text-emerald-400 font-mono text-xs">Strict ABI frozen by Google (symbols cannot change)</td>
                <td className="py-3 px-4 text-slate-400">No stability promise; any internal function can change</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Portability</td>
                <td className="py-3 px-4">One single kernel binary can boot on Pixel, OnePlus, Xiaomi</td>
                <td className="py-3 px-4">Device-specific only; cannot boot on any other phone model</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Build System</td>
                <td className="py-3 px-4">Kleaf (Google Bazel) or classic Makefile</td>
                <td className="py-3 px-4">GNU Make + Kbuild</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Root Solution</td>
                <td className="py-3 px-4">KernelSU / APatch / Magisk</td>
                <td className="py-3 px-4">Magisk / custom Ramdisk patch</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Hardware Requirements and Cloud CI Alternative */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Local Workstation Requirements</h3>
          </div>
          <p className="text-xs text-slate-400">
            If you want to build on your own PC or laptop:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">·</span>
              <span><strong>Operating System:</strong> Linux (Ubuntu 20.04/22.04 LTS, Arch Linux, Fedora, or WSL2 on Windows 11).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">·</span>
              <span><strong>CPU:</strong> 8 to 16 threads recommended (Ryzen 7 / Core i7 or better).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">·</span>
              <span><strong>RAM:</strong> 16GB minimum (Clang ThinLTO linker phase consumes ~10GB of RAM).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">·</span>
              <span><strong>Disk Space:</strong> 35GB free on an NVMe SSD for source tree, toolchain, and build cache (<code className="font-mono text-emerald-400">ccache</code>).</span>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Don't Have a Powerful PC? Use GitHub Actions!</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You don't need a heavy workstation! Our app generates a <strong>100% automated GitHub Actions CI/CD workflow</strong>. You push the repository to GitHub, and Microsoft's Azure cloud runners compile the kernel for free with 4 CPU cores, 16GB RAM, and automated release uploads directly to your phone.
          </p>
          <div className="pt-1">
            <button
              onClick={onGoToScripts}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer"
            >
              <span>Get Free GitHub Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
