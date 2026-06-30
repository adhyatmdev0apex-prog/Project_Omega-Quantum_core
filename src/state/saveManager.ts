// ===========================================================
// SaveManager — centralized persistence layer for Quantum Core.
// One namespaced localStorage key per store, typed access,
// atomic writes, and a reactive hook so components re-render on
// change. Designed so a future cloud-sync adapter can slot in
// behind the same interface without touching call sites.
// ===========================================================

const NS = 'qc.';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function fullKey(name: string) {
  return `${NS}${name}`;
}

export function loadStore<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(fullKey(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function saveStore<T>(name: string, value: T): void {
  try {
    localStorage.setItem(fullKey(name), JSON.stringify(value));
    notify(name);
  } catch {
    /* quota / private mode — best-effort */
  }
}

export function clearStore(name: string): void {
  try {
    localStorage.removeItem(fullKey(name));
    notify(name);
  } catch {
    /* ignore */
  }
}

export function subscribe(name: string, fn: Listener): () => void {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(fn);
  return () => listeners.get(name)?.delete(fn);
}

export function listStores(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(NS)) out.push(k.slice(NS.length));
  }
  return out;
}

export function exportAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const name of listStores()) {
    try {
      out[name] = JSON.parse(localStorage.getItem(fullKey(name)) || 'null');
    } catch {
      out[name] = null;
    }
  }
  return out;
}

export function importAll(data: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(data)) {
    saveStore(name, value);
  }
}
