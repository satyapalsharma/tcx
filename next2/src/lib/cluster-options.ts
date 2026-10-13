import type { Artifact } from '@/data/pipeline';

export type ClusterOption = { value: string; label: string };

/** Decode a bounded L1/L2/L3 hierarchy for the optional process-map scope. */
export function getClusterOptions(artifact?: Artifact): ClusterOption[] {
  if (artifact?.kind !== 'clusters') return [];
  try {
    const roots: unknown = JSON.parse(artifact.content ?? '[]');
    if (!Array.isArray(roots)) return [];
    const options: ClusterOption[] = [];
    const seen = new Set<string>();
    const visit = (
      items: unknown[],
      depth: number,
      parentPath = '',
    ): boolean => {
      for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item))
          return false;
        const node = item as Record<string, unknown>;
        if (
          typeof node.id !== 'string' ||
          !node.id.trim() ||
          seen.has(node.id) ||
          typeof node.name !== 'string' ||
          !node.name.trim() ||
          node.level !== `L${depth}`
        )
          return false;
        seen.add(node.id);
        const label = parentPath ? `${parentPath} / ${node.name}` : node.name;
        options.push({ value: node.id, label });
        if (
          node.children !== undefined &&
          (!Array.isArray(node.children) ||
            (depth === 3 && node.children.length > 0) ||
            (depth < 3 && !visit(node.children, depth + 1, label)))
        )
          return false;
      }
      return true;
    };
    return visit(roots, 1) ? options : [];
  } catch {
    return [];
  }
}
