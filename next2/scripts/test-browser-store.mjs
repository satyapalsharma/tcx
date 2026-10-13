import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';

const sourcePath = path.resolve('src/lib/browser-store.ts');
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
const { createBrowserStore } = loaded.exports;

function fakeAdapter(initialRaw = null) {
  let raw = initialRaw;
  let onStorageChange;
  let reads = 0;
  let failures = { read: false, write: false, backup: false };
  const operations = [];
  return {
    operations,
    get reads() {
      return reads;
    },
    get raw() {
      return raw;
    },
    set failures(value) {
      failures = value;
    },
    adapter: {
      read(key) {
        reads += 1;
        operations.push(['read', key]);
        if (failures.read) throw new Error('read failed');
        return raw;
      },
      write(key, value) {
        operations.push(['write', key, value]);
        if (failures.write) throw new Error('write failed');
        raw = value;
      },
      backupInvalid(key, value) {
        operations.push(['backup', key, value]);
        if (failures.backup) throw new Error('backup failed');
      },
      subscribe(key, listener) {
        operations.push(['subscribe', key]);
        onStorageChange = listener;
        return () => {
          operations.push(['unsubscribe', key]);
          onStorageChange = undefined;
        };
      },
    },
    emit(value) {
      onStorageChange?.(value);
    },
  };
}

const parseCount = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

{
  const adapter = fakeAdapter('7');
  const store = createBrowserStore('count', 0, parseCount, adapter.adapter);
  const server = store.getServerSnapshot();
  assert.deepEqual(server, { value: 0, hydrated: false });
  assert.equal(adapter.reads, 0, 'server snapshot does not touch storage');
  const first = store.getSnapshot();
  assert.deepEqual(first, { value: 7, hydrated: true });
  assert.equal(
    store.getSnapshot(),
    first,
    'client snapshot is referentially cached',
  );
  assert.equal(adapter.reads, 1, 'storage is read once');
}

{
  const adapter = fakeAdapter('2');
  const store = createBrowserStore('count', 0, parseCount, adapter.adapter);
  const events = [];
  const stop = store.subscribe(() => events.push(store.getSnapshot()));
  store.setValue((previous) => previous + 3);
  assert.equal(
    store.getSnapshot().value,
    5,
    'functional update uses the latest value',
  );
  assert.equal(adapter.raw, '5', 'functional update persists');
  assert.equal(
    events.at(-1).value,
    5,
    'subscribers observe the new immutable snapshot',
  );
  adapter.emit('11');
  assert.equal(
    store.getSnapshot().value,
    11,
    'external storage updates refresh the store',
  );
  stop();
  assert.ok(
    adapter.operations.some(([name]) => name === 'unsubscribe'),
    'last subscriber removes storage listener',
  );
}

{
  const invalidRaw = '{broken';
  const adapter = fakeAdapter(invalidRaw);
  const store = createBrowserStore(
    'state',
    { version: 1 },
    (value) => (value && value.version === 1 ? value : null),
    adapter.adapter,
  );
  assert.deepEqual(store.getSnapshot(), {
    value: { version: 1 },
    hydrated: true,
  });
  assert.deepEqual(
    adapter.operations.slice(0, 3),
    [
      ['read', 'state'],
      ['backup', 'state', invalidRaw],
      ['write', 'state', '{"version":1}'],
    ],
    'malformed data is backed up before defaults replace it',
  );
}

{
  const adapter = fakeAdapter(null);
  adapter.failures = { read: true, write: true, backup: true };
  const store = createBrowserStore('state', 4, parseCount, adapter.adapter);
  assert.deepEqual(
    store.getSnapshot(),
    { value: 4, hydrated: true },
    'read failure falls back to memory state',
  );
  store.setValue((value) => value + 1);
  assert.equal(
    store.getSnapshot().value,
    5,
    'write failure does not block in-memory updates',
  );
}

{
  const adapter = fakeAdapter('{broken');
  adapter.failures = { read: false, write: false, backup: true };
  const store = createBrowserStore('count', 0, parseCount, adapter.adapter);
  assert.equal(store.getSnapshot().value, 0);
  assert.equal(
    adapter.raw,
    '{broken',
    'failed backup leaves original records intact',
  );
  const before = store.getSnapshot();
  store.setValue((value) => value);
  assert.equal(
    store.getSnapshot(),
    before,
    'no-op updates preserve snapshot identity',
  );
  assert.equal(adapter.raw, '{broken', 'no-op updates do not write to storage');
}

console.log('Browser store checks passed.');
