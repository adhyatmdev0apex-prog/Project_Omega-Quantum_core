// commands/pwd.ts
import { Command, ok } from "./types";

export const pwdCommand: Command = {
  name: "pwd",
  summary: "Print the current working directory",
  usage: "pwd",
  execute(ctx) {
    return ok(ctx.fs.getCwd() + "\n");
  },
};
