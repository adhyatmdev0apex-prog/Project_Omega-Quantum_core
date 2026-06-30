// ===========================================================
// linuxEngine — modular terminal engine for the Linux Lab.
// Independent from the UI. Defines a pluggable backend interface
// so a future browser-based Linux engine (WebAssembly, worker,
// or remote PTY) can be connected without changing the interface.
//
// The engine owns: session state, command history, the current
// working directory, and a save/restore contract. The UI layer
// (LinuxLabPage) subscribes to changes and renders xterm.js.
// ===========================================================
import { VirtualLinuxBackend } from "./linux/backend";

export interface SessionState {
  cwd: string;
  user: string;
  host: string;
  history: string[];
  env: Record<string, string>;
  startedAt: number;
  lastCommand: string | null;
  exitCode: number | null;
}

export interface CommandResult {
  output: string;
  cwd?: string;
  exitCode?: number;
  clear?: boolean;
}

export interface LinuxBackend {
  name: string;
  execute(command: string, state: SessionState): Promise<CommandResult> | CommandResult;
  init?(state: SessionState): Promise<void> | void;
  dispose?(): void;
}

export type SessionListener = (state: SessionState) => void;

const STORE_KEY = 'linuxlab.session.v1';

export function defaultSession(): SessionState {
  return {
    cwd: '/home/operator',
    user: 'operator',
    host: 'quantum-core',
    history: [],
    env: { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: '/home/operator', SHELL: '/bin/bash' },
    startedAt: Date.now(),
    lastCommand: null,
    exitCode: null,
  };
}

export class LinuxEngine {
  private backend: LinuxBackend | null = null;
  private state: SessionState;
  private listeners = new Set<SessionListener>();
  private running = false;

  constructor(initial?: Partial<SessionState>) {
    this.state = { ...defaultSession(), ...initial };
  }

  attach(backend: LinuxBackend) {
    this.backend = backend;
  }

  detach() {
    this.backend?.dispose?.();
    this.backend = null;
  }

  getState(): SessionState {
    return { ...this.state };
  }

  subscribe(fn: SessionListener): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.getState();
    this.listeners.forEach((l) => l(snap));
  }

  async run(command: string): Promise<CommandResult> {
    if (this.running || !this.backend) {
      return { output: '', exitCode: 1 };
    }
    this.running = true;
    const trimmed = command.trim();
    if (trimmed) {
      this.state.history = [...this.state.history, trimmed].slice(-200);
      this.state.lastCommand = trimmed;
    }

    try {
      const result = await this.backend.execute(trimmed, this.getState());
      if (result.cwd) this.state.cwd = result.cwd;
      this.state.exitCode = result.exitCode ?? 0;
      this.emit();
      return result;
    } catch (err) {
      this.state.exitCode = 1;
      this.emit();
      return {
        output: `bash: command failed: ${err instanceof Error ? err.message : String(err)}`,
        exitCode: 1,
      };
    } finally {
      this.running = false;
    }
  }

  setCwd(cwd: string) {
    this.state.cwd = cwd;
    this.emit();
  }

  reset() {
    this.state = defaultSession();
    this.emit();
  }

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch { /* ignore */ }
  }

  restore(): boolean {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      this.state = { ...defaultSession(), ...JSON.parse(raw) };
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  clearSaved() {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
  }

  hasSavedSession(): boolean {
    try { return Boolean(localStorage.getItem(STORE_KEY)); } catch { return false; }
  }

  dispose() {
    this.detach();
    this.listeners.clear();
  }
}

const backend = new VirtualLinuxBackend();

export const StubBackend: LinuxBackend = {
  name: "virtual-linux",

  execute(command: string, state: SessionState): CommandResult {
    return backend.execute(command, state);
  },
};