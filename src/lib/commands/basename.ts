// commands/basename.ts
import { Command, fail, ok } from "./types";
import { basename } from "../filesystem/path";

export const basenameCommand: Command = {
  name: "basename",
  summary: "Strip directory and optional suffix from a path",
  usage: "basename <path> [suffix]",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("basename: missing operand\n");
    }
    const [path, suffix] = ctx.args;
    return ok(basename(path, suffix) + "\n");
  },
};
