// commands/file.ts
import { Command, fail, ok } from "./types";
import { FSError } from "../filesystem/types";

function describeType(type: string, name: string, content?: string): string {
  if (type === "directory") return "directory";
  if (type === "symlink") return "symbolic link";
  if (name.endsWith(".py")) return "Python script, ASCII text executable";
  if (name.endsWith(".sh")) return "Bourne-Again shell script, ASCII text executable";
  if (name.endsWith(".md")) return "ASCII text (Markdown document)";
  if (name.endsWith(".json")) return "JSON data";
  if (content !== undefined && content.length === 0) return "empty";
  return "ASCII text";
}

export const fileCommand: Command = {
  name: "file",
  summary: "Determine file type",
  usage: "file <path...>",
  execute(ctx) {
    if (ctx.args.length === 0) {
      return fail("file: missing operand\n");
    }
    let out = "";
    const errors: string[] = [];
    for (const target of ctx.args) {
      try {
        const info = ctx.fs.stat(target, false);
        const content = info.type === "file" ? ctx.fs.readFile(target) : undefined;
        out += `${target}: ${describeType(info.type, info.name, content)}\n`;
      } catch (err) {
        const msg = err instanceof FSError ? err.message : String(err);
        errors.push(`file: cannot open '${target}': ${msg}`);
      }
    }
    if (errors.length > 0) return { stdout: out, stderr: errors.join("\n") + "\n", exitCode: 1 };
    return ok(out);
  },
};
