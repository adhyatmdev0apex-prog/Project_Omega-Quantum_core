import { Command, ok, fail } from "./types";

export const wcCommand: Command = {
  name: "wc",
  summary: "Count lines, words and bytes in a file.",
  usage: "wc [-l|-w|-c] <file>",

  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("wc: missing operand");
    }

    const mode =
      ctx.args[0].startsWith("-")
        ? ctx.args[0]
        : null;

    const filePath = mode ? ctx.args[1] : ctx.args[0];

    if (!filePath) {
      return fail("wc: missing file operand");
    }

    const file = ctx.fs.readFile(filePath);

    if (!file) {
      return fail(`wc: ${filePath}: No such file`);
    }

    const text = file;

    const lines =
      text.length === 0
        ? 0
        : text.split("\n").length;

    const words =
      text.trim().length === 0
        ? 0
        : text.trim().split(/\s+/).length;

    const bytes = text.length;

    switch (mode) {
      case "-l":
        return ok(`${lines} ${filePath}`);

      case "-w":
        return ok(`${words} ${filePath}`);

      case "-c":
        return ok(`${bytes} ${filePath}`);

      case null:
        return ok(
          `${lines} ${words} ${bytes} ${filePath}`
        );

      default:
        return fail(`wc: invalid option '${mode}'`);
    }
  },
};