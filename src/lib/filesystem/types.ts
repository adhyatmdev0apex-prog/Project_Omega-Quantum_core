// filesystem/types.ts
// Core type definitions for the in-memory Quantum Core virtual filesystem.

export type FileType = "file" | "directory" | "symlink";

export interface PermissionTriad {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface Permissions {
  owner: PermissionTriad;
  group: PermissionTriad;
  other: PermissionTriad;
}

export interface FSNodeBase {
  name: string;
  type: FileType;
  owner: string;
  group: string;
  permissions: Permissions;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  /** Reference to the parent directory node. Root's parent is null. */
  parent: DirectoryNode | null;
}

export interface FileNode extends FSNodeBase {
  type: "file";
  content: string;
}

export interface DirectoryNode extends FSNodeBase {
  type: "directory";
  children: Map<string, FSNode>;
}

export interface SymlinkNode extends FSNodeBase {
  type: "symlink";
  /** Raw target string, may be relative or absolute, exactly as given. */
  target: string;
}

export type FSNode = FileNode | DirectoryNode | SymlinkNode;

/** A resolved stat-like description of a node, similar to `stat(1)` output. */
export interface StatInfo {
  path: string;
  name: string;
  type: FileType;
  size: number;
  owner: string;
  group: string;
  permissions: Permissions;
  permissionString: string;
  octal: string;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  links: number;
  inode: number;
  target?: string; // for symlinks
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface UserContext {
  username: string;
  uid: number;
  gid: number;
  groups: string[];
  isRoot: boolean;
}

export interface ShellEnv {
  [key: string]: string;
}

export type AccessMode = "read" | "write" | "execute";

/** Thrown for any filesystem-level error; commands translate this into stderr text. */
export class FSError extends Error {
  public code: string;
  constructor(message: string, code: string = "EGENERIC") {
    super(message);
    this.name = "FSError";
    this.code = code;
  }
}
