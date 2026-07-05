// commands/which.ts
import { Command, fail, ok } from "./types";

export const whichCommand: Command = {
  name: "which",
  summary: "Locate a command by searching the registry",
  usage: "which <command...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("which: missing operand\n");
    }
    let out = "";
    let missing = false;
    for (const name of ctx.args) {
      const found = ctx.registry?.has(name);
      if (found) {
        out += `/usr/bin/${name}\n`;
      } else {
        missing = true;
        out += `which: no ${name} in (${ctx.env.PATH ?? ""})\n`;
      }
    }
    return missing ? { stdout: out, stderr: "", exitCode: 1 } : ok(out);
  },
};
