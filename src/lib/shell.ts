// shell.ts
// Thin shell layer sitting on top of the command registry. Responsible for
// tokenizing a raw command-line string (respecting quotes), splitting on
// pipes ("|"), and handling output redirection ("> file" / ">> file")
// before dispatching to individual commands. This is the integration point
// a browser terminal component should call into.

import { CommandRegistry } from "./commands/registry";
import { CommandContext } from "./commands/types";
import { VirtualFileSystem } from "./filesystem/filesystem";
import { CommandResult, ShellEnv } from "./filesystem/types";

/** Tokenizes a command line, respecting single and double quotes. */
export function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
      continue;
    }
    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    // Split ">" ">>" and "|" into their own tokens even without spaces.
    if (ch === ">" || ch === "|") {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      if (ch === ">" && line[i + 1] === ">") {
        tokens.push(">>");
        i++;
      } else {
        tokens.push(ch);
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

interface ParsedStage {
  command: string;
  args: string[];
  redirect?: { mode: "overwrite" | "append"; target: string };
}

function parseStage(tokens: string[]): ParsedStage {
  const redirectIdx = tokens.findIndex((t) => t === ">" || t === ">>");
  if (redirectIdx === -1) {
    const [command, ...args] = tokens;
    return { command, args };
  }
  const mode = tokens[redirectIdx] === ">>" ? "append" : "overwrite";
  const target = tokens[redirectIdx + 1];
  const [command, ...args] = tokens.slice(0, redirectIdx);
  return { command, args, redirect: target ? { mode, target } : undefined };
}

/** Splits a full token stream into pipeline stages on unquoted "|" tokens. */
function splitPipeline(tokens: string[]): string[][] {
  const stages: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (token === "|") {
      stages.push(current);
      current = [];
    } else {
      current.push(token);
    }
  }
  stages.push(current);
  return stages;
}

export class Shell {
  public historyLog: string[] = [];

  constructor(public fs: VirtualFileSystem, public registry: CommandRegistry, public env: ShellEnv = {}) {}

  public getCwd(): string {
    return this.fs.getCwd();
  }

  /** Executes a raw command line, handling pipes and redirection, returning the final result. */
  public run(line: string): CommandResult {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    this.historyLog.push(trimmed);

    const tokens = tokenize(trimmed);
    const pipelineStages = splitPipeline(tokens);
    
    let stdin: string | undefined = undefined;
    let lastResult: CommandResult = { stdout: "", stderr: "", exitCode: 0 };

    for (let i = 0; i < pipelineStages.length; i++) {
      const isLastStage = i === pipelineStages.length - 1;
      const { command, args, redirect } = parseStage(pipelineStages[i]);

      if (!command) {
        return { stdout: "", stderr: "shell: syntax error near unexpected token\n", exitCode: 2 };
      }

      const handler = this.registry.get(command);
      if (!handler) {
        return { stdout: "", stderr: `${command}: command not found\n`, exitCode: 127 };
      }

      const ctx: CommandContext = {
        fs: this.fs,
        env: this.env,
        args,
        stdin,
        registry: this.registry,
        history: this.historyLog,
      };
      lastResult = handler.execute(ctx);

      if (isLastStage && redirect) {
        try {
          this.fs.writeFile(redirect.target, lastResult.stdout, redirect.mode === "append");
          lastResult = { stdout: "", stderr: lastResult.stderr, exitCode: lastResult.exitCode };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          lastResult = { stdout: "", stderr: `${command}: ${msg}\n`, exitCode: 1 };
        }
      }

      stdin = lastResult.stdout;

      if (lastResult.exitCode !== 0 && !isLastStage) {
        // A failed stage still propagates empty stdin forward, matching a
        // simplified (non-`set -o pipefail`) shell pipeline behavior.
        stdin = "";
      }
    }

    return lastResult;
  }
}
