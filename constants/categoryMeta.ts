import { ComponentType } from 'react';
import { NodeCategory } from '@/types/node';
import {
  MonitorSmartphone,
  Network,
  Shield,
  Server,
  Cpu,
  Zap,
  Database as DatabaseIcon,
  Layers,
  HardDrive,
  Activity,
  Bot,
  Boxes,
} from 'lucide-react';

export interface CategoryMetadata {
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  gradientBg: string;
  border: string;
  subtleBorder: string;
}

export const CATEGORY_META: Record<NodeCategory, CategoryMetadata> = {
  [NodeCategory.CLIENT]: {
    label: 'Clients',
    icon: MonitorSmartphone,
    color: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
    gradientBg: 'from-sky-950/30 to-neutral-900/90',
    border: 'border-sky-500/40 hover:border-sky-400',
    subtleBorder: 'border-sky-500/30',
  },
  [NodeCategory.NETWORK]: {
    label: 'Network & Routing',
    icon: Network,
    color: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    gradientBg: 'from-indigo-950/30 to-neutral-900/90',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    subtleBorder: 'border-indigo-500/30',
  },
  [NodeCategory.SECURITY]: {
    label: 'Security',
    icon: Shield,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    gradientBg: 'from-rose-950/30 to-neutral-900/90',
    border: 'border-rose-500/40 hover:border-rose-400',
    subtleBorder: 'border-rose-500/30',
  },
  [NodeCategory.SERVICE]: {
    label: 'Services & APIs',
    icon: Server,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    gradientBg: 'from-emerald-950/30 to-neutral-900/90',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    subtleBorder: 'border-emerald-500/30',
  },
  [NodeCategory.COMPUTE]: {
    label: 'Compute & Workers',
    icon: Cpu,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    gradientBg: 'from-amber-950/30 to-neutral-900/90',
    border: 'border-amber-500/40 hover:border-amber-400',
    subtleBorder: 'border-amber-500/30',
  },
  [NodeCategory.CACHE]: {
    label: 'Caching',
    icon: Zap,
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    gradientBg: 'from-yellow-950/30 to-neutral-900/90',
    border: 'border-yellow-500/40 hover:border-yellow-400',
    subtleBorder: 'border-yellow-500/30',
  },
  [NodeCategory.DATABASE]: {
    label: 'Databases',
    icon: DatabaseIcon,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    gradientBg: 'from-cyan-950/30 to-neutral-900/90',
    border: 'border-cyan-500/40 hover:border-cyan-400',
    subtleBorder: 'border-cyan-500/30',
  },
  [NodeCategory.MESSAGE_QUEUE]: {
    label: 'Messaging & Queues',
    icon: Layers,
    color: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
    gradientBg: 'from-fuchsia-950/30 to-neutral-900/90',
    border: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    subtleBorder: 'border-fuchsia-500/30',
  },
  [NodeCategory.STORAGE]: {
    label: 'Object Storage',
    icon: HardDrive,
    color: 'text-teal-400',
    badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    gradientBg: 'from-teal-950/30 to-neutral-900/90',
    border: 'border-teal-500/40 hover:border-teal-400',
    subtleBorder: 'border-teal-500/30',
  },
  [NodeCategory.MONITORING]: {
    label: 'Monitoring & Logs',
    icon: Activity,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    gradientBg: 'from-purple-950/30 to-neutral-900/90',
    border: 'border-purple-500/40 hover:border-purple-400',
    subtleBorder: 'border-purple-500/30',
  },
  [NodeCategory.AI]: {
    label: 'AI & Intelligence',
    icon: Bot,
    color: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    gradientBg: 'from-blue-950/30 to-neutral-900/90',
    border: 'border-blue-500/40 hover:border-blue-400',
    subtleBorder: 'border-blue-500/30',
  },
  [NodeCategory.EXTERNAL]: {
    label: 'External Services',
    icon: Boxes,
    color: 'text-zinc-400',
    badgeBg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
    gradientBg: 'from-zinc-950/30 to-neutral-900/90',
    border: 'border-zinc-500/40 hover:border-zinc-400',
    subtleBorder: 'border-zinc-500/30',
  },
};

export const DEFAULT_CATEGORY_META: CategoryMetadata = {
  label: 'Other',
  icon: Boxes,
  color: 'text-neutral-300',
  badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  gradientBg: 'from-neutral-900/90 to-neutral-900/90',
  border: 'border-neutral-700 hover:border-neutral-500',
  subtleBorder: 'border-neutral-700',
};
