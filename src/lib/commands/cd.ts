// commands/cd.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const cdCommand: Command = {
  name: "cd",
  summary: "Change the current working directory",
  usage: "cd [path]",
  execute(ctx) {
    const target = ctx.args[0] ?? ctx.env.HOME ?? "/home/operator";
    try {
      ctx.fs.changeDir(target);
      return ok("");
    } catch (err) {
      const msg = err instanceof FSError ? err.message : String(err);
      return fail(`cd: ${msg}\n`);
    }
  },
};
