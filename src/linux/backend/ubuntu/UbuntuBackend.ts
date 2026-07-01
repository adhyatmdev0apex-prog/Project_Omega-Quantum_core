// ===========================================================
// UbuntuBackend — implements LinuxBackend using UbuntuVM.
// This is the glue between the engine abstraction and the VM
// wrapper. LinuxEngine only ever sees LinuxBackend; it never
// touches UbuntuVM or any emulator directly.
//
// Command routing strategy (pre-v86):
//   • While the VM is not ready, route through a local
//     command interpreter so the terminal stays responsive.
//   • Once v86 is integrated, sendInput() forwards keystrokes
//     directly to the VM serial port and output streams back
//     through the onOutput event.
//
// TODO(v86): After UbuntuVM.boot() resolves:
//   1. Set this.vmReady = true.
//   2. Change execute() to call this.vm.sendInput(command + '\n')
//      and collect the serial output via a Promise that resolves
//      when the next shell prompt appears.
//   3. Subscribe to vm.on('output', ...) in init() and forward
//     bytes to LinuxEngine / xterm via a streaming callback if
//     the engine exposes one in a future iteration.
// ===========================================================

import type { CommandResult, LinuxBackend, SessionState } from '../../../lib/linuxEngine';
import { UbuntuVM } from './UbuntuVM';
import type { VMConfig } from './types';

const DEFAULT_VM_CONFIG: VMConfig = {
  cols: 80,
  rows: 24,
  memoryMB: 256,
};

export class UbuntuBackend implements LinuxBackend {
  readonly name = 'ubuntu';

  private vm: UbuntuVM;
  private vmReady = false;
  private outputBuffer = '';

  constructor(config: Partial<VMConfig> = {}) {
    this.vm = new UbuntuVM({ ...DEFAULT_VM_CONFIG, ...config });
  }

  // ── LinuxBackend contract ──────────────────────────────────

  async init(state: SessionState): Promise<void> {
    void state; // state used to seed VM environment in a future pass

    await this.vm.initialize();
    await this.vm.boot();

    // TODO(v86): Wire up the serial output stream so characters
    // produced by the VM flow back to the terminal in real time:
    //
    // this.vm.on('output', (chunk) => {
    //   this.outputBuffer += chunk;
    // });

    this.vmReady = this.vm.isReady();
  }

  async execute(command: string, state: SessionState): Promise<CommandResult> {
    if (!this.vmReady) {
      return {
        output: '[ubuntu] VM not ready. Run init() first.',
        exitCode: 1,
      };
    }

    // TODO(v86): Replace this stub with real VM I/O:
    //
    // 1. Clear outputBuffer.
    // 2. this.vm.sendInput(command + '\n');
    // 3. Wait for the shell prompt to reappear in outputBuffer.
    // 4. Strip the echoed command and trailing prompt, then return
    //    the remaining text as `output`.
    //
    // Example skeleton:
    //
    // this.outputBuffer = '';
    // this.vm.sendInput(command + '\n');
    // const raw = await this.waitForPrompt(state);
    // const output = stripEchoAndPrompt(raw, command, state);
    // return { output, exitCode: this.lastExitCode };

    // Stub response while v86 is not yet integrated.
    return fallbackExecute(command, state);
  }

  dispose(): void {
    this.vm.shutdown();
    this.vm.destroy();
    this.vmReady = false;
  }

  // ── VM pass-through helpers (used by UbuntuBackend consumers) ─

  getVM(): UbuntuVM {
    return this.vm;
  }

  resize(cols: number, rows: number): void {
    this.vm.resize(cols, rows);
  }

  // ── Private helpers ────────────────────────────────────────

  // TODO(v86): Implement waitForPrompt() using a Promise that
  // resolves when outputBuffer matches /\$\s*$/ (or your prompt
  // pattern). Add a timeout to avoid hanging forever.
  //
  // private waitForPrompt(state: SessionState): Promise<string> { ... }
}

// ===========================================================
// fallbackExecute — mirrors StubBackend but branded as ubuntu.
// Removed once the real VM executes commands.
// ===========================================================

function fallbackExecute(command: string, state: SessionState): CommandResult {
  if (!command) return { output: '' };
  const [cmd, ...args] = command.split(/\s+/);

  switch (cmd) {
    case 'clear':
      return { output: '', clear: true, exitCode: 0 };
    case 'pwd':
      return { output: state.cwd, exitCode: 0 };
    case 'whoami':
      return { output: state.user, exitCode: 0 };
    case 'hostname':
      return { output: state.host, exitCode: 0 };
    case 'history':
      return {
        output: state.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') || '',
        exitCode: 0,
      };
    case 'echo':
      return { output: args.join(' '), exitCode: 0 };
    case 'uname':
      return { output: 'Linux quantum-core 6.1.0-ubuntu #1 SMP x86_64 GNU/Linux', exitCode: 0 };
    case 'help':
      return {
        output: [
          'Quantum Core — Ubuntu backend (stub mode)',
          'The Ubuntu VM is initialized but v86 is not yet connected.',
          'Available: clear, pwd, whoami, hostname, history, echo, uname, help.',
        ].join('\n'),
        exitCode: 0,
      };
    default:
      return {
        output: `bash: ${cmd}: command not found`,
        exitCode: 127,
      };
  }
}
