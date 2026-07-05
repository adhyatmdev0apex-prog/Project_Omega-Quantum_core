// filesystem/filesystem.ts
// The in-memory virtual filesystem engine. No browser File API is used;
// everything lives in a plain object graph held in memory for the lifetime
// of the page/session.

import {
  DirectoryNode,
  FileNode,
  FSError,
  FSNode,
  StatInfo,
  SymlinkNode,
  UserContext,
} from "./types";
import {
  assertAccess,
  defaultDirPermissions,
  defaultExecutablePermissions,
  defaultFilePermissions,
  parseMode,
  permissionsToOctal,
  permissionsToString,
} from "./permissions";
import { join, resolvePath, splitParentAndName, splitSegments } from "./path";

let inodeCounter = 1;
function nextInode(): number {
  return inodeCounter++;
}

const inodeRegistry = new WeakMap<FSNode, number>();
function inodeOf(node: FSNode): number {
  let id = inodeRegistry.get(node);
  if (id === undefined) {
    id = nextInode();
    inodeRegistry.set(node, id);
  }
  return id;
}

export interface CopyOptions {
  recursive?: boolean;
}

export interface RemoveOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface FindOptions {
  name?: string; // glob-ish pattern, supports "*" and "?"
  type?: "f" | "d" | "l";
  maxDepth?: number;
}

export class VirtualFileSystem {
  public root: DirectoryNode;
  public cwd: string = "/root";
  public currentUser: UserContext = {
    username: "operator",
    uid: 1000,
    gid: 1000,
    groups: ["operator", "sudo"],
    isRoot: false,
  };
  public hostname: string = "quantum-core";

  constructor() {
    this.root = this.makeDir("/", "root", "root");
    this.root.parent = null;
    this.seed();
  }

  // ---------------------------------------------------------------------
  // Node factory helpers
  // ---------------------------------------------------------------------

  private now(): Date {
    return new Date();
  }

  private makeDir(name: string, owner = "operator", group = "operator"): DirectoryNode {
    const t = this.now();
    return {
      name,
      type: "directory",
      owner,
      group,
      permissions: defaultDirPermissions(),
      createdAt: t,
      modifiedAt: t,
      accessedAt: t,
      parent: null,
      children: new Map(),
    };
  }

  private makeFile(
    name: string,
    content = "",
    owner = "operator",
    group = "operator",
    executable = false
  ): FileNode {
    const t = this.now();
    return {
      name,
      type: "file",
      owner,
      group,
      permissions: executable ? defaultExecutablePermissions() : defaultFilePermissions(),
      createdAt: t,
      modifiedAt: t,
      accessedAt: t,
      parent: null,
      content,
    };
  }

  private makeSymlink(name: string, target: string, owner = "operator", group = "operator"): SymlinkNode {
    const t = this.now();
    return {
      name,
      type: "symlink",
      owner,
      group,
      permissions: defaultExecutablePermissions(),
      createdAt: t,
      modifiedAt: t,
      accessedAt: t,
      parent: null,
      target,
    };
  }

  // ---------------------------------------------------------------------
  // Path resolution & lookup
  // ---------------------------------------------------------------------

  public resolve(path: string): string {
    return resolvePath(this.cwd, path);
  }

  /**
   * Resolves an absolute path down to a node, following symlinks that occur
   * as intermediate (non-final) path components. If `followSymlink` is true
   * (default) and the final component is itself a symlink, it is followed too.
   */
  public getNode(
    path: string,
    followSymlink: boolean = true,
    _visited: Set<string> = new Set()
  ): FSNode | null {
    const absPath = this.resolve(path);
    if (absPath === "/") return this.root;

    const segments = splitSegments(absPath);
    let current: FSNode = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isLast = i === segments.length - 1;

      if (current.type !== "directory") return null;
      const child = current.children.get(seg);
      if (!child) return null;

      if (child.type === "symlink" && (!isLast || followSymlink)) {
        const resolvedPath = this.resolveSymlinkPath(child, this.pathOf(current), _visited);
        if (resolvedPath === null) return null;
        const resolvedNode = this.getNode(resolvedPath, true, _visited);
        if (resolvedNode === null) return null;
        current = resolvedNode;
      } else {
        current = child;
      }
    }
    return current;
  }

  /** Follows a symlink chain (with loop detection) and returns the final absolute target path. */
  private resolveSymlinkPath(link: SymlinkNode, fromDir: string, visited: Set<string>): string | null {
    const key = `${fromDir}::${link.name}`;
    if (visited.has(key)) {
      throw new FSError(`too many levels of symbolic links: '${link.name}'`, "ELOOP");
    }
    visited.add(key);
    const targetAbs = isRelativeAwareResolve(fromDir, link.target);
    return targetAbs;
  }

  /** Computes the absolute path of a node by walking up its parent chain. */
  public pathOf(node: FSNode): string {
    const parts: string[] = [];
    let current: FSNode | null = node;
    while (current && current.parent !== null) {
      parts.unshift(current.name);
      current = current.parent;
    }
    return parts.length === 0 ? "/" : "/" + parts.join("/");
  }

  private requireNode(path: string, followSymlink: boolean = true): FSNode {
    const node = this.getNode(path, followSymlink);
    if (!node) {
      throw new FSError(`No such file or directory: '${path}'`, "ENOENT");
    }
    return node;
  }

  private requireDir(path: string): DirectoryNode {
    const node = this.requireNode(path);
    if (node.type !== "directory") {
      throw new FSError(`Not a directory: '${path}'`, "ENOTDIR");
    }
    return node;
  }

  // ---------------------------------------------------------------------
  // Directory operations
  // ---------------------------------------------------------------------

  public changeDir(path: string): void {
    const absPath = this.resolve(path);
    const node = this.requireNode(absPath);
    if (node.type !== "directory") {
      throw new FSError(`Not a directory: '${path}'`, "ENOTDIR");
    }
    assertAccess(node, this.currentUser, "execute", path);
    this.cwd = this.pathOf(node);
  }

  public getCwd(): string {
    return this.cwd;
  }

  public mkdir(path: string, opts: { parents?: boolean } = {}): DirectoryNode {
    const absPath = this.resolve(path);
    if (absPath === "/") throw new FSError("cannot create directory '/': File exists", "EEXIST");

    if (opts.parents) {
      const segments = splitSegments(absPath);
      let current: DirectoryNode = this.root;
      let builtPath = "";
      for (const seg of segments) {
        builtPath += "/" + seg;
        const existing = current.children.get(seg);
        if (existing) {
          if (existing.type !== "directory") {
            throw new FSError(`Not a directory: '${builtPath}'`, "ENOTDIR");
          }
          current = existing;
        } else {
          assertAccess(current, this.currentUser, "write", builtPath);
          const dir = this.makeDir(seg, this.currentUser.username, this.currentUser.username);
          dir.parent = current;
          current.children.set(seg, dir);
          current.modifiedAt = this.now();
          current = dir;
        }
      }
      return current;
    }

    const { parent, name } = splitParentAndName(absPath);
    const parentNode = this.requireDir(parent);
    if (parentNode.children.has(name)) {
      throw new FSError(`cannot create directory '${path}': File exists`, "EEXIST");
    }
    assertAccess(parentNode, this.currentUser, "write", parent);
    const dir = this.makeDir(name, this.currentUser.username, this.currentUser.username);
    dir.parent = parentNode;
    parentNode.children.set(name, dir);
    parentNode.modifiedAt = this.now();
    return dir;
  }

  public rmdir(path: string): void {
    const absPath = this.resolve(path);
    if (absPath === "/") throw new FSError("refusing to remove '/'", "EBUSY");
    const node = this.requireNode(absPath, false);
    if (node.type !== "directory") {
      throw new FSError(`Not a directory: '${path}'`, "ENOTDIR");
    }
    if (node.children.size > 0) {
      throw new FSError(`Directory not empty: '${path}'`, "ENOTEMPTY");
    }
    this.unlinkNode(absPath);
  }

  public listDir(path: string): FSNode[] {
    const node = this.requireNode(path);
    if (node.type !== "directory") {
      throw new FSError(`Not a directory: '${path}'`, "ENOTDIR");
    }
    assertAccess(node, this.currentUser, "read", path);
    node.accessedAt = this.now();
    return Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------------------------------------------------------------------
  // File operations
  // ---------------------------------------------------------------------

  public touch(path: string): FileNode {
    const absPath = this.resolve(path);
    const existing = this.getNode(absPath, false);
    if (existing) {
      existing.modifiedAt = this.now();
      existing.accessedAt = this.now();
      if (existing.type !== "file") {
        throw new FSError(`cannot touch '${path}': not a regular file`, "EINVAL");
      }
      return existing;
    }
    const { parent, name } = splitParentAndName(absPath);
    const parentNode = this.requireDir(parent);
    assertAccess(parentNode, this.currentUser, "write", parent);
    const file = this.makeFile(name, "", this.currentUser.username, this.currentUser.username);
    file.parent = parentNode;
    parentNode.children.set(name, file);
    parentNode.modifiedAt = this.now();
    return file;
  }

  public writeFile(path: string, content: string, append: boolean = false): FileNode {
    const absPath = this.resolve(path);
    let node = this.getNode(absPath, true);
    if (node && node.type !== "file") {
      throw new FSError(`'${path}' is not a regular file`, "EISDIR");
    }
    if (!node) {
      const { parent, name } = splitParentAndName(absPath);
      const parentNode = this.requireDir(parent);
      assertAccess(parentNode, this.currentUser, "write", parent);
      const file = this.makeFile(name, "", this.currentUser.username, this.currentUser.username);
      file.parent = parentNode;
      parentNode.children.set(name, file);
      parentNode.modifiedAt = this.now();
      node = file;
    } else {
      assertAccess(node, this.currentUser, "write", path);
    }
    const fileNode = node as FileNode;
    fileNode.content = append ? fileNode.content + content : content;
    fileNode.modifiedAt = this.now();
    return fileNode;
  }

  public readFile(path: string): string {
    const node = this.requireNode(path);
    if (node.type !== "file") {
      throw new FSError(`'${path}' is not a regular file`, "EISDIR");
    }
    assertAccess(node, this.currentUser, "read", path);
    node.accessedAt = this.now();
    return node.content;
  }

  // ---------------------------------------------------------------------
  // Remove / move / copy
  // ---------------------------------------------------------------------

  private unlinkNode(absPath: string): FSNode {
    const { parent, name } = splitParentAndName(absPath);
    const parentNode = this.requireDir(parent);
    const node = parentNode.children.get(name);
    if (!node) throw new FSError(`No such file or directory: '${absPath}'`, "ENOENT");
    assertAccess(parentNode, this.currentUser, "write", parent);
    parentNode.children.delete(name);
    parentNode.modifiedAt = this.now();
    return node;
  }

  public remove(path: string, opts: RemoveOptions = {}): void {
    const absPath = this.resolve(path);
    const node = this.getNode(absPath, false);
    if (!node) {
      if (opts.force) return;
      throw new FSError(`No such file or directory: '${path}'`, "ENOENT");
    }
    if (node.type === "directory" && node.children.size > 0 && !opts.recursive) {
      throw new FSError(`cannot remove '${path}': Is a directory`, "EISDIR");
    }
    this.unlinkNode(absPath);
  }

  public move(src: string, dest: string): void {
    const absSrc = this.resolve(src);
    const srcNode = this.requireNode(absSrc, false);
    const { parent: srcParentPath } = splitParentAndName(absSrc);
    const srcParent = this.requireDir(srcParentPath);
    assertAccess(srcParent, this.currentUser, "write", srcParentPath);

    let absDest = this.resolve(dest);
    const destExisting = this.getNode(absDest, false);
    if (destExisting && destExisting.type === "directory") {
      absDest = join(absDest, srcNode.name);
    }

    const { parent: destParentPath, name: destName } = splitParentAndName(absDest);
    const destParent = this.requireDir(destParentPath);
    assertAccess(destParent, this.currentUser, "write", destParentPath);

    if (destParent.children.has(destName)) {
      const conflict = destParent.children.get(destName)!;
      if (conflict.type === "directory") {
        throw new FSError(`cannot move '${src}' to '${dest}': Directory not empty`, "ENOTEMPTY");
      }
    }

    srcParent.children.delete(srcNode.name);
    srcParent.modifiedAt = this.now();

    srcNode.name = destName;
    srcNode.parent = destParent;
    srcNode.modifiedAt = this.now();
    destParent.children.set(destName, srcNode);
    destParent.modifiedAt = this.now();
  }

  private cloneNode(node: FSNode, newOwner: string, newGroup: string): FSNode {
    if (node.type === "file") {
      const f = this.makeFile(node.name, node.content, newOwner, newGroup);
      f.permissions = { ...node.permissions };
      return f;
    }
    if (node.type === "symlink") {
      const s = this.makeSymlink(node.name, node.target, newOwner, newGroup);
      s.permissions = { ...node.permissions };
      return s;
    }
    const d = this.makeDir(node.name, newOwner, newGroup);
    d.permissions = { ...node.permissions };
    for (const [childName, child] of node.children) {
      const clonedChild = this.cloneNode(child, newOwner, newGroup);
      clonedChild.parent = d;
      d.children.set(childName, clonedChild);
    }
    return d;
  }

  public copy(src: string, dest: string, opts: CopyOptions = {}): void {
    const absSrc = this.resolve(src);
    const srcNode = this.requireNode(absSrc, false);

    if (srcNode.type === "directory" && !opts.recursive) {
      throw new FSError(`omitting directory '${src}' (use -r)`, "EISDIR");
    }

    assertAccess(srcNode, this.currentUser, "read", src);

    let absDest = this.resolve(dest);
    const destExisting = this.getNode(absDest, false);
    if (destExisting && destExisting.type === "directory") {
      absDest = join(absDest, srcNode.name);
    }

    const { parent: destParentPath, name: destName } = splitParentAndName(absDest);
    const destParent = this.requireDir(destParentPath);
    assertAccess(destParent, this.currentUser, "write", destParentPath);

    const cloned = this.cloneNode(srcNode, this.currentUser.username, this.currentUser.username);
    cloned.name = destName;
    cloned.parent = destParent;
    destParent.children.set(destName, cloned);
    destParent.modifiedAt = this.now();
  }

  // ---------------------------------------------------------------------
  // Symlinks
  // ---------------------------------------------------------------------

  public symlink(target: string, linkPath: string): SymlinkNode {
    const absLink = this.resolve(linkPath);
    const { parent, name } = splitParentAndName(absLink);
    const parentNode = this.requireDir(parent);
    if (parentNode.children.has(name)) {
      throw new FSError(`cannot create symbolic link '${linkPath}': File exists`, "EEXIST");
    }
    assertAccess(parentNode, this.currentUser, "write", parent);
    const link = this.makeSymlink(name, target, this.currentUser.username, this.currentUser.username);
    link.parent = parentNode;
    parentNode.children.set(name, link);
    parentNode.modifiedAt = this.now();
    return link;
  }

  public readlink(path: string): string {
    const node = this.requireNode(path, false);
    if (node.type !== "symlink") {
      throw new FSError(`readlink: '${path}': Invalid argument`, "EINVAL");
    }
    return node.target;
  }

  /** Fully resolves a path (following all symlinks) to a canonical absolute path, like realpath(1). */
  public realpath(path: string): string {
    const absPath = this.resolve(path);
    const node = this.requireNode(absPath, true);
    return this.pathOf(node);
  }

  // ---------------------------------------------------------------------
  // Permissions / ownership
  // ---------------------------------------------------------------------

  public chmod(path: string, mode: string): void {
    const node = this.requireNode(path, false);
    if (node.owner !== this.currentUser.username && !this.currentUser.isRoot) {
      throw new FSError(`changing permissions of '${path}': Operation not permitted`, "EPERM");
    }
    node.permissions = parseMode(mode, node.permissions);
    node.modifiedAt = this.now();
  }

  public chown(path: string, owner: string, group?: string): void {
    if (!this.currentUser.isRoot) {
      throw new FSError(`changing ownership of '${path}': Operation not permitted`, "EPERM");
    }
    const node = this.requireNode(path, false);
    node.owner = owner;
    if (group) node.group = group;
    node.modifiedAt = this.now();
  }

  // ---------------------------------------------------------------------
  // Stat / metadata
  // ---------------------------------------------------------------------

  public stat(path: string, followSymlink: boolean = true): StatInfo {
    const node = this.requireNode(path, followSymlink);
    const absPath = this.pathOf(node);
    const size = this.sizeOf(node);
    return {
      path: absPath,
      name: node.name === "" ? "/" : node.name,
      type: node.type,
      size,
      owner: node.owner,
      group: node.group,
      permissions: node.permissions,
      permissionString: permissionsToString(node),
      octal: permissionsToOctal(node.permissions),
      createdAt: node.createdAt,
      modifiedAt: node.modifiedAt,
      accessedAt: node.accessedAt,
      links: node.type === "directory" ? 2 + this.countSubdirs(node) : 1,
      inode: inodeOf(node),
      target: node.type === "symlink" ? node.target : undefined,
    };
  }

  private countSubdirs(dir: DirectoryNode): number {
    let count = 0;
    for (const child of dir.children.values()) {
      if (child.type === "directory") count++;
    }
    return count;
  }

  public sizeOf(node: FSNode): number {
    if (node.type === "file") return node.content.length;
    if (node.type === "symlink") return node.target.length;
    let total = 4096; // simulated directory entry size, like real filesystems
    for (const child of node.children.values()) {
      total += this.sizeOf(child);
    }
    return total;
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  public find(startPath: string, opts: FindOptions = {}): string[] {
    const startNode = this.requireDir(startPath);
    const startAbs = this.pathOf(startNode);
    const results: string[] = [];
    const pattern = opts.name ? globToRegExp(opts.name) : null;

    const walk = (node: FSNode, currentPath: string, depth: number) => {
      const nameMatches = !pattern || pattern.test(node.name);
      const typeMatches =
        !opts.type ||
        (opts.type === "f" && node.type === "file") ||
        (opts.type === "d" && node.type === "directory") ||
        (opts.type === "l" && node.type === "symlink");

      if (nameMatches && typeMatches) {
        results.push(currentPath);
      }

      if (node.type === "directory" && (opts.maxDepth === undefined || depth < opts.maxDepth)) {
        const sortedChildren = Array.from(node.children.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        for (const child of sortedChildren) {
          walk(child, join(currentPath, child.name), depth + 1);
        }
      }
    };

    walk(startNode, startAbs, 0);
    return results;
  }

  public grep(pattern: string, path: string, opts: { ignoreCase?: boolean; recursive?: boolean } = {}): {
    path: string;
    lineNumber: number;
    line: string;
  }[] {
    const node = this.requireNode(path, true);
    const flags = opts.ignoreCase ? "i" : "";
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      throw new FSError(`grep: invalid pattern '${pattern}'`, "EINVAL");
    }

    const matches: { path: string; lineNumber: number; line: string }[] = [];

    const searchFile = (file: FileNode, filePath: string) => {
      const lines = file.content.split("\n");
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          matches.push({ path: filePath, lineNumber: idx + 1, line });
        }
      });
    };

    const walk = (n: FSNode, p: string) => {
      if (n.type === "file") {
        searchFile(n, p);
      } else if (n.type === "directory" && opts.recursive) {
        for (const child of n.children.values()) {
          walk(child, join(p, child.name));
        }
      }
    };

    walk(node, this.pathOf(node));
    return matches;
  }

  // ---------------------------------------------------------------------
  // Disk usage
  // ---------------------------------------------------------------------

  public du(path: string): { path: string; size: number }[] {
    const node = this.requireNode(path);
    const results: { path: string; size: number }[] = [];

    const walk = (n: FSNode, p: string): number => {
      if (n.type !== "directory") {
        return this.sizeOf(n);
      }
      let total = 4096;
      for (const child of n.children.values()) {
        total += walk(child, join(p, child.name));
      }
      results.push({ path: p, size: total });
      return total;
    };

    walk(node, this.pathOf(node));
    return results.sort((a, b) => a.path.localeCompare(b.path));
  }

  public df(): { filesystem: string; sizeKb: number; usedKb: number; availKb: number; usePercent: number; mountedOn: string }[] {
    const totalKb = 20_971_520; // simulated 20GB root volume
    const usedKb = Math.min(totalKb, Math.round(this.sizeOf(this.root) / 1024) + 2_048_000);
    const availKb = totalKb - usedKb;
    return [
      {
        filesystem: "/dev/sda1",
        sizeKb: totalKb,
        usedKb,
        availKb,
        usePercent: Math.round((usedKb / totalKb) * 100),
        mountedOn: "/",
      },
      {
        filesystem: "tmpfs",
        sizeKb: 2_048_000,
        usedKb: 12_800,
        availKb: 2_035_200,
        usePercent: 1,
        mountedOn: "/tmp",
      },
      {
        filesystem: "tmpfs",
        sizeKb: 524_288,
        usedKb: 0,
        availKb: 524_288,
        usePercent: 0,
        mountedOn: "/dev/shm",
      },
    ];
  }

  // ---------------------------------------------------------------------
  // Seeding: builds out the realistic Ubuntu-like layout on construction
  // ---------------------------------------------------------------------

  private seed(): void {
    const topDirs = [
      "bin",
      "boot",
      "dev",
      "etc",
      "home",
      "lib",
      "media",
      "mnt",
      "opt",
      "proc",
      "root",
      "run",
      "sbin",
      "srv",
      "sys",
      "tmp",
      "usr",
      "var",
    ];
    for (const d of topDirs) {
      const dir = this.makeDir(d, "root", "root");
      dir.parent = this.root;
      this.root.children.set(d, dir);
    }

    // --- /etc ---------------------------------------------------------
    const etc = this.root.children.get("etc") as DirectoryNode;
    this.addFile(etc, "hostname", `${this.hostname}\n`, "root", "root");
    this.addFile(
      etc,
      "os-release",
      [
        'PRETTY_NAME="Ubuntu 22.04.4 LTS"',
        'NAME="Ubuntu"',
        'VERSION_ID="22.04"',
        'VERSION="22.04.4 LTS (Jammy Jellyfish)"',
        'VERSION_CODENAME=jammy',
        'ID=ubuntu',
        'ID_LIKE=debian',
        'HOME_URL="https://www.ubuntu.com/"',
        'SUPPORT_URL="https://help.ubuntu.com/"',
        "",
      ].join("\n"),
      "root",
      "root"
    );
    this.addFile(
      etc,
      "passwd",
      [
        "root:x:0:0:root:/root:/bin/bash",
        "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
        "bin:x:2:2:bin:/bin:/usr/sbin/nologin",
        "sys:x:3:3:sys:/dev:/usr/sbin/nologin",
        "nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin",
        "operator:x:1000:1000:Quantum Core Operator,,,:/home/operator:/bin/bash",
        "",
      ].join("\n"),
      "root",
      "root"
    );
    this.addFile(
      etc,
      "group",
      [
        "root:x:0:",
        "sudo:x:27:operator",
        "operator:x:1000:",
        "",
      ].join("\n"),
      "root",
      "root"
    );
    this.addFile(etc, "hosts", ["127.0.0.1\tlocalhost", `127.0.1.1\t${this.hostname}`, ""].join("\n"), "root", "root");
    this.addFile(
      etc,
      "resolv.conf",
      ["nameserver 1.1.1.1", "nameserver 1.0.0.1", ""].join("\n"),
      "root",
      "root"
    );
    this.addFile(
      etc,
      "issue",
      "Ubuntu 22.04.4 LTS \\n \\l\n\n",
      "root",
      "root"
    );

    // --- /var -----------------------------------------------------------
    const varDir = this.root.children.get("var") as DirectoryNode;
    const varLog = this.mkChild(varDir, "log", "root", "root");
    this.addFile(varLog, "auth.log", "-- no entries yet --\n", "root", "root");
    this.addFile(varLog, "syslog", "-- no entries yet --\n", "root", "root");
    this.mkChild(varDir, "www", "root", "root");
    this.mkChild(varDir, "tmp", "root", "root");

    // --- /usr -------------------------------------------------------------
    const usr = this.root.children.get("usr") as DirectoryNode;
    this.mkChild(usr, "bin", "root", "root");
    this.mkChild(usr, "lib", "root", "root");
    this.mkChild(usr, "local", "root", "root");
    this.mkChild(usr, "share", "root", "root");

    // --- /root ------------------------------------------------------------
    const rootHome = this.root.children.get("root") as DirectoryNode;
    this.addFile(
      rootHome,
      ".bashrc",
      "# ~/.bashrc: executed by bash(1) for non-login shells.\nexport PS1='\\u@\\h:\\w# '\n",
      "root",
      "root"
    );

    // --- /home/operator -----------------------------------------------
    const home = this.root.children.get("home") as DirectoryNode;
    const operator = this.mkChild(home, "operator", "operator", "operator");

    this.addFile(
      operator,
      ".bashrc",
      [
        "# ~/.bashrc: executed by bash(1) for non-login shells.",
        "export PS1='\\u@\\h:\\w$ '",
        "alias ll='ls -la'",
        "alias la='ls -A'",
        "export PATH=$PATH:/usr/local/bin",
        "",
      ].join("\n"),
      "operator",
      "operator"
    );
    this.addFile(
      operator,
      ".profile",
      [
        "# ~/.profile: executed by the command interpreter for login shells.",
        "if [ -n \"$BASH_VERSION\" ]; then",
        "    if [ -f \"$HOME/.bashrc\" ]; then",
        "        . \"$HOME/.bashrc\"",
        "    fi",
        "fi",
        "",
      ].join("\n"),
      "operator",
      "operator"
    );
    this.addFile(
      operator,
      ".hidden_notes",
      "TODO: rotate API keys before the next CTF round.\n",
      "operator",
      "operator"
    );

    const documents = this.mkChild(operator, "Documents", "operator", "operator");
    this.addFile(
      documents,
      "README.md",
      [
        "# Quantum Core Training Notes",
        "",
        "This directory holds working notes for the Quantum Core cybersecurity",
        "training modules. Use `cat`, `grep`, and `find` to explore.",
        "",
      ].join("\n"),
      "operator",
      "operator"
    );
    this.addFile(
      documents,
      "network_notes.txt",
      "Subnet: 10.10.10.0/24\nGateway: 10.10.10.1\nDNS: 1.1.1.1\n",
      "operator",
      "operator"
    );

    const desktop = this.mkChild(operator, "Desktop", "operator", "operator");
    this.addFile(desktop, "welcome.txt", "Welcome to Quantum Core.\n", "operator", "operator");

    const downloads = this.mkChild(operator, "Downloads", "operator", "operator");
    this.addFile(
      downloads,
      "recon_scan_results.txt",
      "PORT     STATE  SERVICE\n22/tcp   open   ssh\n80/tcp   open   http\n443/tcp  open   https\n",
      "operator",
      "operator"
    );

    const projects = this.mkChild(operator, "Projects", "operator", "operator");
    const scanner = this.mkChild(projects, "port-scanner", "operator", "operator");
    this.addFile(
      scanner,
      "README.md",
      "# port-scanner\n\nA lightweight scanning utility used in Quantum Core training labs.\n",
      "operator",
      "operator"
    );
    this.addFile(
      scanner,
      "scan.py",
      [
        "#!/usr/bin/env python3",
        "import socket",
        "",
        "def scan(host, port):",
        "    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)",
        "    sock.settimeout(0.5)",
        "    result = sock.connect_ex((host, port))",
        "    sock.close()",
        "    return result == 0",
        "",
      ].join("\n"),
      "operator",
      "operator",
      true
    );

    // A dangling-safe symlink example for training on `ln`/`readlink`.
    const linkToDocs = this.makeSymlink("docs", "/home/operator/Documents", "operator", "operator");
    linkToDocs.parent = operator;
    operator.children.set("docs", linkToDocs);

    this.cwd = "/home/operator";
  }

  private mkChild(parent: DirectoryNode, name: string, owner: string, group: string): DirectoryNode {
    const dir = this.makeDir(name, owner, group);
    dir.parent = parent;
    parent.children.set(name, dir);
    return dir;
  }

  private addFile(
    parent: DirectoryNode,
    name: string,
    content: string,
    owner: string,
    group: string,
    executable = false
  ): FileNode {
    const file = this.makeFile(name, content, owner, group, executable);
    file.parent = parent;
    parent.children.set(name, file);
    return file;
  }
}

// ---------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------

/** Resolves a symlink target relative to the directory containing the link. */
function isRelativeAwareResolve(fromDir: string, target: string): string {
  if (target.startsWith("/")) return normalizeAbs(target);
  return resolvePath(fromDir, target);
}

function normalizeAbs(p: string): string {
  return resolvePath("/", p);
}

/** Converts a simple glob pattern (supporting * and ?) into a RegExp. */
export function globToRegExp(glob: string): RegExp {
  let out = "^";
  for (const ch of glob) {
    if (ch === "*") out += ".*";
    else if (ch === "?") out += ".";
    else out += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  out += "$";
  return new RegExp(out);
}
