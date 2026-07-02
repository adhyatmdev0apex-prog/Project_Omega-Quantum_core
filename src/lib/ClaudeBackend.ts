import { LinuxBackend, SessionState, CommandResult } from "./linuxEngine";
import { createShell } from "./createShell";

const shell = createShell();

export const ClaudeBackend: LinuxBackend = {
  name: "claude-shell",

  execute(command: string, state: SessionState): CommandResult {
    const result = shell.run(command);

    return {
      output: result.stdout + result.stderr,
      cwd: shell.getCwd(),          // ⭐ ADD THIS
      exitCode: result.exitCode,
    };
  },
};