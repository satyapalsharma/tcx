import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const page = document.querySelector('.page');
    if (!page || page.hasAttribute('data-no-reveal')) return;
    const picks: HTMLElement[] = [];
    let h: HTMLElement | null = null;
    Array.from(page.children).forEach((el) => {
      const node = el as HTMLElement;
      if (!h && node.classList.contains('page-h')) { h = node; return; }
      if (picks.length >= 3 || node.tagName === 'SCRIPT' || !node.classList) return;
      const cls = node.className || '';
      if (node.hasAttribute('data-od-id') || node.classList.contains('card') ||
          node.classList.contains('tabs') || /\bgrid-[234]\b/.test(cls) ||
          node.hasAttribute('data-tab-scope')) picks.push(node);
    });
    const groups: HTMLElement[] = [...(h ? [h] : []), ...picks].slice(0, 4);
    groups.forEach((el, i) => {
      el.classList.add('reveal-in');
      (el as HTMLElement).style.animationDelay = `${i * 55}ms`;
    });
    setTimeout(() => {
      groups.forEach((el) => { (el as HTMLElement).style.animationDelay = ''; });
    }, 800 + groups.length * 55);
  }, []);
}
