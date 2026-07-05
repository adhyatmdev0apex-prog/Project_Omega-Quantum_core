// commands/echo.ts
// Note: output redirection (`>`, `>>`) is handled at the shell layer
// (see shell.ts), which intercepts redirection tokens before dispatch and
// writes this command's stdout to the target file instead of the terminal.
import { Command, ok, splitArgs } from "./types";

export const echoCommand: Command = {
  name: "echo",
  summary: "Print arguments, optionally redirected to a file with > or >>",
  usage: "echo [-n] <text...> [> file | >> file]",
  execute(ctx) {
    const { flags, positional } = splitArgs(ctx.args);
    const noNewline = flags.has("n");
    const text = positional.join(" ");
    return ok(noNewline ? text : text + "\n");
  },
};
