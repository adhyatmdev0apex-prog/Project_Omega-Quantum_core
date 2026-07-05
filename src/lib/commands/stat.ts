// commands/stat.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

export const statCommand: Command = {
  name: "stat",
  summary: "Display detailed status of a file or directory",
  usage: "stat <path...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("stat: missing operand\n");
    }
    let out = "";
    const errors: string[] = [];
    for (const target of ctx.args) {
      try {
        const info = ctx.fs.stat(target, false);
        out += [
          `  File: ${info.path}${info.target ? ` -> ${info.target}` : ""}`,
          `  Size: ${info.size}\t\tType: ${info.type}`,
          `Access: (${info.octal}/${info.permissionString})  Uid: (${info.owner})   Gid: (${info.group})`,
          `Modify: ${info.modifiedAt.toISOString()}`,
          `Access: ${info.accessedAt.toISOString()}`,
          `Change: ${info.createdAt.toISOString()}`,
          ` Inode: ${info.inode}\t\tLinks: ${info.links}`,
          "",
        ].join("\n");
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`stat: cannot stat '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
