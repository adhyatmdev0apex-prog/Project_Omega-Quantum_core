// commands/types.ts
// Shared contract every pluggable command implements.

import { CommandResult, ShellEnv } from "../filesystem/types";
import { VirtualFileSystem } from "../filesystem/filesystem";
import { CommandRegistry } from "./registry";

export interface CommandContext {
  fs: VirtualFileSystem;
  env: ShellEnv;
  /** Raw argv, not including the command name itself. */
  args: string[];
  /** Raw stdin piped into this command, if any (used by pipelines). */
  stdin?: string;
  /** The full command registry, available for introspection commands like `which`/`man`. */
  registry?: CommandRegistry;
  /** Recent command-line history, newest last, available to commands like `history`. */
  history?: string[];
}

export interface Command {
  name: string;
  summary: string;
  usage: string;
  execute(ctx: CommandContext): CommandResult;
}

export function ok(stdout: string = ""): CommandResult {
  return { stdout, stderr: "", exitCode: 0 };
}

export function fail(stderr: string, exitCode: number = 1): CommandResult {
  return { stdout: "", stderr, exitCode };
}

/** Splits argv into flags (starting with "-") and positional arguments. */
export function splitArgs(args: string[]): { flags: Set<string>; positional: string[] } {
  const flags = new Set<string>();
  const positional: string[] = [];
  for (const arg of args) {
    if (arg.startsWith("--") && arg.length > 2) {
      flags.add(arg.slice(2));
    } else if (arg.startsWith("-") && arg.length > 1 && arg !== "-") {
      for (const ch of arg.slice(1)) flags.add(ch);
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}
