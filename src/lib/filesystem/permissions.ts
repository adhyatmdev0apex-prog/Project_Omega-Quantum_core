// filesystem/permissions.ts
// Unix-style permission parsing, formatting, and access control checks.

import { AccessMode, FSNode, Permissions, PermissionTriad, UserContext } from "./types";

export function defaultFilePermissions(): Permissions {
  return {
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    other: { read: true, write: false, execute: false },
  };
}

export function defaultDirPermissions(): Permissions {
  return {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
  };
}

export function defaultExecutablePermissions(): Permissions {
  return {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
  };
}

function triadFromDigit(digit: number): PermissionTriad {
  return {
    read: (digit & 4) !== 0,
    write: (digit & 2) !== 0,
    execute: (digit & 1) !== 0,
  };
}

function digitFromTriad(triad: PermissionTriad): number {
  return (triad.read ? 4 : 0) + (triad.write ? 2 : 0) + (triad.execute ? 1 : 0);
}

/** Parses a 3 or 4 digit octal mode string, e.g. "755", "0644". */
export function parseOctalMode(mode: string): Permissions {
  const trimmed = mode.trim();
  if (!/^[0-7]{3,4}$/.test(trimmed)) {
    throw new Error(`invalid mode: '${mode}'`);
  }
  const digits = trimmed.length === 4 ? trimmed.slice(1) : trimmed;
  const [o, g, ot] = digits.split("").map((d) => parseInt(d, 10));
  return {
    owner: triadFromDigit(o),
    group: triadFromDigit(g),
    other: triadFromDigit(ot),
  };
}

/** Parses symbolic mode strings like "u+x", "go-w", "a=r", "u=rwx,g=rx,o=r". */
export function parseSymbolicMode(mode: string, current: Permissions): Permissions {
  const result: Permissions = {
    owner: { ...current.owner },
    group: { ...current.group },
    other: { ...current.other },
  };

  const clauses = mode.split(",");
  const classMap: Record<string, (keyof Permissions)[]> = {
    u: ["owner"],
    g: ["group"],
    o: ["other"],
    a: ["owner", "group", "other"],
  };

  for (const clause of clauses) {
    const match = clause.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
    if (!match) {
      throw new Error(`invalid mode clause: '${clause}'`);
    }
    const [, classesRaw, op, permsRaw] = match;
    const classes = classesRaw.length > 0 ? classesRaw.split("") : ["a"];
    const targets = new Set<keyof Permissions>();
    for (const c of classes) {
      const mapped = classMap[c];
      if (!mapped) throw new Error(`invalid class: '${c}'`);
      mapped.forEach((m) => targets.add(m));
    }

    const wantsRead = permsRaw.includes("r");
    const wantsWrite = permsRaw.includes("w");
    const wantsExec = permsRaw.includes("x");

    for (const target of targets) {
      const triad = result[target];
      if (op === "+") {
        if (wantsRead) triad.read = true;
        if (wantsWrite) triad.write = true;
        if (wantsExec) triad.execute = true;
      } else if (op === "-") {
        if (wantsRead) triad.read = false;
        if (wantsWrite) triad.write = false;
        if (wantsExec) triad.execute = false;
      } else if (op === "=") {
        triad.read = wantsRead;
        triad.write = wantsWrite;
        triad.execute = wantsExec;
      }
    }
  }

  return result;
}

export function parseMode(mode: string, current: Permissions): Permissions {
  if (/^[0-7]{3,4}$/.test(mode.trim())) {
    return parseOctalMode(mode);
  }
  return parseSymbolicMode(mode, current);
}

export function permissionsToOctal(perms: Permissions): string {
  return [
    digitFromTriad(perms.owner),
    digitFromTriad(perms.group),
    digitFromTriad(perms.other),
  ].join("");
}

export function permissionsToString(node: FSNode): string {
  const typeChar = node.type === "directory" ? "d" : node.type === "symlink" ? "l" : "-";
  const fmt = (t: PermissionTriad) =>
    `${t.read ? "r" : "-"}${t.write ? "w" : "-"}${t.execute ? "x" : "-"}`;
  return `${typeChar}${fmt(node.permissions.owner)}${fmt(node.permissions.group)}${fmt(
    node.permissions.other
  )}`;
}

/** Determines whether a user context can perform an action on a node. */
export function canAccess(node: FSNode, user: UserContext, mode: AccessMode): boolean {
  if (user.isRoot) return true;

  let triad: PermissionTriad;
  if (node.owner === user.username) {
    triad = node.permissions.owner;
  } else if (user.groups.includes(node.group)) {
    triad = node.permissions.group;
  } else {
    triad = node.permissions.other;
  }

  if (mode === "read") return triad.read;
  if (mode === "write") return triad.write;
  return triad.execute;
}

export function assertAccess(node: FSNode, user: UserContext, mode: AccessMode, path: string): void {
  if (!canAccess(node, user, mode)) {
    const verb = mode === "read" ? "read" : mode === "write" ? "write to" : "execute";
    const err = new Error(`Permission denied: cannot ${verb} '${path}'`);
    (err as any).code = "EACCES";
    throw err;
  }
}
