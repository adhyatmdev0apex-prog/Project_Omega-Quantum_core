// ===========================================================
// VirtualLinuxBackend — the original simulated backend.
// Wraps StubBackend so it conforms to LinuxBackend and can be
// swapped out by BackendManager without touching LinuxEngine.
//
// This backend is the permanent fallback. It requires no external
// resources and is always available, even offline.
// ===========================================================

import type { CommandResult, LinuxBackend, SessionState } from '../../lib/linuxEngine';
import { StubBackend } from '../../lib/linuxEngine';

export class VirtualLinuxBackend implements LinuxBackend {
  readonly name = 'virtual';

  async execute(command: string, state: SessionState): Promise<CommandResult> {
    return StubBackend.execute(command, state);
  }

  init(_state: SessionState): void {
    // No async setup required for the virtual backend.
  }

  dispose(): void {
    // Nothing to tear down.
  }
}
