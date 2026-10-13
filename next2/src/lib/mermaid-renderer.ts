import { normalizeLegacyDemoProcessMap } from './mermaid-source';
import DOMPurify from 'dompurify';

// Imported by client components only. Mermaid is loaded when a diagram is viewed.
let engine: Promise<(typeof import('mermaid'))['default']> | undefined;
let renderSequence = 0;

async function getEngine() {
  if (!engine) {
    engine = import('mermaid')
      .then(({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          suppressErrorRendering: true,
          htmlLabels: false,
          maxTextSize: 50000,
          theme: 'base',
          themeVariables: {
            primaryColor: '#fff2ec',
            primaryTextColor: '#24292d',
            primaryBorderColor: '#db7149',
            lineColor: '#69747d',
            secondaryColor: '#f3f5f6',
            tertiaryColor: '#ffffff',
            fontFamily: 'Inter, Arial, sans-serif',
            fontSize: '14px',
          },
          flowchart: { htmlLabels: false, useMaxWidth: false },
        });
        return mermaid;
      })
      .catch((error) => {
        engine = undefined;
        throw error;
      });
  }
  return engine;
}

export function mermaidError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'The diagram could not be rendered. Check the Mermaid source.';
  return message.replace(/<[^>]*>/g, '').slice(0, 1600);
}

export async function renderMermaid(content: string) {
  if (!content.trim())
    throw new Error('Add a Mermaid diagram to see its preview.');
  if (content.length > 50000)
    throw new Error(
      'This diagram is too large for the editor. Use fewer than 50,000 characters.',
    );
  const mermaid = await getEngine();
  const source = normalizeLegacyDemoProcessMap(content);
  await mermaid.parse(source);
  const scratch = document.createElement('div');
  // Mermaid needs a mounted element to measure labels. Keep it out of the page layout.
  scratch.style.cssText =
    'position:fixed;left:-100000px;top:0;width:1200px;visibility:hidden;pointer-events:none';
  scratch.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scratch);
  try {
    const { svg } = await mermaid.render(
      `tx_mermaid_${++renderSequence}`,
      source,
      scratch,
    );
    // Treat even renderer-generated markup as untrusted at the DOM boundary.
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  } finally {
    scratch.remove();
  }
}
