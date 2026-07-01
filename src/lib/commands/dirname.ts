// commands/dirname.ts
import { Command, fail, ok } from "./types";
import { dirname } from "../filesystem/path";

export const dirnameCommand: Command = {
  name: "dirname",
  summary: "Strip the final component from a path",
  usage: "dirname <path>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("dirname: missing operand\n");
    }
    return ok(dirname(ctx.args[0]) + "\n");
  },
};
