// commands/head.ts
import { Command, fail, ok, splitArgs } from "./types";
import { FSError } from "../filesystem/types";

export const headCommand: Command = {
  name: "head",
  summary: "Print the first lines of a file",
  usage: "head [-n N] <file...>",
  execute(ctx) {
    const { positional } = splitArgs(ctx.args);
    let count = 10;
    const files: string[] = [];
    for (let i = 0; i < ctx.args.length; i++) {
      const arg = ctx.args[i];
      if (arg === "-n") {
        count = parseInt(ctx.args[i + 1], 10) || 10;
        i++;
      } else if (/^-\d+$/.test(arg)) {
        count = -parseInt(arg, 10);
      } else if (!arg.startsWith("-")) {
        files.push(arg);
      }
    }
    if (files.length === 0 && positional.length === 0) {
      return fail("head: missing file operand\n");
    }

    let out = "";
    const errors: string[] = [];
    const targets = files.length > 0 ? files : positional;
    for (const target of targets) {
      try {
        const content = ctx.fs.readFile(target);
        const lines = content.split("\n");
        if (targets.length > 1) out += `==> ${target} <==\n`;
        out += lines.slice(0, count).join("\n");
        if (!out.endsWith("\n")) out += "\n";
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`head: cannot open '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
