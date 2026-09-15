import type { SVGProps } from 'react';

export type IconName =
  | 'grid' | 'chart' | 'flow' | 'code' | 'plug' | 'users' | 'scroll' | 'gear' | 'out'
  | 'check' | 'chev' | 'chevr' | 'plus' | 'upload' | 'search' | 'download' | 'copy'
  | 'bell' | 'x' | 'clock' | 'warn' | 'info' | 'bolt' | 'eye' | 'filter' | 'ext'
  | 'lock' | 'mail' | 'shield' | 'sync' | 'folder' | 'file' | 'branch' | 'rocket'
  | 'key' | 'play' | 'pause' | 'arrowr' | 'minus' | 'dot' | 'more' | 'globe' | 'trash'
  | 'edit' | 'robot' | 'send' | 'flag' | 'target' | 'cloud' | 'merge' | 'db';

const PATHS: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-8M2 20h20"/></>,
  flow: <><rect x="3" y="4" width="6" height="4.5" rx="1.2"/><rect x="15" y="4" width="6" height="4.5" rx="1.2"/><rect x="9" y="15.5" width="6" height="4.5" rx="1.2"/><path d="M6 8.5v3a2 2 0 0 0 2 2h1M18 8.5v3a2 2 0 0 1-2 2h-1M12 13.5v2"/></>,
  code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></>,
  plug: <><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7z"/><path d="M12 16v5"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.2 3.4-5 6.5-5s5.9 1.8 6.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M18 15.2c2 .4 3 1.9 3.5 3.8"/></>,
  scroll: <><path d="M7 3h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7"/><path d="M7 3a2 2 0 0 1 2 2v13a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2z"/><path d="M11 8h6M11 12h6M11 16h3"/></>,
  gear: <><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></>,
  out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  check: <path d="m4.5 12.5 5 5 10-11"/>,
  chev: <path d="m6 9 6 6 6-6"/>,
  chevr: <path d="m9 6 6 6-6 6"/>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.6-4.6"/></>,
  download: <><path d="M12 4v12m0 0 5-5m-5 5-5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></>,
  x: <><path d="m5 5 14 14M19 5 5 19"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  warn: <><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".7" fill="currentColor"/></>,
  bolt: <path d="M13 2 4.5 13.5H11L9.5 22 19 10h-6.5L13 2z"/>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></>,
  filter: <path d="M3 5h18l-7 8v5.5L10 21v-8L3.5 5z"/>,
  ext: <><path d="M14 4h6v6M20 4 11 13"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></>,
  shield: <><path d="M12 3 4.5 6v6c0 4.5 3.2 7.7 7.5 9 4.3-1.3 7.5-4.5 7.5-9V6L12 3z"/><path d="m9 11.5 2 2 4-4"/></>,
  sync: <><path d="M20 4.5v5h-5"/><path d="M4 19.5v-5h5"/><path d="M20 9.5a8 8 0 0 0-14.9-3M4 14.5a8 8 0 0 0 14.9 3"/></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>,
  file: <><path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5L14 2.5z"/><path d="M14 2.5v5h5"/></>,
  branch: <><circle cx="6" cy="6" r="2.6"/><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="9" r="2.6"/><path d="M6 8.6v6.8M18 11.6c0 5-6 3.4-9.6 4.9"/></>,
  rocket: <><path d="M5 16c-1.5 1.2-2 5-2 5s3.8-.5 5-2M15 3.5c3.5-2 8.5 2 6.5 6-2.5 5-8 8-8 8s-2.5 0-4-1.5c-1-1-1.5-2.6-1.5-2.6s3-5.5 8-8z"/><circle cx="14.5" cy="9.5" r="1.8"/></>,
  key: <><circle cx="8" cy="14" r="4.5"/><path d="m11.2 10.8 8-8M16 4l3 3M13.5 6.5l2.5 2.5"/></>,
  play: <path d="M7 4.5v15l12-7.5-12-7.5z"/>,
  pause: <><path d="M7 4.5h3v15H7zM14 4.5h3v15h-3z"/></>,
  arrowr: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  minus: <path d="M5 12h14"/>,
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>,
  more: <><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.3 3.8 5.6 3.8 9s-1.3 6.7-3.8 9c-2.5-2.3-3.8-5.6-3.8-9S9.5 5.3 12 3z"/></>,
  trash: <><path d="M4 7h16M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M6 7l1 12.8A1.2 1.2 0 0 0 8.2 21h7.6A1.2 1.2 0 0 0 17 19.8L18 7"/><path d="M10 11v6M14 11v6"/></>,
  edit: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M14.5 6.5l3 3"/></>,
  robot: <><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4.5V8M9 14h.01M15 14h.01M8.5 20v1.4M15.5 20v1.4"/></>,
  send: <><path d="M4 12 20 4l-3 8 3 8-16-8z"/><path d="M11 12h9"/></>,
  flag: <path d="M5 21.5V3.5M5 4.5h12l-2 4 2 4H5"/>,
  target: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></>,
  cloud: <path d="M7 18.5A4.2 4.2 0 0 1 6.7 10 5.4 5.4 0 0 1 17 9.4a3.83 3.83 0 0 1-.4 9.1H7z"/>,
  merge: <><path d="M7 4v4a4 4 0 0 0 4 4h6M7 20v-4a4 4 0 0 1 4-4M17 8l-3-3M17 8l-3 3M17 16l-3-3M17 16l-3 3"/></>,
  db: <><ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13"/><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8"/></>,
};

export function iconId(name: IconName): string {
  return `i-${name}`;
}

type Props = SVGProps<SVGSVGElement> & { name: IconName; large?: boolean };

export function Icon({ name, large, className = '', ...rest }: Props) {
  return (
    <svg className={`i${large ? ' i-lg' : ''} ${className}`.trim()} aria-hidden="true" {...rest}>
      {PATHS[name]}
    </svg>
  );
}
