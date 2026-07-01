// index.ts
// Public entry point for the Quantum Core virtual filesystem package.
// Import `createSession()` from here to get a ready-to-use VFS + shell
// pair that a browser terminal component can drive.

import { VirtualFileSystem } from "./filesystem/filesystem";
import { CommandRegistry } from "./commands/registry";
import { allCommands } from "./commands";
import { Shell } from "./shell";
import { ShellEnv } from "./filesystem/types";

export interface QuantumCoreSession {
  fs: VirtualFileSystem;
  registry: CommandRegistry;
  shell: Shell;
  run: (line: string) => ReturnType<Shell["run"]>;
}

export function createSession(): QuantumCoreSession {
  const fs = new VirtualFileSystem();
  const registry = new CommandRegistry();
  registry.registerAll(allCommands);

  const env: ShellEnv = {
    HOME: "/home/operator",
    USER: "operator",
    SHELL: "/bin/bash",
    PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    HOSTNAME: fs.hostname,
    TERM: "xterm-256color",
  };

  const shell = new Shell(fs, registry, env);

  return {
    fs,
    registry,
    shell,
    run: (line: string) => shell.run(line),
  };
}

export { VirtualFileSystem } from "./filesystem/filesystem";
export { CommandRegistry } from "./commands/registry";
export { Shell, tokenize } from "./shell";
export * from "./filesystem/types";
export * from "./commands/types";
