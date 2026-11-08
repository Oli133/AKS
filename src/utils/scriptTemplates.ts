import { SocPreset, DefconfigOption } from '../types/kernel';

export function generateBuildScript(soc: SocPreset, selectedConfigs: DefconfigOption[], customDefconfigName: string = 'custom_defconfig'): string {
  const enabledConfigLines = selectedConfigs.map(c => c.kconfigSnippet).join('\n');

  return `#!/usr/bin/env bash
# ==============================================================================
# AndroKernel Studio - Production Kernel Build Script
# Target: ${soc.name} (${soc.codeName})
# Kernel: Linux ${soc.kernelVersion} (${soc.gkiType})
# ==============================================================================

set -euo pipefail

# 1. Environment & Paths Configuration
export ARCH=arm64
export SUBARCH=arm64
export KBUILD_BUILD_USER="kernel_dev"
export KBUILD_BUILD_HOST="androkernel-ci"

WORKDIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="\${WORKDIR}/out"
CLANG_DIR="\${WORKDIR}/toolchain/clang"
ANYKERNEL_DIR="\${WORKDIR}/AnyKernel3"
LOG_FILE="\${WORKDIR}/build.log"

# Multi-threading (cores + 2 for optimal I/O overlap)
THREADS=$(nproc --all || echo 8)

echo "=================================================="
echo " Starting Android Kernel Build for ${soc.name}"
echo " Linux Version: ${soc.kernelVersion} | Architecture: arm64"
echo " Cores: \${THREADS} | Clang: ${soc.recommendedClang}"
echo "=================================================="

# 2. Toolchain Verification
if [ ! -d "\${CLANG_DIR}/bin" ]; then
    echo ">> Clang toolchain not found at \${CLANG_DIR}. Downloading recommended AOSP Clang..."
    mkdir -p "\${CLANG_DIR}"
    # Example fetching AOSP prebuilt LLVM
    curl -L "https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/+archive/refs/heads/main/clang-r487747c.tar.gz" -o /tmp/clang.tar.gz
    tar -xzf /tmp/clang.tar.gz -C "\${CLANG_DIR}"
    rm -f /tmp/clang.tar.gz
fi

export PATH="\${CLANG_DIR}/bin:\${PATH}"
export LD_LIBRARY_PATH="\${CLANG_DIR}/lib64:\${LD_LIBRARY_PATH:-}"

echo ">> Compiler: $(\${CLANG_DIR}/bin/clang --version | head -n 1)"

# 3. Clean or Prepare Out Directory
mkdir -p "\${OUT_DIR}"

# 4. Generate Defconfig with Custom Snippets
echo ">> Generating target configuration (${soc.defaultDefconfig})..."
make O="\${OUT_DIR}" ARCH=arm64 ${soc.defaultDefconfig.split(' ')[0]}

# Append customized feature flags
cat << 'EOF' >> "\${OUT_DIR}/.config"
# --- AndroKernel Studio Custom Defconfig Fragment ---
${enabledConfigLines}
# ---------------------------------------------------
EOF

# Update configuration against Kconfig dependencies
echo ">> Refreshing and verifying Kconfig dependencies..."
make O="\${OUT_DIR}" ARCH=arm64 olddefconfig

# 5. Compilation Step
echo ">> Compiling kernel image and DTBs..."
START_TIME=$(date +%s)

make -j\${THREADS} O="\${OUT_DIR}" \\
    ARCH=arm64 \\
    CC=clang \\
    LLVM=1 \\
    LLVM_IAS=1 \\
    CROSS_COMPILE=aarch64-linux-gnu- \\
    CROSS_COMPILE_COMPAT=arm-linux-gnueabi- \\
    Image Image.gz Image.lz4 dtbs modules 2>&1 | tee "\${LOG_FILE}"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
echo ">> Kernel compilation completed in $((ELAPSED / 60))m $((ELAPSED % 60))s."

# 6. Check for Compiled Kernel Image
KERNEL_IMAGE=""
if [ -f "\${OUT_DIR}/arch/arm64/boot/Image.gz" ]; then
    KERNEL_IMAGE="\${OUT_DIR}/arch/arm64/boot/Image.gz"
elif [ -f "\${OUT_DIR}/arch/arm64/boot/Image" ]; then
    KERNEL_IMAGE="\${OUT_DIR}/arch/arm64/boot/Image"
fi

if [ -z "\${KERNEL_IMAGE}" ]; then
    echo "!! ERROR: Kernel Image not found! Build failed. Check \${LOG_FILE}" >&2
    exit 1
fi

echo ">> Successfully built kernel: \${KERNEL_IMAGE} ($(ls -lh "\${KERNEL_IMAGE}" | awk '{print $5}'))"

# 7. Package Flashable AnyKernel3 Zip
if [ -d "\${ANYKERNEL_DIR}" ]; then
    echo ">> Packaging flashable AnyKernel3 zip..."
    cp "\${KERNEL_IMAGE}" "\${ANYKERNEL_DIR}/"
    find "\${OUT_DIR}/arch/arm64/boot/dts" -name "*.dtb" -exec cp {} "\${ANYKERNEL_DIR}/dtb" \\; 2>/dev/null || true
    
    cd "\${ANYKERNEL_DIR}"
    ZIP_NAME="Kernel-${soc.codeName}-$(date +%Y%m%d-%H%M).zip"
    zip -r9 "\${WORKDIR}/\${ZIP_NAME}" * -x .git README.md *placeholder
    cd "\${WORKDIR}"
    
    echo ">> Flashable ZIP ready: \${WORKDIR}/\${ZIP_NAME}"
    echo ">> MD5: $(md5sum "\${WORKDIR}/\${ZIP_NAME}" | awk '{print $1}')"
fi

echo ">> All tasks completed successfully!"
`;
}

export function generateGitHubWorkflow(soc: SocPreset): string {
  return `name: Build Android Kernel CI

on:
  push:
    branches: [ "main", "android-*" ]
  workflow_dispatch:

jobs:
  build-kernel:
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout Kernel Source Tree
        uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Install Build Prerequisites
        run: |
          sudo apt-get update
          sudo apt-get install -y --no-install-recommends \\
            bc bison build-essential ccache curl flex g++-multilib gcc-multilib \\
            git gnupg gperf libelf-dev libncurses5-dev libssl-dev lz4 lzop \\
            python3 rsync unzip zip zlib1g-dev

      - name: Setup AOSP Clang Toolchain
        run: |
          mkdir -p toolchain/clang
          cd toolchain/clang
          # Fetch recommended prebuilt Clang for ${soc.name}
          wget -q https://android.googlesource.com/platform/prebuilts/clang/host/linux-x86/+archive/refs/heads/main/clang-r487747c.tar.gz
          tar -xzf clang-r487747c.tar.gz
          rm -f clang-r487747c.tar.gz
          echo "$(pwd)/bin" >> $GITHUB_PATH

      - name: Setup ccache
        uses: actions/cache@v4
        with:
          path: ~/.ccache
          key: \${{ runner.os }}-kernel-ccache-\${{ github.sha }}
          restore-keys: |
            \${{ runner.os }}-kernel-ccache-

      - name: Compile Kernel Image & Modules
        run: |
          export ARCH=arm64
          export SUBARCH=arm64
          export KBUILD_BUILD_USER="runner"
          export KBUILD_BUILD_HOST="github-ci"
          export USE_CCACHE=1
          export CCACHE_DIR=~/.ccache
          
          mkdir -p out
          make O=out ARCH=arm64 ${soc.defaultDefconfig.split(' ')[0]}
          make -j$(nproc) O=out ARCH=arm64 CC="ccache clang" LLVM=1 LLVM_IAS=1 \\
            CROSS_COMPILE=aarch64-linux-gnu- \\
            CROSS_COMPILE_COMPAT=arm-linux-gnueabi- \\
            Image.gz dtbs

      - name: Package with AnyKernel3
        run: |
          git clone --depth=1 https://github.com/osm0sis/AnyKernel3.git AnyKernel3
          cp out/arch/arm64/boot/Image.gz AnyKernel3/ || cp out/arch/arm64/boot/Image AnyKernel3/
          cd AnyKernel3
          zip -r9 ../Kernel-${soc.codeName}-flashable.zip * -x .git README.md

      - name: Upload Flashable Kernel Release
        uses: actions/upload-artifact@v4
        with:
          name: Kernel-${soc.codeName}-flashable
          path: Kernel-${soc.codeName}-flashable.zip
`;
}

export function generateDockerfile(soc: SocPreset): string {
  return `# Containerized Android Kernel Build Environment
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV ARCH=arm64
ENV SUBARCH=arm64

# Install essential AOSP/Kernel build packages
RUN apt-get update && apt-get install -y --no-install-recommends \\
    bc \\
    bison \\
    build-essential \\
    ca-certificates \\
    ccache \\
    cpio \\
    curl \\
    flex \\
    git \\
    kmod \\
    libelf-dev \\
    libncurses5-dev \\
    libssl-dev \\
    lz4 \\
    python3 \\
    rsync \\
    unzip \\
    wget \\
    xz-utils \\
    zip \\
    zlib1g-dev \\
    && rm -rf /var/lib/apt/lists/*

# Setup workspace
WORKDIR /workspace

# Default command invokes build.sh
CMD ["bash", "build.sh"]
`;
}

export function generateAnyKernelScript(soc: SocPreset): string {
  return `### AnyKernel3 Packaging Script for ${soc.name}
### Device: ${soc.codeName}

# AnyKernel properties
properties() { '
kernel.string=AndroKernel Custom for ${soc.name}
do.devicecheck=1
do.modules=0
do.systemless=1
do.cleanup=1
do.cleanuponabort=0
device.name1=${soc.codeName}
supported.versions=12 - 15
supported.patchlevels=
'; }

# Shell variables
block=boot;
is_slot_device=auto;
ramdisk_compression=auto;
patch_vbmeta_flag=auto;

# Import AnyKernel tools
. tools/ak3-core.sh;

# Dump boot and unpack ramdisk
split_boot;

# Flash new kernel image & dtb
flash_boot;

# Done!
`;
}
