import type { ClusterNode } from '@/data/pipeline';
import type { TranscriptRecord } from '@/lib/job-analytics';

export type ClusterAction =
  | { type: 'rename'; id: string; name: string }
  | { type: 'merge'; sourceId: string; targetId: string }
  | { type: 'move'; id: string; parentId: string };

export type ClusterRevision = { taxonomy: ClusterNode[]; records: TranscriptRecord[] };

export class ClusterOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClusterOperationError';
  }
}

/** Revises a taxonomy and its transcript assignments without mutating either input. */
export function reviseClusters(taxonomy: ClusterNode[], records: TranscriptRecord[], action: ClusterAction): ClusterRevision {
  if (!action || typeof action !== 'object' || !('type' in action) || !['rename', 'merge', 'move'].includes(action.type)) throw new ClusterOperationError('Choose a valid taxonomy operation.');
  validateTaxonomy(taxonomy);
  validateRecords(records, taxonomy);
  const nextTaxonomy = taxonomy.map(cloneNode);
  let nextRecords = records.map((record) => ({ ...record, painPoints: [...record.painPoints] }));

  if (action.type === 'rename') {
    const found = findNode(nextTaxonomy, action.id);
    if (!found) throw new ClusterOperationError(`Cluster “${action.id}” was not found.`);
    if (found.node.level === 'L3') throw new ClusterOperationError('Only L1 and L2 categories can be renamed.');
    if (typeof action.name !== 'string') throw new ClusterOperationError('Enter a non-empty category name.');
    const name = action.name.trim();
    if (!name) throw new ClusterOperationError('Enter a non-empty category name.');
    const siblings = found.parent?.children ?? nextTaxonomy;
    if (siblings.some((sibling) => sibling.id !== found.node.id && sibling.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      throw new ClusterOperationError('That name is already used by a sibling category. Choose a unique name.');
    }
    found.node.name = name;
    if (found.node.level === 'L1') nextRecords = nextRecords.map((row) => row.l1Id === found.node.id ? { ...row, l1: name } : row);
    else nextRecords = nextRecords.map((row) => row.l2Id === found.node.id ? { ...row, l2: name } : row);
  } else if (action.type === 'merge') {
    if (action.sourceId === action.targetId) throw new ClusterOperationError('Choose two different categories to merge.');
    const source = findNode(nextTaxonomy, action.sourceId);
    const target = findNode(nextTaxonomy, action.targetId);
    if (!source) throw new ClusterOperationError(`Source cluster “${action.sourceId}” was not found.`);
    if (!target) throw new ClusterOperationError(`Target cluster “${action.targetId}” was not found.`);
    if (source.node.level !== target.node.level || (source.node.level !== 'L1' && source.node.level !== 'L2')) {
      throw new ClusterOperationError('Only two L1 categories or two L2 categories can be merged.');
    }
    if (source.node.level === 'L1') {
      target.node.children = [...(target.node.children ?? []), ...(source.node.children ?? [])];
      removeNode(nextTaxonomy, source.node.id);
      nextRecords = nextRecords.map((row) => row.l1Id === source.node.id ? { ...row, l1Id: target.node.id, l1: target.node.name } : row);
    } else {
      if (!source.parent || !target.parent) throw new ClusterOperationError('An L2 category must have an L1 parent.');
      const targetParent = target.parent;
      target.node.children = [...(target.node.children ?? []), ...(source.node.children ?? [])];
      removeNode(nextTaxonomy, source.node.id);
      nextRecords = nextRecords.map((row) => row.l2Id === source.node.id
        ? { ...row, l1Id: targetParent.id, l1: targetParent.name, l2Id: target.node.id, l2: target.node.name }
        : row);
    }
  } else if (action.type === 'move') {
    const found = findNode(nextTaxonomy, action.id);
    const destination = findNode(nextTaxonomy, action.parentId);
    if (!found) throw new ClusterOperationError(`Cluster “${action.id}” was not found.`);
    if (!destination) throw new ClusterOperationError(`Destination category “${action.parentId}” was not found.`);
    if (found.node.level === 'L1') throw new ClusterOperationError('L1 categories cannot be moved.');
    const requiredParentLevel = found.node.level === 'L2' ? 'L1' : 'L2';
    if (destination.node.level !== requiredParentLevel) {
      throw new ClusterOperationError(`${found.node.level} categories must be moved under an ${requiredParentLevel} category.`);
    }
    if (found.node.id === destination.node.id || isDescendant(found.node, destination.node.id)) throw new ClusterOperationError('A category cannot be moved into itself or one of its descendants.');
    if (found.parent?.id === destination.node.id) throw new ClusterOperationError('That category is already under the selected parent.');
    removeNode(nextTaxonomy, found.node.id);
    destination.node.children = [...(destination.node.children ?? []), found.node];
    if (found.node.level === 'L2') {
      nextRecords = nextRecords.map((row) => row.l2Id === found.node.id ? { ...row, l1Id: destination.node.id, l1: destination.node.name } : row);
    } else {
      const destinationParent = findNode(nextTaxonomy, destination.node.id)?.parent;
      if (!destinationParent) throw new ClusterOperationError('An L3 destination must have an L1 ancestor.');
      nextRecords = nextRecords.map((row) => row.l3Id === found.node.id
        ? { ...row, l1Id: destinationParent.id, l1: destinationParent.name, l2Id: destination.node.id, l2: destination.node.name }
        : row);
    }
  }

  const revisedRecords = nextRecords.map((record) => ({ ...record, painPoints: [...record.painPoints] }));
  rebuildVolumes(nextTaxonomy, revisedRecords);
  return { taxonomy: nextTaxonomy, records: revisedRecords };
}

function validateTaxonomy(taxonomy: ClusterNode[]): void {
  if (!Array.isArray(taxonomy) || taxonomy.length === 0) throw new ClusterOperationError('The taxonomy is empty. Add an L1 category before editing it.');
  const ids = new Set<string>();
  const objectStack = new Set<object>();
  const visit = (node: ClusterNode, expectedLevel: ClusterNode['level']) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) throw new ClusterOperationError('The taxonomy contains an invalid category.');
    if (objectStack.has(node)) throw new ClusterOperationError('The taxonomy contains a cycle.');
    objectStack.add(node);
    if (typeof node.id !== 'string' || !node.id.trim()) throw new ClusterOperationError('Every category needs a stable ID.');
    if (ids.has(node.id)) throw new ClusterOperationError(`The taxonomy contains duplicate category ID “${node.id}”.`);
    ids.add(node.id);
    if (node.level !== expectedLevel) throw new ClusterOperationError(`Category “${node.name || node.id}” is in the wrong taxonomy level.`);
    if (typeof node.name !== 'string' || !node.name.trim()) throw new ClusterOperationError(`Category “${node.id}” needs a non-empty name.`);
    if (typeof node.volume !== 'number' || !Number.isFinite(node.volume) || node.volume < 0) throw new ClusterOperationError(`Category “${node.name}” has an invalid volume.`);
    if (node.children !== undefined && !Array.isArray(node.children)) throw new ClusterOperationError(`Category “${node.name}” has invalid children.`);
    if (node.level === 'L3' && (node.children?.length ?? 0) > 0) throw new ClusterOperationError(`L3 category “${node.name}” cannot contain child categories.`);
    const childLevel = node.level === 'L1' ? 'L2' : 'L3';
    for (const child of node.children ?? []) visit(child, childLevel);
    objectStack.delete(node);
  };
  for (const node of taxonomy) visit(node, 'L1');
}

function validateRecords(records: TranscriptRecord[], taxonomy: ClusterNode[]): void {
  if (!Array.isArray(records)) throw new ClusterOperationError('Transcript records must be a list.');
  const index = indexNodes(taxonomy);
  for (const row of records) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id.trim() || typeof row.conversationId !== 'string' || !row.conversationId.trim()) {
      throw new ClusterOperationError('Every transcript row needs an ID and conversation ID.');
    }
    const stringFields: (keyof TranscriptRecord)[] = ['intent', 'l1Id', 'l1', 'l2Id', 'l2', 'l3Id', 'l3', 'resolution', 'escalationReason', 'holdReason', 'transcript'];
    if (!stringFields.every((field) => typeof row[field] === 'string')) throw new ClusterOperationError(`Transcript “${row.id}” contains invalid text fields.`);
    if (!Array.isArray(row.painPoints)) throw new ClusterOperationError(`Transcript “${row.id}” has invalid pain points.`);
    if (!row.painPoints.every((point) => typeof point === 'string')) throw new ClusterOperationError(`Transcript “${row.id}” has invalid pain points.`);
    if (!Number.isFinite(row.handlingMinutes) || row.handlingMinutes < 0 || !Number.isFinite(row.complexity) || row.complexity < 0 || row.complexity > 100 || !Number.isFinite(row.automationPotential) || row.automationPotential < 0 || row.automationPotential > 100) {
      throw new ClusterOperationError(`Transcript “${row.id}” has invalid handling or automation metrics.`);
    }
    const l1 = row.l1Id ? index.get(row.l1Id) : undefined;
    const l2 = row.l2Id ? index.get(row.l2Id) : undefined;
    const l3 = row.l3Id ? index.get(row.l3Id) : undefined;
    if (row.l1Id && (!l1 || l1.node.level !== 'L1')) throw new ClusterOperationError(`Transcript “${row.id}” references an unknown L1 category.`);
    if (row.l2Id && (!l2 || l2.node.level !== 'L2' || l2.parent?.id !== row.l1Id)) throw new ClusterOperationError(`Transcript “${row.id}” has an L2 assignment outside its L1 category.`);
    if (row.l3Id && (!l3 || l3.node.level !== 'L3' || l3.parent?.id !== row.l2Id)) throw new ClusterOperationError(`Transcript “${row.id}” has an L3 assignment outside its L2 category.`);
    if (row.l3Id && !row.l2Id) throw new ClusterOperationError(`Transcript “${row.id}” has an L3 assignment without an L2 category.`);
    if (row.l2Id && !row.l1Id) throw new ClusterOperationError(`Transcript “${row.id}” has an L2 assignment without an L1 category.`);
  }
}

type LocatedNode = { node: ClusterNode; parent?: ClusterNode };
function findNode(nodes: ClusterNode[], id: string): LocatedNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return { node };
    const nested = findNested(node, id);
    if (nested) return nested;
  }
  return undefined;
}
function findNested(parent: ClusterNode, id: string): LocatedNode | undefined {
  for (const node of parent.children ?? []) {
    if (node.id === id) return { node, parent };
    const nested = findNested(node, id);
    if (nested) return nested;
  }
  return undefined;
}
function removeNode(nodes: ClusterNode[], id: string): boolean {
  const topIndex = nodes.findIndex((node) => node.id === id);
  if (topIndex >= 0) { nodes.splice(topIndex, 1); return true; }
  for (const node of nodes) {
    const children = node.children;
    if (!children) continue;
    const index = children.findIndex((child) => child.id === id);
    if (index >= 0) { children.splice(index, 1); return true; }
    if (removeNode(children, id)) return true;
  }
  return false;
}
function isDescendant(node: ClusterNode, id: string): boolean {
  return (node.children ?? []).some((child) => child.id === id || isDescendant(child, id));
}
function indexNodes(nodes: ClusterNode[]): Map<string, LocatedNode> {
  const index = new Map<string, LocatedNode>();
  const visit = (node: ClusterNode, parent?: ClusterNode) => {
    index.set(node.id, { node, parent });
    for (const child of node.children ?? []) visit(child, node);
  };
  for (const node of nodes) visit(node);
  return index;
}
function cloneNode(node: ClusterNode): ClusterNode {
  return { ...node, ...(node.children ? { children: node.children.map(cloneNode) } : {}) };
}
function rebuildVolumes(taxonomy: ClusterNode[], records: TranscriptRecord[]): void {
  const conversations = new Map<string, Set<string>>();
  const add = (id: string, conversationId: string) => {
    if (!id) return;
    const ids = conversations.get(id) ?? new Set<string>();
    ids.add(conversationId);
    conversations.set(id, ids);
  };
  for (const record of records) {
    add(record.l1Id, record.conversationId);
    add(record.l2Id, record.conversationId);
    add(record.l3Id, record.conversationId);
  }
  const visit = (node: ClusterNode) => {
    node.volume = conversations.get(node.id)?.size ?? 0;
    for (const child of node.children ?? []) visit(child);
  };
  for (const node of taxonomy) visit(node);
}
