import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/cluster-operations.ts');
const source = await readFile(sourcePath, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const loaded = new Module(sourcePath);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(output, sourcePath);
const { reviseClusters, ClusterOperationError } = loaded.exports;

const tree = () => [
  {
    id: 'l1-billing',
    name: 'Billing',
    level: 'L1',
    volume: 900,
    children: [
      {
        id: 'l2-invoice',
        name: 'Invoice',
        level: 'L2',
        volume: 90,
        children: [
          { id: 'l3-charge', name: 'Charge', level: 'L3', volume: 9 },
          { id: 'l3-credit', name: 'Credit', level: 'L3', volume: 8 },
        ],
      },
      {
        id: 'l2-support-a',
        name: 'Support',
        level: 'L2',
        volume: 70,
        children: [
          { id: 'l3-payment', name: 'Payment', level: 'L3', volume: 7 },
        ],
      },
    ],
  },
  {
    id: 'l1-network',
    name: 'Network',
    level: 'L1',
    volume: 800,
    children: [
      {
        id: 'l2-support-b',
        name: 'Support',
        level: 'L2',
        volume: 60,
        children: [{ id: 'l3-outage', name: 'Outage', level: 'L3', volume: 6 }],
      },
    ],
  },
];
const row = (id, conversationId, l1Id, l1, l2Id, l2, l3Id, l3, patch = {}) => ({
  id,
  conversationId,
  intent: 'Sample intent',
  l1Id,
  l1,
  l2Id,
  l2,
  l3Id,
  l3,
  resolution: 'Resolved',
  escalationReason: '',
  holdReason: '',
  painPoints: ['A pain point'],
  transcript: 'Synthetic test transcript.',
  handlingMinutes: 5,
  complexity: 40,
  automationPotential: 70,
  ...patch,
});
const records = () => [
  row(
    'r1',
    'conv-1',
    'l1-billing',
    'Billing',
    'l2-invoice',
    'Invoice',
    'l3-charge',
    'Charge',
  ),
  row(
    'r2',
    'conv-1',
    'l1-billing',
    'Billing',
    'l2-invoice',
    'Invoice',
    'l3-charge',
    'Charge',
  ),
  row(
    'r3',
    'conv-2',
    'l1-billing',
    'Billing',
    'l2-invoice',
    'Invoice',
    'l3-credit',
    'Credit',
  ),
  row(
    'r4',
    'conv-3',
    'l1-billing',
    'Billing',
    'l2-support-a',
    'Support',
    'l3-payment',
    'Payment',
  ),
  row(
    'r5',
    'conv-4',
    'l1-network',
    'Network',
    'l2-support-b',
    'Support',
    'l3-outage',
    'Outage',
  ),
];
const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const nested = findNode(node.children ?? [], id);
    if (nested) return nested;
  }
  return undefined;
};
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('renames L1 and L2 labels in transcript assignments and preserves IDs', () => {
  const beforeTree = tree();
  const beforeRows = records();
  const renamedL1 = reviseClusters(beforeTree, beforeRows, {
    type: 'rename',
    id: 'l1-billing',
    name: 'Customer care',
  });
  assert.equal(
    findNode(renamedL1.taxonomy, 'l1-billing').name,
    'Customer care',
  );
  assert.ok(
    renamedL1.records
      .filter((item) => item.l1Id === 'l1-billing')
      .every((item) => item.l1 === 'Customer care'),
  );
  assert.equal(renamedL1.records[0].l2Id, 'l2-invoice');
  const renamedL2 = reviseClusters(beforeTree, beforeRows, {
    type: 'rename',
    id: 'l2-invoice',
    name: 'Invoice questions',
  });
  assert.equal(findNode(renamedL2.taxonomy, 'l2-invoice').id, 'l2-invoice');
  assert.ok(
    renamedL2.records
      .filter((item) => item.l2Id === 'l2-invoice')
      .every((item) => item.l2 === 'Invoice questions'),
  );
  assert.equal(beforeTree[0].name, 'Billing');
  assert.equal(beforeRows[0].l1, 'Billing');
});

test('renames reject blank and duplicate sibling names', () => {
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'rename',
        id: 'l2-invoice',
        name: ' Support ',
      }),
    /unique name/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'rename',
        id: 'l1-billing',
        name: '   ',
      }),
    /non-empty/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'rename',
        id: 'l3-charge',
        name: 'New charge',
      }),
    /Only L1 and L2/,
  );
});

test('merges L1 categories, preserves same-name child IDs, and updates all assigned paths', () => {
  const result = reviseClusters(tree(), records(), {
    type: 'merge',
    sourceId: 'l1-network',
    targetId: 'l1-billing',
  });
  const target = findNode(result.taxonomy, 'l1-billing');
  assert.equal(findNode(result.taxonomy, 'l1-network'), undefined);
  assert.equal(
    target.children.filter((item) => item.name === 'Support').length,
    2,
  );
  assert.ok(findNode(result.taxonomy, 'l2-support-a'));
  assert.ok(findNode(result.taxonomy, 'l2-support-b'));
  const movedRow = result.records.find((item) => item.id === 'r5');
  assert.equal(movedRow.l1Id, 'l1-billing');
  assert.equal(movedRow.l1, 'Billing');
  assert.equal(movedRow.l2Id, 'l2-support-b');
  assert.equal(target.volume, 4);
  assert.equal(findNode(result.taxonomy, 'l2-support-b').volume, 1);
});

test('merges L2 across L1 parents, keeps leaf IDs, and remaps transcript ancestry', () => {
  const result = reviseClusters(tree(), records(), {
    type: 'merge',
    sourceId: 'l2-invoice',
    targetId: 'l2-support-b',
  });
  assert.equal(findNode(result.taxonomy, 'l2-invoice'), undefined);
  const target = findNode(result.taxonomy, 'l2-support-b');
  assert.deepEqual(
    target.children.map((item) => item.id),
    ['l3-outage', 'l3-charge', 'l3-credit'],
  );
  const mergedRows = result.records.filter(
    (item) => item.id === 'r1' || item.id === 'r3',
  );
  assert.ok(
    mergedRows.every(
      (item) =>
        item.l1Id === 'l1-network' &&
        item.l1 === 'Network' &&
        item.l2Id === 'l2-support-b' &&
        item.l2 === 'Support',
    ),
  );
  assert.equal(mergedRows[0].l3Id, 'l3-charge');
  assert.equal(target.volume, 3);
});

test('moves L2 under another L1 and moves L3 under another L2 with labels and IDs remapped', () => {
  const moveL2 = reviseClusters(tree(), records(), {
    type: 'move',
    id: 'l2-invoice',
    parentId: 'l1-network',
  });
  assert.equal(findNode(moveL2.taxonomy, 'l2-invoice').id, 'l2-invoice');
  assert.equal(
    moveL2.records.find((item) => item.id === 'r1').l1Id,
    'l1-network',
  );
  assert.equal(moveL2.records.find((item) => item.id === 'r1').l1, 'Network');
  const moveLeaf = reviseClusters(tree(), records(), {
    type: 'move',
    id: 'l3-charge',
    parentId: 'l2-support-b',
  });
  const movedRow = moveLeaf.records.find((item) => item.id === 'r1');
  assert.equal(movedRow.l1Id, 'l1-network');
  assert.equal(movedRow.l2Id, 'l2-support-b');
  assert.equal(movedRow.l3Id, 'l3-charge');
  assert.equal(findNode(moveLeaf.taxonomy, 'l3-charge').id, 'l3-charge');
});

test('merge rejects wrong levels, missing targets, self merge and unsupported levels', () => {
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'merge',
        sourceId: 'l1-billing',
        targetId: 'l2-invoice',
      }),
    /Only two L1/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'merge',
        sourceId: 'l2-invoice',
        targetId: 'missing',
      }),
    /not found/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'merge',
        sourceId: 'l2-invoice',
        targetId: 'l2-invoice',
      }),
    /different categories/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'merge',
        sourceId: 'l3-charge',
        targetId: 'l3-credit',
      }),
    /Only two L1/,
  );
});

test('move rejects L1 moves, invalid destination levels, and same-parent no-ops', () => {
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'move',
        id: 'l1-billing',
        parentId: 'l1-network',
      }),
    /L1 categories cannot be moved/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'move',
        id: 'l2-invoice',
        parentId: 'l2-support-b',
      }),
    /must be moved under an L1/,
  );
  assert.throws(
    () =>
      reviseClusters(tree(), records(), {
        type: 'move',
        id: 'l2-invoice',
        parentId: 'l1-billing',
      }),
    /already under/,
  );
});

test('rebuilds distinct-conversation volumes for every taxonomy level', () => {
  const result = reviseClusters(tree(), records(), {
    type: 'rename',
    id: 'l1-billing',
    name: 'Billing',
  });
  assert.equal(findNode(result.taxonomy, 'l1-billing').volume, 3);
  assert.equal(findNode(result.taxonomy, 'l2-invoice').volume, 2);
  assert.equal(
    findNode(result.taxonomy, 'l3-charge').volume,
    1,
    'duplicate rows in one conversation count once',
  );
  const empty = reviseClusters(tree(), [], {
    type: 'rename',
    id: 'l1-billing',
    name: 'Billing',
  });
  assert.equal(findNode(empty.taxonomy, 'l1-billing').volume, 0);
  assert.equal(findNode(empty.taxonomy, 'l3-charge').volume, 0);
});

test('rejects empty, cyclic, duplicate-ID, malformed trees and inconsistent assignments', () => {
  assert.throws(
    () => reviseClusters([], [], { type: 'rename', id: 'x', name: 'X' }),
    /taxonomy is empty/,
  );
  const cyclic = {
    id: 'cycle',
    name: 'Cycle',
    level: 'L1',
    volume: 0,
    children: [],
  };
  cyclic.children.push(cyclic);
  assert.throws(
    () =>
      reviseClusters([cyclic], [], {
        type: 'rename',
        id: 'cycle',
        name: 'Cycle renamed',
      }),
    /cycle/,
  );
  const duplicate = tree();
  duplicate[1].children[0].children.push({
    ...duplicate[0].children[0].children[0],
  });
  assert.throws(
    () =>
      reviseClusters(duplicate, [], {
        type: 'rename',
        id: 'l1-billing',
        name: 'New billing',
      }),
    /duplicate category ID/,
  );
  assert.throws(
    () =>
      reviseClusters(
        tree(),
        [row('bad', 'conv', 'unknown', 'Billing', '', '', '', '')],
        { type: 'rename', id: 'l1-billing', name: 'New billing' },
      ),
    /unknown L1/,
  );
  assert.throws(
    () => reviseClusters(tree(), records(), { type: 'unknown' }),
    ClusterOperationError,
  );
});

for (const [name, runTest] of tests) {
  await runTest();
  process.stdout.write(`✓ ${name}\n`);
}
process.stdout.write(`Passed ${tests.length} cluster operation checks.\n`);
