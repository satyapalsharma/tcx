import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/diagram-source.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const {
  parseDiagramSteps,
  replaceDiagramSteps,
  parseProcessNodes,
  parseProcessConnections,
  addProcessNode,
  removeProcessNode,
  connectProcessNodes,
  disconnectProcessNodes,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

const flow = `flowchart TD
  start[Customer contacts support] --> verify[Verify customer identity]
  verify --> invoice[Retrieve invoice and payment history]
  invoice --> decision{Is the dispute valid?}
  decision --> credit[Apply eligible credit]
  decision --> explain[Explain charges or escalate]
  credit --> confirm[Send confirmation]
  explain --> confirm
  confirm --> end[Resolve and close the case]`;
const flowSteps = parseDiagramSteps(flow);
assert.equal(
  flowSteps.length,
  8,
  'all left- and right-hand declarations should be parsed once',
);
assert.deepEqual(flowSteps, [
  'Customer contacts support',
  'Verify customer identity',
  'Retrieve invoice and payment history',
  'Is the dispute valid?',
  'Apply eligible credit',
  'Explain charges or escalate',
  'Send confirmation',
  'Resolve and close the case',
]);
const changedFlowSteps = [...flowSteps];
changedFlowSteps[1] = 'Verify account ownership';
const changedFlow = replaceDiagramSteps(flow, changedFlowSteps);
assert.equal(parseDiagramSteps(changedFlow)[1], 'Verify account ownership');
assert.match(changedFlow, /verify\[Verify account ownership\]/);
const everyFlowStep = flowSteps.map(
  (step, index) => `Edited step ${index + 1}`,
);
assert.deepEqual(
  parseDiagramSteps(replaceDiagramSteps(flow, everyFlowStep)),
  everyFlowStep,
  'all eight labels should map to their node IDs even when a node is repeated',
);
assert.equal(parseProcessNodes(flow).length, 8);
assert.equal(parseProcessConnections(flow).length, 8);
const added = addProcessNode(flow, 'Check policy exception');
assert.equal(parseProcessNodes(added.content).length, 9);
const linked = connectProcessNodes(added.content, 'end', added.node.id);
assert.ok(
  parseProcessConnections(linked).some(
    (edge) => edge.from === 'end' && edge.to === added.node.id,
  ),
);
const unlinked = disconnectProcessNodes(linked, 'end', added.node.id);
assert.ok(
  !parseProcessConnections(unlinked).some(
    (edge) => edge.from === 'end' && edge.to === added.node.id,
  ),
);
const removed = removeProcessNode(unlinked, added.node.id);
assert.equal(parseProcessNodes(removed).length, 8);
assert.ok(
  parseProcessNodes(removeProcessNode(flow, 'verify')).some(
    (node) => node.id === 'start',
  ),
  'removing a step must preserve other labeled nodes on its edge',
);
const unsafeAdded = addProcessNode(flow, 'Step]\nInjected{source');
assert.ok(
  parseProcessNodes(unsafeAdded.content).some(
    (node) => node.label === 'Step Injected source',
  ),
  'new labels should not break Mermaid delimiters or add source lines',
);
const inlineFlow = `flowchart TD\n  left[Keep this] --> middle[Remove this]\n  middle --> right[Keep that]`;
const inlineRemoved = removeProcessNode(inlineFlow, 'middle');
assert.ok(
  parseProcessNodes(inlineRemoved).some(
    (node) => node.id === 'left' && node.label === 'Keep this',
  ),
  'removing an inline node should preserve its left neighbor declaration',
);
assert.ok(
  parseProcessNodes(inlineRemoved).some(
    (node) => node.id === 'right' && node.label === 'Keep that',
  ),
  'removing an inline node should preserve its right neighbor declaration',
);

const sequence = `sequenceDiagram
  participant Customer
  participant Orchestrator
  participant Tools
  participant BillingAgent
  Customer->>Orchestrator: Dispute an invoice
  Orchestrator->>Tools: Verify identity and retrieve invoice
  Tools-->>Orchestrator: Account and invoice details
  Orchestrator->>BillingAgent: Evaluate dispute policy
  BillingAgent->>Tools: Apply eligible credit
  Tools-->>Customer: Confirmation and reference`;
const sequenceSteps = parseDiagramSteps(sequence);
assert.equal(
  sequenceSteps.filter((step) => step.startsWith('Participant:')).length,
  4,
);
assert.equal(
  sequenceSteps.filter((step) => step.startsWith('Message:')).length,
  6,
);
const editedSequenceSteps = [...sequenceSteps];
editedSequenceSteps[0] = 'Participant: Customer account';
const changedSequence = replaceDiagramSteps(sequence, editedSequenceSteps);
assert.match(changedSequence, /participant Customer as Customer account/);
assert.match(changedSequence, /Customer->>Orchestrator: Dispute an invoice/);
assert.match(changedSequence, /BillingAgent->>Tools: Apply eligible credit/);
assert.equal(
  parseDiagramSteps(changedSequence).length,
  sequenceSteps.length,
  'renaming aliases must preserve participant references and message parsing',
);
console.log('diagram source parser checks passed');

const legacySource = await readFile(
  new URL('../src/lib/mermaid-source.ts', import.meta.url),
  'utf8',
);
const legacyCompiled = ts.transpileModule(legacySource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizeLegacyDemoProcessMap } = await import(
  `data:text/javascript;base64,${Buffer.from(legacyCompiled).toString('base64')}`
);
assert.match(
  normalizeLegacyDemoProcessMap(flow),
  /confirm --> finish\[Resolve and close the case\]/,
);
assert.match(
  normalizeLegacyDemoProcessMap(
    flow + '\nend --> survey[Confirm satisfaction]',
  ),
  /finish --> survey/,
);
assert.match(
  normalizeLegacyDemoProcessMap(
    flow + '\nsubgraph group[Group]\n  a --> b\nend',
  ),
  /\nend$/,
);
assert.equal(
  normalizeLegacyDemoProcessMap(
    'flowchart TD\n  A[Weekend] --> B[End conversation]',
  ),
  'flowchart TD\n  A[Weekend] --> B[End conversation]',
);
console.log('Legacy Mermaid sample compatibility passed');
