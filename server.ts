import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.post('/api/test-post', (req, res) => {
  res.json({ received: req.body });
});

app.get('/api/debug-key', (_req, res) => {
  res.json({
    hasKey: !!process.env.GEMINI_API_KEY,
    keyLen: process.env.GEMINI_API_KEY?.length,
    hasAi: !!ai,
  });
});

// Initialize GoogleGenAI with required User-Agent
const rawApiKey = process.env.GEMINI_API_KEY;
const hasValidKey = rawApiKey && rawApiKey !== 'MY_GEMINI_API_KEY' && rawApiKey.trim().length > 10;
const ai = hasValidKey
  ? new GoogleGenAI({
      apiKey: rawApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Built-in rule-based fallback diagnostics engine in case API key is missing or quota limited
function fallbackDiagnose(log: string, context: string) {
  const lower = log.toLowerCase();
  
  if (lower.includes('implicit declaration of function') || lower.includes('undeclared (first use in this function)')) {
    const symbolMatch = log.match(/implicit declaration of function [‘']([^'’]+)[’']/i) || log.match(/[‘']([^'’]+)[’'] undeclared/i);
    const sym = symbolMatch ? symbolMatch[1] : 'unresolved symbol';
    return {
      severity: 'error',
      subsystem: 'Compiler / Header Scope',
      rootCause: `Function '${sym}' is called without its header prototype included or the required CONFIG_* option is disabled.`,
      solution: `1. Ensure the header declaring '${sym}' is included at top of source file.\n2. In newer GKI/Linux kernels, functions may have moved to <linux/pm_qos.h>, <linux/sched/clock.h>, or require 'EXPORT_SYMBOL_GPL'.\n3. Verify your defconfig enables the driver or subsystem containing this symbol.`,
      patch: `+#include <linux/types.h>\n+#include <linux/sched.h>\n+// If module symbol:\n+MODULE_IMPORT_NS(VFS_internal_I_am_really_a_filesystem_and_am_NOT_a_driver);`,
      confidence: 0.92,
      relatedConfigs: ['CONFIG_MODULES=y', 'CONFIG_TRIM_UNUSED_KSYMS=n']
    };
  }

  if (lower.includes('ld.lld: error: undefined symbol:') || lower.includes('undefined reference to')) {
    const symMatch = log.match(/undefined symbol: ([^\n\s]+)/i) || log.match(/undefined reference to [`']([^'`]+)['`]/i);
    const sym = symMatch ? symMatch[1] : 'symbol';
    return {
      severity: 'error',
      subsystem: 'Linker / Symbol Resolution (LLD)',
      rootCause: `Linker cannot find symbol definition '${sym}'. The object file containing this function wasn't compiled into the kernel image or DLKM module list.`,
      solution: `1. Check Makefile in the driver folder to confirm obj-$(CONFIG_...) += driver.o is active.\n2. If building GKI 2.0, non-exported vendor symbols violate the KMI (Kernel Module Interface). Add symbol to android/abi_gki_aarch64.xml or export via EXPORT_SYMBOL_GPL.\n3. Turn off CONFIG_TRIM_UNUSED_KSYMS in your defconfig during development.`,
      patch: `--- a/drivers/Makefile\n+++ b/drivers/Makefile\n+obj-$(CONFIG_MY_DRIVER) += my_driver.o`,
      confidence: 0.95,
      relatedConfigs: ['CONFIG_TRIM_UNUSED_KSYMS=n', 'CONFIG_UNUSED_SYMBOLS=y']
    };
  }

  if (lower.includes('vfs: unable to mount root fs') || lower.includes('panic - not syncing: vfs:')) {
    return {
      severity: 'fatal_panic',
      subsystem: 'VFS / Boot Ramdisk',
      rootCause: `Kernel initialized drivers and hardware, but failed to mount the Android initramfs or root filesystem partition.`,
      solution: `1. Check if ramdisk compression matches kernel decompressor (e.g. ramdisk is LZ4/zstd, but CONFIG_RD_LZ4 or CONFIG_RD_ZSTD is not enabled in defconfig).\n2. For Android 10+ devices, Android uses system-as-root or dynamic partitions; ensure CONFIG_BLK_DEV_INITRD=y and command line contains 'skip_initramfs' or appropriate bootargs.\n3. Verify AnyKernel3 is flashing to the correct boot_a/boot_b partition slot.`,
      patch: `CONFIG_BLK_DEV_INITRD=y\nCONFIG_RD_GZIP=y\nCONFIG_RD_BZIP2=y\nCONFIG_RD_LZMA=y\nCONFIG_RD_XZ=y\nCONFIG_RD_LZO=y\nCONFIG_RD_LZ4=y\nCONFIG_RD_ZSTD=y`,
      confidence: 0.96,
      relatedConfigs: ['CONFIG_BLK_DEV_INITRD=y', 'CONFIG_RD_LZ4=y', 'CONFIG_RD_ZSTD=y', 'CONFIG_EROFS_FS=y', 'CONFIG_F2FS_FS=y']
    };
  }

  if (lower.includes('selinux: avc: denied') || lower.includes('avc:  denied')) {
    return {
      severity: 'warning',
      subsystem: 'Security / SELinux Policy',
      rootCause: `SELinux security policy blocked kernel or userspace service from accessing a node, socket, or capability.`,
      solution: `1. Temporarily test boot with 'androidboot.selinux=permissive' in cmdline or enable CONFIG_SECURITY_SELINUX_DEVELOP=y.\n2. For custom ROMs, write te rules using audit2allow.\n3. If integrating KernelSU, verify CONFIG_KSU_SUSFS or KernelSU sepolicy patch was properly hooked into security/selinux/hooks.c.`,
      patch: `CONFIG_SECURITY_SELINUX=y\nCONFIG_SECURITY_SELINUX_BOOTPARAM=y\nCONFIG_SECURITY_SELINUX_DEVELOP=y`,
      confidence: 0.90,
      relatedConfigs: ['CONFIG_SECURITY_SELINUX_DEVELOP=y', 'CONFIG_KSU=y']
    };
  }

  if (lower.includes('clang') && (lower.includes('unsupported argument') || lower.includes('unknown argument') || lower.includes('unknown-warning-option'))) {
    return {
      severity: 'error',
      subsystem: 'Toolchain Compatibility',
      rootCause: `Kernel Makefile specifies compiler flags incompatible with your Clang/LLVM version (e.g., GCC-specific flag like '-mno-android' or mismatched LLVM version).`,
      solution: `1. Ensure you are invoking make with 'LLVM=1 LLVM_IAS=1' for integrated LLVM assembler.\n2. Match Clang version to Android kernel branch (e.g., AOSP Clang r487747c for 5.15, r522817 for 6.1/6.6).\n3. Add '-Wno-unknown-warning-option' to KCFLAGS.`,
      patch: `make O=out ARCH=arm64 CC=clang LLVM=1 LLVM_IAS=1 \\
  CROSS_COMPILE=aarch64-linux-gnu- \\
  CROSS_COMPILE_COMPAT=arm-linux-gnueabi- \\
  KCFLAGS="-Wno-error"`,
      confidence: 0.94,
      relatedConfigs: ['CONFIG_CC_IS_CLANG=y', 'CONFIG_LTO_CLANG_THIN=y']
    };
  }

  return {
    severity: 'investigation',
    subsystem: 'General Kernel Core',
    rootCause: `Kernel log indicates compilation failure or early boot issue. Detected context: ${context || 'general build'}.`,
    solution: `1. Check defconfig configuration for conflicting drivers.\n2. Inspect git diff for unmerged dependencies or missing Kconfig symbols.\n3. Try clean build: 'make mrproper' and re-generate out/.config.`,
    patch: `# Clean out directory and rebuild\nrm -rf out && mkdir -p out\nmake O=out ARCH=arm64 vendor_defconfig\nmake O=out ARCH=arm64 -j$(nproc)`,
    confidence: 0.78,
    relatedConfigs: ['CONFIG_LOCALVERSION_AUTO=n', 'CONFIG_DEBUG_INFO=n']
  };
}

// API: Diagnose compilation error or bootloop dmesg log
app.post('/api/kernel/diagnose', async (req, res) => {
  try {
    const { log, context = 'compilation', device = 'Generic ARM64' } = req.body;
    if (!log || typeof log !== 'string' || !log.trim()) {
      return res.status(400).json({ error: 'Log content is required' });
    }

    if (!ai) {
      const fallback = fallbackDiagnose(log, context);
      return res.json({ result: fallback, source: 'heuristic_engine' });
    }

    const prompt = `You are a Principal Linux & Android Kernel Engineer.
Analyze this Android kernel compilation error or dmesg / panic log.
Target Device/Arch: ${device}
Context: ${context}

Log Content:
\`\`\`
${log.slice(0, 8000)}
\`\`\`

Provide an authoritative diagnostic with:
- severity: 'error', 'fatal_panic', 'warning', or 'investigation'
- subsystem: specific kernel subsystem (e.g. "Clang Toolchain / Makefile", "VFS / Mount", "Device Tree / DTS", "Scheduler / EAS", "Memory Management / ZRAM", "KernelSU Integration")
- rootCause: 1-2 sentence precise technical explanation of why this error or crash occurs
- solution: clear, actionable step-by-step instructions to fix it
- patch: ready-to-use code, Makefile diff, defconfig lines, or bash command fix
- confidence: number between 0.1 and 1.0
- relatedConfigs: array of related CONFIG_* kernel symbols`;

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI timeout')), 4500)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING },
              subsystem: { type: Type.STRING },
              rootCause: { type: Type.STRING },
              solution: { type: Type.STRING },
              patch: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              relatedConfigs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['severity', 'subsystem', 'rootCause', 'solution', 'patch', 'confidence', 'relatedConfigs'],
          },
        },
      }),
      timeoutPromise
    ]);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ result: parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Diagnosis error/fallback:', err.message);
    // Graceful fallback to heuristic engine
    const fallback = fallbackDiagnose(req.body?.log || '', req.body?.context || '');
    return res.json({ result: fallback, source: 'heuristic_engine', notice: err.message });
  }
});

// API: AI-Powered Defconfig Optimization & Feature Advisor
app.post('/api/kernel/optimize-defconfig', async (req, res) => {
  try {
    const { soc, kernelVersion, focus, features } = req.body;
    
    if (!ai) {
      return res.json({
        recommendedConfigs: [
          'CONFIG_KSU=y',
          'CONFIG_KSU_SUSFS=y',
          'CONFIG_OVERLAY_FS=y',
          'CONFIG_WIREGUARD=y',
          'CONFIG_ZRAM=y',
          'CONFIG_ZRAM_DEF_COMP_ZSTD=y',
          'CONFIG_CPU_FREQ_DEFAULT_GOV_SCHEDUTIL=y',
          'CONFIG_SCHED_WALT=y',
          'CONFIG_HZ_300=y',
          'CONFIG_LTO_CLANG_THIN=y'
        ],
        rationale: `Optimized defconfig baseline for ${soc || 'ARM64'} running Linux ${kernelVersion || '5.15'}. Prioritizes ${focus || 'balanced'} profile with modern ZSTD RAM compression and ThinLTO compilation for reduced binary size.`,
        featuresIncluded: features || ['KernelSU', 'WireGuard', 'ZRAM ZSTD'],
        source: 'heuristic_engine'
      });
    }

    const prompt = `Recommend optimized Android kernel defconfig flags and tuning settings for:
SoC: ${soc || 'Qualcomm Snapdragon 8 Gen 2 / GKI'}
Kernel Version: ${kernelVersion || '6.1'}
Optimization Focus: ${focus || 'Performance & Battery balance'}
Target Desired Features: ${JSON.stringify(features || [])}

Provide:
1. recommendedConfigs: list of precise Linux kernel CONFIG_* lines with '=y', '=m', or values
2. rationale: explanation of why these flags boost performance, thermals, or capability
3. featuresIncluded: list of features enabled`;

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI timeout')), 4500)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedConfigs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              rationale: { type: Type.STRING },
              featuresIncluded: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['recommendedConfigs', 'rationale', 'featuresIncluded'],
          },
        },
      }),
      timeoutPromise
    ]);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, source: 'gemini' });
  } catch (err: any) {
    console.error('Defconfig optimizer error/fallback:', err.message);
    return res.json({
      recommendedConfigs: [
        'CONFIG_KSU=y',
        'CONFIG_KSU_SUSFS=y',
        'CONFIG_OVERLAY_FS=y',
        'CONFIG_WIREGUARD=y',
        'CONFIG_ZRAM=y',
        'CONFIG_ZRAM_DEF_COMP_ZSTD=y',
        'CONFIG_CPU_FREQ_DEFAULT_GOV_SCHEDUTIL=y',
        'CONFIG_SCHED_WALT=y',
        'CONFIG_HZ_300=y',
        'CONFIG_LTO_CLANG_THIN=y'
      ],
      rationale: `Defconfig optimized for ${req.body?.soc || 'ARM64'} targeting ${req.body?.focus || 'balanced'}.`,
      featuresIncluded: req.body?.features || ['KernelSU', 'WireGuard', 'ZRAM ZSTD'],
      source: 'heuristic_engine'
    });
  }
});

// API: Kernel Copilot Q&A
app.post('/api/kernel/copilot', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!ai) {
      return res.json({
        answer: `In Android kernel development, building an upstream or OEM kernel requires three main pieces:\n\n1. **Kernel Source Tree & Device Tree**: Usually sourced from Google's android-kernel git (common-android12-5.10, etc.) or OEM GitHub repos (Xiaomi, OnePlus, Google Pixel).\n2. **Clang / LLVM Cross-Compiler**: Modern Android uses prebuilt Google Clang (r487747c or newer). You set \`ARCH=arm64\`, \`CROSS_COMPILE=aarch64-linux-gnu-\`, and \`LLVM=1 LLVM_IAS=1\`.\n3. **Packaging / Flashing**: Modern Android 12+ uses GKI (Generic Kernel Image) where the core Image or boot.img is generic, and vendor drivers reside in vendor_boot or vendor_dlkm. For flashing, developers use AnyKernel3 zips via TWRP or fastboot flash boot boot.img.`,
        source: 'heuristic_engine'
      });
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI timeout')), 4500)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert Android Kernel Architect and Linux maintainer.
Context: ${context || 'Android Custom Kernel compilation, GKI, AnyKernel3, and Device Tree configuration'}
User Question: ${question}

Provide a direct, concrete, highly technical answer with real terminal commands, code snippets, or config keys where appropriate. Be concise and authoritative.`,
      }),
      timeoutPromise
    ]);

    return res.json({ answer: response.text, source: 'gemini' });
  } catch (err: any) {
    console.error('Copilot error/fallback:', err.message);
    return res.json({
      answer: `Building an Android kernel involves cross-compiling with AOSP Clang targeting arm64. Set ARCH=arm64, CROSS_COMPILE=aarch64-linux-gnu-, LLVM=1 LLVM_IAS=1. For modern Android 12+ (GKI), the kernel Image is flashed to boot.img while vendor modules (.ko) reside in vendor_boot/vendor_dlkm. Packaging is typically handled via AnyKernel3.`,
      source: 'heuristic_engine'
    });
  }
});

// Serve frontend in dev and prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AndroKernel Studio server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
