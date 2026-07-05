// commands/find.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const findCommand: Command = {
  name: "find",
  summary: "Recursively search for files and directories",
  usage: "find [path] [-name pattern] [-type f|d|l]",
  execute(ctx) {
    let startPath = ".";
    let name: string | undefined;
    let type: "f" | "d" | "l" | undefined;

    const rest = [...ctx.args];
    if (rest.length > 0 && !rest[0].startsWith("-")) {
      startPath = rest.shift() as string;
    }

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "-name") {
        name = rest[i + 1];
        i++;
      } else if (arg === "-type") {
        const t = rest[i + 1];
        if (t === "f" || t === "d" || t === "l") type = t;
        i++;
      }
    }

    try {
      const results = ctx.fs.find(startPath, { name, type });
      return ok(results.join("\n") + (results.length > 0 ? "\n" : ""));
    } catch (err) {
      const msg = err instanceof FSError ? err.message : String(err);
      return fail(`find: ${msg}\n`);
    }
  },
};
