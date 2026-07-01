// commands/realpath.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const realpathCommand: Command = {
  name: "realpath",
  summary: "Print the canonicalized absolute path, resolving symlinks",
  usage: "realpath <path...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("realpath: missing operand\n");
    }
    let out = "";
    const errors: string[] = [];
    for (const target of ctx.args) {
      try {
        out += ctx.fs.realpath(target) + "\n";
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`realpath: ${target}: ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
