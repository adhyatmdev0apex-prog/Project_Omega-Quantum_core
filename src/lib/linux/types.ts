// ==========================================================
// Quantum Core Linux
// types.ts
//
// Core filesystem types used by the virtual Linux backend.
// ==========================================================

export type NodeType = "file" | "directory";

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;

  parent: DirectoryNode | null;

  created: number;
  modified: number;
}

export interface FileNode extends BaseNode {
  type: "file";

  content: string;
}

export interface DirectoryNode extends BaseNode {
  type: "directory";

  children: Map<string, FileSystemNode>;
}

export type FileSystemNode = FileNode | DirectoryNode;

export interface ShellState {
  cwd: DirectoryNode;

  user: string;

  hostname: string;
}