// ===========================================================
// VMStorage — interfaces for future persistent VM storage.
// Nothing here is implemented yet; these contracts define what
// a real storage provider must satisfy before it can be
// plugged in.
//
// TODO(storage): Implement a concrete class (e.g.
// IndexedDBVMStorage) that satisfies IVMStorage and wire it
// into UbuntuVM.saveSnapshot() / loadSnapshot().
// ===========================================================

/** A portable representation of a saved VM state. */
export interface VMSnapshot {
  /** Unique identifier for the snapshot. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** ISO-8601 timestamp of when the snapshot was taken. */
  createdAt: string;
  /** Size of the snapshot data in bytes. */
  byteSize: number;
  /** Opaque binary payload — the raw emulator state buffer. */
  data: ArrayBuffer;
}

/** Metadata returned by list() without the heavy ArrayBuffer. */
export type VMSnapshotMeta = Omit<VMSnapshot, 'data'>;

/** Contract for any VM storage implementation. */
export interface IVMStorage {
  /** Persist a new snapshot. Replaces any snapshot with the same id. */
  saveSnapshot(snapshot: VMSnapshot): Promise<void>;

  /** Retrieve a snapshot by id. Returns null if not found. */
  loadSnapshot(id: string): Promise<VMSnapshot | null>;

  /** Remove a snapshot by id. No-op if it does not exist. */
  deleteSnapshot(id: string): Promise<void>;

  /** List metadata for all stored snapshots, newest first. */
  listSnapshots(): Promise<VMSnapshotMeta[]>;

  /**
   * Export the entire disk image as a Blob for download.
   * TODO(storage): The Blob mime-type should be 'application/octet-stream'.
   */
  exportDisk(): Promise<Blob>;

  /**
   * Replace the current disk state from an imported Blob.
   * TODO(storage): Validate the image format before writing.
   */
  importDisk(blob: Blob): Promise<void>;
}

// ── Null storage — safe no-op fallback ────────────────────

/**
 * NullVMStorage satisfies IVMStorage with no side-effects.
 * Use it as the default until a real implementation is ready.
 */
export class NullVMStorage implements IVMStorage {
  async saveSnapshot(_snapshot: VMSnapshot): Promise<void> {
    console.warn('[NullVMStorage] saveSnapshot called but no real storage is configured.');
  }

  async loadSnapshot(_id: string): Promise<VMSnapshot | null> {
    return null;
  }

  async deleteSnapshot(_id: string): Promise<void> {
    // no-op
  }

  async listSnapshots(): Promise<VMSnapshotMeta[]> {
    return [];
  }

  async exportDisk(): Promise<Blob> {
    return new Blob([], { type: 'application/octet-stream' });
  }

  async importDisk(_blob: Blob): Promise<void> {
    console.warn('[NullVMStorage] importDisk called but no real storage is configured.');
  }
}
