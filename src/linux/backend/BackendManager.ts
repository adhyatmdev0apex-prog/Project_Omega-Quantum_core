// ===========================================================
// BackendManager — the single place that decides which backend
// LinuxEngine receives. LinuxLabPage never imports a backend
// directly; it only asks BackendManager for a backend, then
// calls engine.attach().
//
// Adding a new distro:
//   1. Create src/linux/backend/<distro>/<Distro>Backend.ts
//      implementing LinuxBackend.
//   2. Add an entry to BackendType.
//   3. Add a case in createBackend().
//   4. Done — no other file changes needed.
// ===========================================================

import type { LinuxBackend } from '../../lib/linuxEngine';
import { VirtualLinuxBackend } from './VirtualLinuxBackend';
import { UbuntuBackend } from './ubuntu/UbuntuBackend';

// ── Supported backend identifiers ─────────────────────────

export type BackendType =
  | 'virtual'   // always available — no external resources
  | 'ubuntu'    // TODO(v86): connects to real Ubuntu VM via v86
  | 'kali'      // TODO(kali): Kali Linux VM backend
  | 'debian'    // TODO(debian): Debian VM backend
  | 'parrot';   // TODO(parrot): Parrot OS VM backend

// ── Factory ────────────────────────────────────────────────

function createBackend(type: BackendType): LinuxBackend {
  switch (type) {
    case 'virtual':
      return new VirtualLinuxBackend();

    case 'ubuntu':
      return new UbuntuBackend();

    case 'kali':
      // TODO(kali): return new KaliBackend();
      console.warn('[BackendManager] Kali backend not yet implemented — falling back to virtual.');
      return new VirtualLinuxBackend();

    case 'debian':
      // TODO(debian): return new DebianBackend();
      console.warn('[BackendManager] Debian backend not yet implemented — falling back to virtual.');
      return new VirtualLinuxBackend();

    case 'parrot':
      // TODO(parrot): return new ParrotBackend();
      console.warn('[BackendManager] Parrot backend not yet implemented — falling back to virtual.');
      return new VirtualLinuxBackend();

    default: {
      const exhaustive: never = type;
      console.warn(`[BackendManager] Unknown backend type: ${String(exhaustive)} — falling back to virtual.`);
      return new VirtualLinuxBackend();
    }
  }
}

// ── Manager class ──────────────────────────────────────────

export class BackendManager {
  private current: LinuxBackend | null = null;
  private activeType: BackendType | null = null;

  /**
   * Returns a backend for the requested type, creating it if needed.
   * If the same type is already active, the existing instance is returned.
   */
  get(type: BackendType): LinuxBackend {
    if (this.current && this.activeType === type) {
      return this.current;
    }
    this.dispose();
    this.current = createBackend(type);
    this.activeType = type;
    return this.current;
  }

  getActiveType(): BackendType | null {
    return this.activeType;
  }

  isVMBacked(): boolean {
    return this.activeType !== null && this.activeType !== 'virtual';
  }

  dispose(): void {
    this.current?.dispose?.();
    this.current = null;
    this.activeType = null;
  }
}

/** Module-level singleton — safe to import anywhere. */
export const backendManager = new BackendManager();
