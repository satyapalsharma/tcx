'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  createBrowserStore,
  type BrowserStoreAdapter,
} from '@/lib/browser-store';

const localStorageAdapter: BrowserStoreAdapter = {
  read(key) {
    if (typeof window === 'undefined')
      throw new Error('Browser storage is unavailable.');
    return window.localStorage.getItem(key);
  },
  write(key, raw) {
    if (typeof window === 'undefined')
      throw new Error('Browser storage is unavailable.');
    window.localStorage.setItem(key, raw);
  },
  backupInvalid(key, raw) {
    if (typeof window === 'undefined')
      throw new Error('Browser storage is unavailable.');
    window.localStorage.setItem(`${key}.invalid`, raw);
  },
  subscribe(key, onChange) {
    if (typeof window === 'undefined') return () => undefined;
    const handleStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === key || event.key === null)
      ) {
        onChange(event.key === null ? null : event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },
};

export function useBrowserState<T>(
  key: string,
  initialValue: T,
  parse: (value: unknown) => T | null,
): [T, (update: T | ((previous: T) => T)) => void, boolean] {
  const store = useMemo(
    () => createBrowserStore(key, initialValue, parse, localStorageAdapter),
    [key, initialValue, parse],
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return [snapshot.value, store.setValue, snapshot.hydrated];
}
