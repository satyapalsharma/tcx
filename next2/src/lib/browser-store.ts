export type BrowserStateSnapshot<T> = {
  value: T;
  hydrated: boolean;
};

export type BrowserStoreAdapter = {
  read: (key: string) => string | null;
  write: (key: string, raw: string) => void;
  backupInvalid: (key: string, raw: string) => void;
  subscribe: (
    key: string,
    onChange: (raw: string | null) => void,
  ) => () => void;
};

export type BrowserStore<T> = {
  getSnapshot: () => BrowserStateSnapshot<T>;
  getServerSnapshot: () => BrowserStateSnapshot<T>;
  subscribe: (listener: () => void) => () => void;
  setValue: (update: T | ((previous: T) => T)) => void;
};

/**
 * Creates a cached external store. Storage access is deferred until the first
 * client snapshot read, so the server snapshot stays deterministic.
 */
export function createBrowserStore<T>(
  key: string,
  initialValue: T,
  parse: (value: unknown) => T | null,
  adapter: BrowserStoreAdapter,
): BrowserStore<T> {
  const serverSnapshot: BrowserStateSnapshot<T> = {
    value: initialValue,
    hydrated: false,
  };
  let snapshot = serverSnapshot;
  let initialized = false;
  let stopAdapter: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const writeSnapshot = (value: T) => {
    snapshot = { value, hydrated: true };
    try {
      const raw = JSON.stringify(value);
      if (raw !== undefined) adapter.write(key, raw);
    } catch {
      // Keep state usable in memory when storage or serialization is unavailable.
    }
    notify();
  };

  const applyStoredValue = (raw: string | null) => {
    if (raw === null) {
      snapshot = { value: initialValue, hydrated: true };
      notify();
      return;
    }

    let parsed: T | null = null;
    try {
      parsed = parse(JSON.parse(raw) as unknown);
    } catch {
      parsed = null;
    }

    if (parsed !== null) {
      snapshot = { value: parsed, hydrated: true };
      notify();
      return;
    }

    snapshot = { value: initialValue, hydrated: true };
    try {
      // Never overwrite unparseable records unless the original can be retained.
      adapter.backupInvalid(key, raw);
      const fallbackRaw = JSON.stringify(initialValue);
      if (fallbackRaw !== undefined) adapter.write(key, fallbackRaw);
    } catch {
      // Invalid storage should not prevent the app from opening with its defaults.
    }
    notify();
  };

  const initialize = () => {
    if (initialized) return;
    initialized = true;
    let raw: string | null;
    try {
      raw = adapter.read(key);
    } catch {
      snapshot = { value: initialValue, hydrated: true };
      notify();
      return;
    }
    applyStoredValue(raw);
  };

  return {
    getSnapshot() {
      initialize();
      return snapshot;
    },
    getServerSnapshot() {
      return serverSnapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      initialize();
      if (!stopAdapter) {
        try {
          stopAdapter = adapter.subscribe(key, applyStoredValue);
        } catch {
          stopAdapter = null;
        }
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size && stopAdapter) {
          stopAdapter();
          stopAdapter = null;
        }
      };
    },
    setValue(update) {
      initialize();
      const value =
        typeof update === 'function'
          ? (update as (previous: T) => T)(snapshot.value)
          : update;
      if (Object.is(value, snapshot.value)) return;
      writeSnapshot(value);
    },
  };
}
