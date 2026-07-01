// ===========================================================
// Ubuntu VM types — shared interfaces for the Ubuntu backend
// and VM wrapper. These are internal to the ubuntu/ folder;
// nothing outside should import from here directly.
// ===========================================================

export type VMState =
  | 'idle'
  | 'initializing'
  | 'booting'
  | 'ready'
  | 'running'
  | 'suspended'
  | 'error'
  | 'shutdown';

export interface VMConfig {
  /** Number of terminal columns. */
  cols: number;
  /** Number of terminal rows. */
  rows: number;
  /** Memory in megabytes to allocate to the VM. */
  memoryMB: number;
  /** Optional path/URL to a disk image (used by v86 later). */
  diskImageUrl?: string;
  /** Optional path/URL to a BIOS image (used by v86 later). */
  biosUrl?: string;
  /** Optional path/URL to a VGA BIOS image (used by v86 later). */
  vgaBiosUrl?: string;
}

export interface VMEventMap {
  ready: void;
  output: string;
  error: string;
  exit: number;
  stateChanged: VMState;
}

export type VMEventListener<K extends keyof VMEventMap> = (
  payload: VMEventMap[K]
) => void;
