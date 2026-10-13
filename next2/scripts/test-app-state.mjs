import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/app-state.ts');
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
const { readAppState } = loaded.exports;

const validState = (overrides = {}) => ({
  organizations: [
    {
      id: 'org-a',
      name: 'A',
      slug: 'a',
      plan: 'Team',
      role: 'Admin',
      memberCount: 1,
    },
    {
      id: 'org-b',
      name: 'B',
      slug: 'b',
      plan: 'Starter',
      role: 'Member',
      memberCount: 0,
    },
  ],
  workspaces: [
    {
      id: 'ws-a',
      name: 'Project A',
      orgId: 'org-a',
      description: 'A project',
      isDefault: true,
      jobCount: 0,
    },
    {
      id: 'ws-b',
      name: 'Project B',
      orgId: 'org-b',
      description: 'B project',
      jobCount: 0,
    },
  ],
  members: [
    {
      id: 'member-a',
      orgId: 'org-a',
      name: 'Alex Example',
      email: 'alex@example.test',
      role: 'Admin',
      workspaces: 'All projects',
      lastActive: 'Just now',
      status: 'active',
      initials: 'AE',
    },
  ],
  currentOrgId: 'org-a',
  currentWorkspaceId: 'ws-a',
  jobs: [{ id: 'legacy-job', status: { opaque: true } }],
  ...overrides,
});

assert.equal(readAppState(null), null, 'null storage is rejected');
assert.equal(readAppState(undefined), null, 'missing storage is rejected');
assert.equal(
  readAppState({
    ...validState(),
    organizations: [{ ...validState().organizations[0], plan: 'Gold' }],
  }),
  null,
  'invalid organization enums are rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    members: [{ ...validState().members[0], role: 'Superuser' }],
  }),
  null,
  'invalid member roles are rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    members: [{ ...validState().members[0], status: 'pending' }],
  }),
  null,
  'invalid member status is rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    organizations: [{ ...validState().organizations[0], name: 42 }],
  }),
  null,
  'invalid strings are rejected',
);
assert.equal(
  readAppState({ ...validState(), workspaces: [null] }),
  null,
  'malformed nested records are rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    members: [{ ...validState().members[0], orgId: 'missing-org' }],
  }),
  null,
  'orphaned members are rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    workspaces: [
      { ...validState().workspaces[0], orgId: 'missing-org' },
      validState().workspaces[1],
    ],
  }),
  null,
  'orphaned projects are rejected',
);
assert.equal(
  readAppState({
    ...validState(),
    organizations: [validState().organizations[0]],
    workspaces: [],
    currentWorkspaceId: '',
  })?.currentWorkspaceId,
  '',
  'an organization can exist before its first project',
);
assert.deepEqual(
  readAppState({
    ...validState(),
    organizations: [],
    workspaces: [],
    members: [],
    currentOrgId: '',
    currentWorkspaceId: '',
  })?.organizations,
  [],
  'an account can start without organizations or projects',
);

const legacy = validState({
  currentOrgId: 'org-b',
  currentWorkspaceId: 'ws-a',
  members: [
    {
      ...validState().members[0],
      id: 'devika',
      role: 'Builder',
      workspaces: 'All workspaces',
    },
    { ...validState().members[0], id: 'arjun', role: 'Builder' },
    { ...validState().members[0], id: 'other-builder', role: 'Builder' },
  ],
});
const before = structuredClone(legacy);
const migrated = readAppState(legacy);
assert.ok(migrated);
assert.equal(migrated.currentOrgId, 'org-b');
assert.equal(
  migrated.currentWorkspaceId,
  'ws-b',
  'a project belonging to another organization cannot remain selected',
);
assert.deepEqual(
  migrated.members.map((member) => member.role),
  ['CX Designer', 'Developer', 'Business Analyst'],
);
assert.equal(migrated.members[0].workspaces, 'All projects');
assert.deepEqual(
  legacy,
  before,
  'reading state does not mutate the supplied object',
);
assert.deepEqual(
  migrated.jobs,
  legacy.jobs,
  'opaque job entries survive storage validation',
);

const invalidSelection = readAppState(
  validState({ currentOrgId: 'missing', currentWorkspaceId: 'missing' }),
);
assert.ok(invalidSelection);
assert.equal(invalidSelection.currentOrgId, 'org-a');
assert.equal(invalidSelection.currentWorkspaceId, 'ws-a');

console.log('App state validation and migration checks passed.');
