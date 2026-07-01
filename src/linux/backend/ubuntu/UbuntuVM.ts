// ===========================================================
// UbuntuVM — a clean wrapper around the actual emulator.
// All emulator-specific details are confined here so no other
// module ever sees v86 or any other engine directly.
//
// TODO(v86): When integrating the v86 emulator:
//   1. npm install v86  (or load via <script> / dynamic import)
//   2. Import V86 from 'v86'
//   3. Replace every TODO(v86) comment below with real calls.
//   4. Nothing outside this file needs to change.
// ===========================================================

import type { VMConfig, VMEventListener, VMEventMap, VMState } from './types';

export class UbuntuVM {
  private config: VMConfig;
  private state: VMState = 'idle';

  // TODO(v86): private emulator: V86 | null = null;

  private listeners: {
    [K in keyof VMEventMap]?: Set<VMEventListener<K>>;
  } = {};

  constructor(config: VMConfig) {
    this.config = config;
  }

  // ── Lifecycle ──────────────────────────────────────────────

  async initialize(): Promise<void> {
    this.setState('initializing');

    // TODO(v86): Dynamically import v86 and construct the emulator:
    //
    // const { V86 } = await import('v86');
    // this.emulator = new V86({
    //   wasm_path: '/v86/v86.wasm',
    //   memory_size: this.config.memoryMB * 1024 * 1024,
    //   bios: { url: this.config.biosUrl ?? '/v86/bios/seabios.bin' },
    //   vga_bios: { url: this.config.vgaBiosUrl ?? '/v86/bios/vgabios.bin' },
    //   hda: { url: this.config.diskImageUrl ?? '/v86/images/ubuntu-minimal.img', async: true },
    //   screen_container: null,   // headless — we use serial for PTY I/O
    //   serial_container_xtermjs: null,
    //   autostart: false,
    // });
    //
    // Wire up serial output → onOutput event:
    // this.emulator.add_listener('serial0-output-byte', (byte: number) => {
    //   this.emit('output', String.fromCharCode(byte));
    // });

    // Placeholder: simulate a short init delay in stub mode.
    await new Promise<void>((resolve) => setTimeout(resolve, 80));
  }

  async boot(): Promise<void> {
    this.setState('booting');

    // TODO(v86): this.emulator?.run();
    //
    // Then listen for the shell prompt to appear in serial output,
    // confirm the VM is fully booted, and setState('ready').
    //
    // Example heuristic (adapt to your image):
    // waitForOutput(/\$\s*$/).then(() => {
    //   this.setState('ready');
    //   this.emit('ready', undefined);
    // });

    // Placeholder: simulate boot time.
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    this.setState('ready');
    this.emit('ready', undefined);
  }

  shutdown(): void {
    // TODO(v86): this.emulator?.stop();
    this.setState('shutdown');
    this.emit('exit', 0);
  }

  destroy(): void {
    // TODO(v86): this.emulator?.destroy();
    this.state = 'idle';
    this.listeners = {};
  }

  // ── Terminal I/O ───────────────────────────────────────────

  sendInput(data: string): void {
    if (this.state !== 'ready' && this.state !== 'running') return;

    // TODO(v86): Write each character to the serial port:
    // for (const char of data) {
    //   this.emulator?.serial0_send(char);
    // }
  }

  resize(cols: number, rows: number): void {
    this.config.cols = cols;
    this.config.rows = rows;

    // TODO(v86): If the image supports stty resize via serial:
    // this.sendInput(`stty cols ${cols} rows ${rows}\n`);
  }

  // ── Snapshot / state persistence ──────────────────────────

  async saveSnapshot(): Promise<ArrayBuffer | null> {
    // TODO(v86): return await this.emulator?.save_state() ?? null;
    return null;
  }

  async loadSnapshot(snapshot: ArrayBuffer): Promise<void> {
    // TODO(v86): await this.emulator?.restore_state(snapshot);
    void snapshot;
  }

  // ── Accessors ─────────────────────────────────────────────

  getState(): VMState {
    return this.state;
  }

  isReady(): boolean {
    return this.state === 'ready' || this.state === 'running';
  }

  // ── Event emitter ─────────────────────────────────────────

  on<K extends keyof VMEventMap>(event: K, listener: VMEventListener<K>): void {
    if (!this.listeners[event]) {
      (this.listeners[event] as Set<VMEventListener<K>>) = new Set();
    }
    (this.listeners[event] as Set<VMEventListener<K>>).add(listener);
  }

  off<K extends keyof VMEventMap>(event: K, listener: VMEventListener<K>): void {
    (this.listeners[event] as Set<VMEventListener<K>> | undefined)?.delete(listener);
  }

  private emit<K extends keyof VMEventMap>(event: K, payload: VMEventMap[K]): void {
    (this.listeners[event] as Set<VMEventListener<K>> | undefined)?.forEach((l) =>
      l(payload)
    );
  }

  private setState(next: VMState): void {
    this.state = next;
    this.emit('stateChanged', next);
  }
}
