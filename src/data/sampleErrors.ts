export interface SampleError {
  id: string;
  title: string;
  category: 'Linker (LLD)' | 'Panic / VFS' | 'Compiler Header' | 'SELinux AVC' | 'Clang Toolchain';
  description: string;
  log: string;
}

export const SAMPLE_ERRORS: SampleError[] = [
  {
    id: 'lld-undefined-symbol',
    title: 'Linker Error: Undefined symbol (ld.lld)',
    category: 'Linker (LLD)',
    description: 'Common when porting features or missing driver symbols in aarch64-linux-gnu LLD linker step.',
    log: `  LD      vmlinux.o
  MODPOST vmlinux.symvers
  LD      .tmp_vmlinux.kallsyms1
ld.lld: error: undefined symbol: sched_tune_enqueue_task
>>> referenced by core.c:2145 (kernel/sched/core.c:2145)
>>>               kernel/sched/core.o:(activate_task)
>>> referenced by fair.c:5412 (kernel/sched/fair.c:5412)
>>>               kernel/sched/fair.o:(enqueue_task_fair)
ld.lld: error: undefined symbol: ksu_handle_prctl
>>> referenced by sys.c:2391 (kernel/sys.c:2391)
>>>               kernel/sys.o:(__do_sys_prctl)
make[1]: *** [Makefile:1182: vmlinux] Error 1
make: *** [Makefile:222: __sub-make] Error 2`,
  },
  {
    id: 'vfs-rootfs-panic',
    title: 'Boot Panic: VFS: Unable to mount root fs',
    category: 'Panic / VFS',
    description: 'Device boots into Qualcomm crashdump or fastboot because ramdisk compression or block device driver is missing.',
    log: `[    1.849201] Freeing unused kernel memory: 5632K
[    1.854312] Run /init as init process
[    1.859102] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)
[    1.865421] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 5.15.148-android14-9-gki #1
[    1.872390] Hardware name: Qualcomm Technologies, Inc. SM8550 (DT)
[    1.879100] Call trace:
[    1.882100]  dump_backtrace+0x0/0x1e0
[    1.886200]  show_stack+0x20/0x30
[    1.890100]  panic+0x180/0x3a4
[    1.894000]  mount_block_root+0x2c0/0x334
[    1.898100]  mount_root+0x68/0x88
[    1.902000]  prepare_namespace+0x14c/0x184
[    1.906100]  kernel_init+0x20/0x138
[    1.910000]  ret_from_fork+0x10/0x20
[    1.914200] Kernel Offset: 0x2b800000 from 0xffffffc008000000
[    1.920100] ---[ end Kernel panic - not syncing: VFS: Unable to mount root fs ]---`,
  },
  {
    id: 'implicit-declaration',
    title: 'Compiler Error: Implicit declaration of function',
    category: 'Compiler Header',
    description: 'Triggered when a C source file invokes a kernel API without the appropriate header included or during -Werror builds.',
    log: `  CC      drivers/kernelsu/core.o
drivers/kernelsu/core.c:184:5: error: implicit declaration of function 'setup_new_exec' is invalid in C99 [-Werror,-Wimplicit-function-declaration]
    setup_new_exec(bprm);
    ^
drivers/kernelsu/core.c:184:5: note: did you mean 'begin_new_exec'?
/workspace/kernel/include/linux/binfmts.h:122:12: note: 'begin_new_exec' declared here
extern int begin_new_exec(struct linux_binprm * bprm);
1 error generated.
make[2]: *** [scripts/Makefile.build:288: drivers/kernelsu/core.o] Error 1
make[1]: *** [scripts/Makefile.build:555: drivers/kernelsu] Error 2
make: *** [Makefile:1846: drivers] Error 2`,
  },
  {
    id: 'clang-unsupported-arg',
    title: 'Toolchain Error: Clang unknown argument / flag mismatch',
    category: 'Clang Toolchain',
    description: 'GCC-to-Clang migration flag error where unsupported flags are passed in KCFLAGS or Makefile.',
    log: `clang-17: error: unknown argument: '-mno-android'
clang-17: error: unsupported option '-fstack-protector-strong' for target 'aarch64-linux-gnu' with current toolchain configuration
clang-17: error: argument unused during compilation: '-Wa,-gdwarf-2' [-Werror,-Wunused-command-line-argument]
make[1]: *** [scripts/Makefile.build:288: init/main.o] Error 1
make: *** [Makefile:1846: init] Error 2`,
  },
  {
    id: 'selinux-avc-denial',
    title: 'SELinux AVC Denial: Bootloop on init zygote',
    category: 'SELinux AVC',
    description: 'Android init fails to launch zygote or surfaceflinger due to missing capability or enforce mode denial.',
    log: `[    8.210940] type=1400 audit(1700000000.120:4): avc:  denied  { execute } for  pid=481 comm="init" path="/system/bin/app_process64" dev="dm-0" ino=1420 scontext=u:r:init:s0 tcontext=u:object_r:zygote_exec:s0 tclass=file permissive=0
[    8.225102] init: Service 'zygote' (pid 481) exited with status 1
[    8.231200] init: Sending signal 9 to service 'zygote' (pid 481) process group...
[    8.238400] init: Service 'zygote' is being restarted...
[    8.245000] init: Critical service 'zygote' failed 4 times in 4 minutes; rebooting into recovery mode`,
  },
];
