export type Arch = 'arm64' | 'arm' | 'x86_64';

export type GkiVersion = 'gki-5.10' | 'gki-5.15' | 'gki-6.1' | 'gki-6.6' | 'legacy-4.14' | 'legacy-4.19';

export interface SocPreset {
  id: string;
  name: string;
  vendor: 'Qualcomm' | 'Google' | 'MediaTek' | 'Samsung' | 'Generic';
  codeName: string;
  kernelVersion: string;
  gkiType: 'GKI 2.0' | 'GKI 1.0' | 'Non-GKI (Legacy)' | 'Mainline';
  recommendedClang: string;
  defaultDefconfig: string;
  devices: string[];
  description: string;
  sourceRepoUrl: string;
  sourceBranch: string;
}

export interface DefconfigOption {
  key: string;
  name: string;
  category: 'Root & Hooks' | 'CPU & Scheduler' | 'Memory & Storage' | 'Security & SELinux' | 'Networking';
  description: string;
  defaultValue: boolean | string;
  impact: 'battery' | 'performance' | 'security' | 'modding';
  recommended: boolean;
  dependsOn?: string[];
  kconfigSnippet: string;
}

export interface DiagnosticResult {
  severity: 'error' | 'fatal_panic' | 'warning' | 'investigation';
  subsystem: string;
  rootCause: string;
  solution: string;
  patch: string;
  confidence: number;
  relatedConfigs: string[];
}

export interface BuildLogLine {
  id: string;
  timestamp: string;
  type: 'info' | 'cmd' | 'compile' | 'warn' | 'success' | 'link';
  text: string;
}
