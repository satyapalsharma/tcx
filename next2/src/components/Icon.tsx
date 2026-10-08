import type { SVGProps } from 'react';
import { cn } from 'cn';
import {
  LayoutGrid,
  BarChart2,
  Workflow,
  Code,
  Plug,
  Users,
  Scroll,
  Settings,
  LogOut,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  Search,
  Download,
  Copy,
  Bell,
  X,
  Clock,
  AlertTriangle,
  Info,
  Zap,
  Eye,
  Filter,
  ExternalLink,
  Lock,
  Mail,
  Shield,
  RefreshCw,
  Folder,
  File,
  GitFork,
  Rocket,
  Key,
  Play,
  Pause,
  ArrowRight,
  Minus,
  Circle,
  MoreHorizontal,
  Globe,
  Trash2,
  Pencil,
  Bot,
  Send,
  Flag,
  Target,
  Cloud,
  GitMerge,
  Database,
  Menu,
  type LucideIcon,
} from 'lucide-react';

export type IconName =
  | 'grid' | 'chart' | 'flow' | 'code' | 'plug' | 'users' | 'scroll' | 'gear' | 'out'
  | 'check' | 'chev' | 'chevr' | 'plus' | 'upload' | 'search' | 'download' | 'copy'
  | 'bell' | 'x' | 'clock' | 'warn' | 'info' | 'bolt' | 'eye' | 'filter' | 'ext'
  | 'lock' | 'mail' | 'shield' | 'sync' | 'folder' | 'file' | 'branch' | 'rocket'
  | 'key' | 'play' | 'pause' | 'arrowr' | 'minus' | 'dot' | 'more' | 'globe' | 'trash'
  | 'edit' | 'robot' | 'send' | 'flag' | 'target' | 'cloud' | 'merge' | 'db' | 'menu';

const LUCIDE_MAP: Record<IconName, LucideIcon> = {
  grid: LayoutGrid,
  chart: BarChart2,
  flow: Workflow,
  code: Code,
  plug: Plug,
  users: Users,
  scroll: Scroll,
  gear: Settings,
  out: LogOut,
  check: Check,
  chev: ChevronDown,
  chevr: ChevronRight,
  plus: Plus,
  upload: Upload,
  search: Search,
  download: Download,
  copy: Copy,
  bell: Bell,
  x: X,
  clock: Clock,
  warn: AlertTriangle,
  info: Info,
  bolt: Zap,
  eye: Eye,
  filter: Filter,
  ext: ExternalLink,
  lock: Lock,
  mail: Mail,
  shield: Shield,
  sync: RefreshCw,
  folder: Folder,
  file: File,
  branch: GitFork,
  rocket: Rocket,
  key: Key,
  play: Play,
  pause: Pause,
  arrowr: ArrowRight,
  minus: Minus,
  dot: Circle,
  more: MoreHorizontal,
  globe: Globe,
  trash: Trash2,
  edit: Pencil,
  robot: Bot,
  send: Send,
  flag: Flag,
  target: Target,
  cloud: Cloud,
  merge: GitMerge,
  db: Database,
  menu: Menu,
};

export function iconId(name: IconName): string {
  return `i-${name}`;
}

type Props = SVGProps<SVGSVGElement> & { name: IconName; large?: boolean };

export function Icon({ name, large, className = '', ...rest }: Props) {
  const LucideComp = LUCIDE_MAP[name];
  if (!LucideComp) return null;
  return (
    <LucideComp
      className={cn('tx-icon shrink-0', large ? 'size-[18px]' : 'size-4', className)}
      strokeWidth={1.8}
      aria-hidden="true"
      {...rest}
    />
  );
}
