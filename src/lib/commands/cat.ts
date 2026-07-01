// commands/cat.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const catCommand: Command = {
  name: "cat",
  summary: "Concatenate and print file contents",
  usage: "cat [-n] <file...>",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    if (positional.length === 0) {
      if (ctx.stdin !== undefined) return ok(ctx.stdin);
      return fail("cat: missing file operand\n");
    }
    const numberLines = flags.has("n");
    let out = "";
    const errors: string[] = [];
    for (const target of positional) {
      try {
        const content = ctx.fs.readFile(target);
        if (numberLines) {
          const lines = content.split("\n");
          out += lines.map((l, i) => `${String(i + 1).padStart(6)}\t${l}`).join("\n");
        } else {
          out += content;
        }
        if (!out.endsWith("\n")) out += "\n";
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`cat: ${target}: ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
