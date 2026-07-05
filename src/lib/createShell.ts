// createShell.ts
// Integration layer. Builds a fully wired VirtualFileSystem + CommandRegistry
// + Shell, registers every command exactly once, layers `command --help`
// support on top of every registered command, and installs the two
// required aliases (`dir` -> `ls`, `sh` -> `bash`) without modifying any
// individual command module.
//
// This file intentionally does NOT touch anything under commands/ or
// src/lib/commands/ — it only orchestrates what already exists there.

import { VirtualFileSystem } from "./filesystem/filesystem";
import { CommandRegistry } from "./commands/registry";
import { allCommands } from "./commands";
import { Shell } from "./shell";
import { Command, CommandContext } from "./commands/types";
import { ShellEnv } from "./filesystem/types";

export interface QuantumCoreSession {
  fs: VirtualFileSystem;
  registry: CommandRegistry;
  shell: Shell;
  run: (line: string) => ReturnType<Shell["run"]>;
}

/**
 * Alias map: alias name -> real target command name already present in
 * `allCommands`. Aliases are dispatched through the target command's own
 * `execute`, so behavior (including flags, redirection compatibility, and
 * exit codes) is identical to invoking the target directly.
 */
const COMMAND_ALIASES: Record<string, string> = {
  dir: "ls",
};

/**
 * Wraps a command so that any invocation containing `--help` short-circuits
 * into a standard usage summary instead of running the command body. This
 * mirrors how real GNU coreutils binaries respond to `--help`.
 */
function withHelpSupport(command: Command): Command {
  return {
    name: command.name,
    summary: command.summary,
    usage: command.usage,
    execute(ctx: CommandContext) {
      if (ctx.args.includes("--help")) {
        return {
          stdout: `Usage: ${command.usage}\n\n${command.summary}\n`,
          stderr: "",
          exitCode: 0,
        };
      }
      return command.execute(ctx);
    },
  };
}

/** Builds an alias command that delegates entirely to `target`, under `aliasName`. */
function createAliasCommand(aliasName: string, target: Command): Command {
  return {
    name: aliasName,
    summary: `${target.summary} (alias for '${target.name}')`,
    usage: target.usage.replace(new RegExp(`^${target.name}\\b`), aliasName),
    execute: target.execute,
  };
}

/**
 * Registers every command from `allCommands` exactly once, wrapped with
 * `--help` support, then layers on the configured aliases. Throws if any
 * duplicate registration is detected, whether from `allCommands` itself or
 * from an alias colliding with a real command name.
 */
function buildRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  const registeredNames = new Set<string>();

  // Commands whose real name is itself an alias key (e.g. a standalone
  // `dir` or `sh` module) are skipped here in favor of the alias defined
  // in COMMAND_ALIASES below, so the alias's target implementation is the
  // single source of truth and no name is ever registered twice.
  const aliasNames = new Set(Object.keys(COMMAND_ALIASES));

  for (const command of allCommands) {
    if (registeredNames.has(command.name)) {
      throw new Error(`Duplicate command registration detected: '${command.name}'`);
    }
    if (aliasNames.has(command.name)) {
      // Superseded by an alias definition; do not register the standalone
      // implementation under this name.
      continue;
    }
    registeredNames.add(command.name);
    registry.register(withHelpSupport(command));
  }

  for (const [aliasName, targetName] of Object.entries(COMMAND_ALIASES)) {
    if (registeredNames.has(aliasName)) {
      throw new Error(
        `Duplicate command registration detected: alias '${aliasName}' collides with an existing command`
      );
    }
    const target = registry.get(targetName);
    if (!target) {
      throw new Error(`Cannot register alias '${aliasName}': target command '${targetName}' was not found`);
    }
    registeredNames.add(aliasName);
    registry.register(withHelpSupport(createAliasCommand(aliasName, target)));
  }

  return registry;
}

/**
 * Creates a ready-to-use Quantum Core session: filesystem, registry (with
 * every command + alias registered exactly once), and a Shell bound to
 * both. `which`, `man`, and `help` all read from this same registry
 * instance, so they stay consistent with whatever is actually dispatchable.
 */
export function createShell(): QuantumCoreSession {
  const fs = new VirtualFileSystem();
  const registry = buildRegistry();

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
