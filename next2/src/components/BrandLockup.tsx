import Image from 'next/image';

/** Use the original EXL wordmark with a neutral divider and product name. */
export function BrandLockup({ inverse = false }: { inverse?: boolean }) {
  return <span className="flex min-w-0 items-center gap-3">
    <Image src="/EXL_Service_logo.svg.webp" alt="EXL" width={1280} height={476} unoptimized className="h-[18px] w-auto shrink-0" />
    <span aria-hidden="true" className={`h-6 w-px shrink-0 ${inverse ? 'bg-white/20' : 'bg-border-strong'}`} />
    <span className={`text-sm font-semibold tracking-tight ${inverse ? 'text-white' : 'text-foreground'}`}>Transform.cx</span>
  </span>;
}
