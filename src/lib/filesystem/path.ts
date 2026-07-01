// filesystem/path.ts
// POSIX-style path manipulation utilities (no Node.js `path` module, browser-safe).

export function isAbsolute(p: string): boolean {
  return p.startsWith("/");
}

/** Splits a path into its non-empty segments, ignoring repeated slashes. */
export function splitSegments(p: string): string[] {
  return p.split("/").filter((s) => s.length > 0);
}

/** Joins segments with "/" and normalizes the result (does not resolve "." or ".."). */
export function join(...parts: string[]): string {
  const joined = parts.filter((p) => p.length > 0).join("/");
  return normalize(joined.startsWith("/") ? joined : `/${joined}`).replace(/^\/+/, "/");
}

/**
 * Resolves "." and ".." segments against a base absolute path (cwd) and
 * returns a fully normalized absolute path. Relative inputs are resolved
 * against `cwd`; absolute inputs are resolved against "/".
 */
export function resolvePath(cwd: string, input: string): string {
  if (input.length === 0) return normalize(cwd);
  const base = isAbsolute(input) ? "/" : cwd;
  const combinedSegments = isAbsolute(input)
    ? splitSegments(input)
    : [...splitSegments(base), ...splitSegments(input)];

  const stack: string[] = [];
  for (const seg of combinedSegments) {
    if (seg === ".") continue;
    if (seg === "..") {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(seg);
  }
  return "/" + stack.join("/");
}

/** Normalizes a path string without resolving against a base (assumes absolute-ish input). */
export function normalize(p: string): string {
  const abs = p.startsWith("/");
  const segments = splitSegments(p);
  const stack: string[] = [];
  for (const seg of segments) {
    if (seg === ".") continue;
    if (seg === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop();
      } else if (!abs) {
        stack.push("..");
      }
      continue;
    }
    stack.push(seg);
  }
  const result = stack.join("/");
  if (abs) return "/" + result;
  return result.length > 0 ? result : ".";
}

export function dirname(p: string): string {
  const normalized = normalize(p);
  if (normalized === "/") return "/";
  const segments = splitSegments(normalized);
  segments.pop();
  const isAbs = normalized.startsWith("/");
  if (segments.length === 0) return isAbs ? "/" : ".";
  return (isAbs ? "/" : "") + segments.join("/");
}

export function basename(p: string, suffix?: string): string {
  const normalized = normalize(p);
  if (normalized === "/") return "/";
  const segments = splitSegments(normalized);
  let base = segments[segments.length - 1] ?? "";
  if (suffix && base.endsWith(suffix) && base !== suffix) {
    base = base.slice(0, base.length - suffix.length);
  }
  return base;
}

/** Returns the parent path and the final segment name for a given absolute path. */
export function splitParentAndName(absPath: string): { parent: string; name: string } {
  const normalized = normalize(absPath);
  if (normalized === "/") return { parent: "/", name: "" };
  const segments = splitSegments(normalized);
  const name = segments.pop() as string;
  const parent = "/" + segments.join("/");
  return { parent: parent === "" ? "/" : parent, name };
}
