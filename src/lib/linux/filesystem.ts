import {
  DirectoryNode,
  FileNode,
  FileSystemNode,
} from "./types.ts";

// ==========================================================
// Virtual Linux Filesystem
// ==========================================================

export class VirtualFileSystem {
  root: DirectoryNode;

  constructor() {
    this.root = this.createDefaultFilesystem();
  }

  // ---------- helpers ----------

  private dir(name: string, parent: DirectoryNode | null): DirectoryNode {
    return {
      id: crypto.randomUUID(),
      name,
      type: "directory",
      parent,
      created: Date.now(),
      modified: Date.now(),
      children: new Map(),
    };
  }

  private file(
    name: string,
    content: string,
    parent: DirectoryNode
  ): FileNode {
    return {
      id: crypto.randomUUID(),
      name,
      type: "file",
      parent,
      created: Date.now(),
      modified: Date.now(),
      content,
    };
  }

  private add(
    parent: DirectoryNode,
    node: FileSystemNode
  ) {
    parent.children.set(node.name, node);
  }

  // ---------- default linux tree ----------

  private createDefaultFilesystem(): DirectoryNode {
    const root = this.dir("/", null);

    const home = this.dir("home", root);
    const operator = this.dir("operator", home);

    const desktop = this.dir("Desktop", operator);
    const documents = this.dir("Documents", operator);
    const downloads = this.dir("Downloads", operator);
    const projects = this.dir("Projects", operator);

    const etc = this.dir("etc", root);
    const bin = this.dir("bin", root);
    const usr = this.dir("usr", root);
    const varDir = this.dir("var", root);
    const tmp = this.dir("tmp", root);
    const proc = this.dir("proc", root);
    const rootHome = this.dir("root", root);

    // home
    this.add(root, home);

    this.add(home, operator);

    this.add(operator, desktop);
    this.add(operator, documents);
    this.add(operator, downloads);
    this.add(operator, projects);

    // etc
    this.add(root, etc);

    this.add(
      etc,
      this.file(
        "hostname",
        "quantum-core",
        etc
      )
    );

    this.add(
      etc,
      this.file(
        "os-release",
        "Quantum Core Linux v1",
        etc
      )
    );

    this.add(
      etc,
      this.file(
        "passwd",
        "root:x:0:0:root:/root:/bin/bash\noperator:x:1000:1000:Operator:/home/operator:/bin/bash",
        etc
      )
    );

    // root folders
    this.add(root, bin);
    this.add(root, usr);
    this.add(root, varDir);
    this.add(root, tmp);
    this.add(root, proc);
    this.add(root, rootHome);

    // starter project
    this.add(
      projects,
      this.file(
        "README.md",
        "# Welcome to Quantum Core\n\nStart hacking 😎",
        projects
      )
    );

    return root;
  }

  // --------------------------------------------------
// Resolve a path into a node
// --------------------------------------------------

resolve(path: string) {
  if (path === "/") return this.root;

  const parts = path.split("/").filter(Boolean);

  let current = this.root;

  for (const part of parts) {
    const next = current.children.get(part);

    if (!next) return null;

    if (next.type === "file") {
      if (part !== parts[parts.length - 1]) return null;
      return next;
    }

    current = next;
  }

  return current;
}

// --------------------------------------------------
// List directory contents
// --------------------------------------------------

list(path: string): string[] {
  const node = this.resolve(path);

  if (!node) return [];

  if (node.type !== "directory") return [];

  return [...node.children.keys()].sort();
}

exists(path: string): boolean {
    return this.resolve(path) !== null;
}

private split(path: string) {
    path = path.replace(/\/+/g, "/");

    if (path.length > 1 && path.endsWith("/"))
        path = path.slice(0, -1);

    const lastSlash = path.lastIndexOf("/");

    const parentPath =
        lastSlash <= 0
            ? "/"
            : path.substring(0, lastSlash);

    const name = path.substring(lastSlash + 1);

    return {
        parentPath,
        name,
    };
}

mkdir(path: string): boolean {
    const { parentPath, name } = this.split(path);

    const parent = this.resolve(parentPath);

    if (!parent) return false;

    if (parent.type !== "directory") return false;

    if (parent.children.has(name)) return false;

    const dir = this.dir(name, parent);

    parent.children.set(name, dir);

    return true;
}

touch(path: string): boolean {
    const { parentPath, name } = this.split(path);

    const parent = this.resolve(parentPath);

    if (!parent) return false;

    if (parent.type !== "directory") return false;

    if (parent.children.has(name)) return false;

    parent.children.set(
        name,
        this.file(name, "", parent)
    );

    return true;
}

cat(path: string): string | null {
    const node = this.resolve(path);

    if (!node)
        return null;

    if (node.type !== "file")
        return null;

    return node.content;
}


}