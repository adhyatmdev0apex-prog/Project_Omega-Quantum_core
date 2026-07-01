// commands/grep.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const grepCommand: Command = {
  name: "grep",
  summary: "Search for a pattern in files",
  usage: "grep [-i] [-r] [-n] <pattern> <file...>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length < 1) {
      return fail("grep: missing pattern\n");
    }
    const ignoreCase = flags.has("i");
    const recursive = flags.has("r") || flags.has("R");
    const showLineNumbers = flags.has("n");

    const [pattern, ...files] = positional;

    if (files.length === 0 && ctx.stdin !== undefined) {
      const regex = new RegExp(pattern, ignoreCase ? "i" : "");
      const lines = ctx.stdin.split("\n");
      const matched = lines.filter((l) => regex.test(l));
      return ok(matched.join("\n") + (matched.length > 0 ? "\n" : ""));
    }

    if (files.length === 0) {
      return fail("grep: missing file operand\n");
    }

    let out = "";
    const errors: string[] = [];
    for (const target of files) {
      try {
        const matches = ctx.fs.grep(pattern, target, { ignoreCase, recursive });
        for (const m of matches) {
          const prefix = files.length > 1 ? `${m.path}:` : "";
          const lineNo = showLineNumbers ? `${m.lineNumber}:` : "";
          out += `${prefix}${lineNo}${m.line}\n`;
        }
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`grep: ${target}: ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
