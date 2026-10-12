export function parseDiagramSteps(content = ''): string[] {
  if (/^\s*sequenceDiagram\b/m.test(content)) {
    const labels: string[] = [];
    for (const line of content.split('\n')) {
      const participant = line.match(/^\s*participant\s+([\w.-]+)(?:\s+as\s+(.+))?\s*$/);
      if (participant) {
        labels.push(`Participant: ${(participant[2] ?? participant[1]).trim()}`);
        continue;
      }
      const message = line.match(/^\s*[\w.-]+\s*(?:--?>>?|->>?)\s*[\w.-]+:\s*(.+)$/);
      if (message) labels.push(`Message: ${message[1].trim()}`);
    }
    return labels;
  }

  const seen = new Set<string>();
  const labels: string[] = [];
  const declaration = /\b([\w.-]+)\s*(?:\[([^\]]+)\]|\{([^}]+)\})/g;
  for (const match of content.matchAll(declaration)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    labels.push((match[2] ?? match[3]).trim());
  }
  return labels;
}

export function replaceDiagramSteps(content: string, labels: string[]): string {
  if (/^\s*sequenceDiagram\b/m.test(content)) {
    let index = 0;
    return content.split('\n').map((line) => {
      const participant = line.match(/^(\s*participant\s+)([\w.-]+)(?:\s+as\s+(.+))?(\s*)$/);
      if (participant) {
        const label = labels[index++]?.replace(/^Participant:\s*/i, '').trim();
        if (label === undefined) return line;
        const alias = label.trim();
        return alias === participant[2]
          ? `${participant[1]}${participant[2]}${participant[4]}`
          : `${participant[1]}${participant[2]} as ${alias}${participant[4]}`;
      }
      const message = line.match(/^(\s*[\w.-]+\s*(?:--?>>?|->>?)\s*[\w.-]+:\s*)(.+)$/);
      if (message) {
        const label = labels[index++]?.replace(/^Message:\s*/i, '');
        return label === undefined ? line : `${message[1]}${label}`;
      }
      return line;
    }).join('\n');
  }

  const labelById = new Map<string, string>();
  const declaration = /\b([\w.-]+)\s*(?:\[([^\]]+)\]|\{([^}]+)\})/g;
  let index = 0;
  for (const match of content.matchAll(declaration)) {
    if (labelById.has(match[1])) continue;
    labelById.set(match[1], labels[index] ?? (match[2] ?? match[3]).trim());
    index++;
  }

  return content.replace(/\b([\w.-]+)(\s*)(\[([^\]]+)\]|\{([^}]+)\})/g, (whole, id: string, space: string, shape: string) => {
    const label = labelById.get(id);
    if (label === undefined) return whole;
    const open = shape[0];
    const close = shape[shape.length - 1];
    return `${id}${space}${open}${label}${close}`;
  });
}

export type ProcessNode = { id: string; label: string; decision: boolean };
export type ProcessConnection = { from: string; to: string };
const flowDeclaration = /\b([\w.-]+)\s*(?:\[([^\]]+)\]|\{([^}]+)\})/g;
const flowEdge = /^\s*([\w.-]+)(?:\[([^\]]+)\]|\{([^}]+)\})?\s*-->(?:\|[^|]*\|)?\s*([\w.-]+)(?:\[([^\]]+)\]|\{([^}]+)\})?\s*$/;

export function parseProcessNodes(content: string): ProcessNode[] {
  const seen = new Set<string>();
  const nodes: ProcessNode[] = [];
  for (const match of content.matchAll(flowDeclaration)) {
    if (seen.has(match[1])) continue;
    seen.add(match[1]);
    nodes.push({ id: match[1], label: (match[2] ?? match[3]).trim(), decision: Boolean(match[3]) });
  }
  return nodes;
}

export function parseProcessConnections(content: string): ProcessConnection[] {
  return content.split('\n').flatMap((line) => {
    const match = line.match(flowEdge);
    return match ? [{ from: match[1], to: match[4] }] : [];
  });
}

export function addProcessNode(content: string, label: string): { content: string; node: ProcessNode } {
  const cleanLabel = label.replace(/[\r\n\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim() || 'New process step';
  const base = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 28) || 'new_step';
  const usedIds = new Set(parseProcessNodes(content).map((node) => node.id));
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) id = `${base}_${suffix++}`;
  const node = { id, label: cleanLabel, decision: false };
  return { content: `${content.replace(/\s*$/, '')}\n  ${id}[${cleanLabel}]`, node };
}

export function removeProcessNode(content: string, id: string): string {
  const kept: string[] = [];
  const declarations: string[] = [];
  for (const line of content.split('\n')) {
    const edge = line.match(flowEdge);
    if (edge && (edge[1] === id || edge[4] === id)) {
      if (edge[1] !== id && (edge[2] || edge[3])) declarations.push(`  ${edge[1]}${edge[2] ? `[${edge[2]}]` : `{${edge[3]}}`}`);
      if (edge[4] !== id && (edge[5] || edge[6])) declarations.push(`  ${edge[4]}${edge[5] ? `[${edge[5]}]` : `{${edge[6]}}`}`);
      continue;
    }
    const declarationsOnLine = [...line.matchAll(flowDeclaration)];
    if (declarationsOnLine.some((match) => match[1] === id)) {
      const edge = line.match(flowEdge);
      if (edge && edge[1] !== id && edge[4] !== id) kept.push(line);
      else if (edge) {
        if (edge[1] !== id && (edge[2] || edge[3])) kept.push(`  ${edge[1]}${edge[2] ? `[${edge[2]}]` : `{${edge[3]}}`}`);
        if (edge[4] !== id && (edge[5] || edge[6])) kept.push(`  ${edge[4]}${edge[5] ? `[${edge[5]}]` : `{${edge[6]}}`}`);
      }
      continue;
    }
    kept.push(line);
  }
  return [...kept, ...declarations].join('\n');
}

export function connectProcessNodes(content: string, from: string, to: string): string {
  if (from === to || !parseProcessNodes(content).some((node) => node.id === from) || !parseProcessNodes(content).some((node) => node.id === to)) return content;
  if (parseProcessConnections(content).some((edge) => edge.from === from && edge.to === to)) return content;
  return `${content.replace(/\s*$/, '')}\n  ${from} --> ${to}`;
}

export function disconnectProcessNodes(content: string, from: string, to: string): string {
  const kept: string[] = [];
  const declarations: string[] = [];
  for (const line of content.split('\n')) {
    const edge = line.match(flowEdge);
    if (!edge || edge[1] !== from || edge[4] !== to) { kept.push(line); continue; }
    if (edge[2] || edge[3]) declarations.push(`  ${edge[1]}${edge[2] ? `[${edge[2]}]` : `{${edge[3]}}`}`);
    if (edge[5] || edge[6]) declarations.push(`  ${edge[4]}${edge[5] ? `[${edge[5]}]` : `{${edge[6]}}`}`);
  }
  return [...kept, ...declarations].join('\n');
}
