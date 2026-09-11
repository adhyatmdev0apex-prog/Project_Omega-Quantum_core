import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// ===========================================================
// Beta Projects Manifest Plugin
//
// Scans public/beta-projects/ at build time and in dev mode.
// Writes public/beta-projects/manifest.json so the React app
// can fetch the list at runtime without any hardcoding.
//
// To add a new beta project:
//   1. Create public/beta-projects/<name>/index.html
//   2. Optionally add public/beta-projects/<name>/meta.json
//   3. Done — no React code changes needed.
//
// meta.json fields (all optional):
//   { "title", "description", "version", "status", "progress", "icon", "tags" }
// ===========================================================

function toTitleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateManifest(betaDir: string): void {
  const manifestPath = path.join(betaDir, 'manifest.json');

  if (!fs.existsSync(betaDir)) {
    fs.mkdirSync(betaDir, { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify([], null, 2));
    return;
  }

  const entries = fs.readdirSync(betaDir, { withFileTypes: true });
  const projects: object[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(betaDir, entry.name, 'index.html');
    if (!fs.existsSync(indexPath)) continue;

    // Load optional per-project metadata
    const metaPath = path.join(betaDir, entry.name, 'meta.json');
    let meta: Record<string, unknown> = {};
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch { /* ignore malformed meta.json */ }
    }

    projects.push({
      slug: entry.name,
      title: (meta.title as string) ?? toTitleCase(entry.name),
      description: (meta.description as string) ?? '',
      version: (meta.version as string) ?? 'v0.1 Alpha',
      status: (meta.status as string) ?? 'experimental',
      progress: (meta.progress as number) ?? 0,
      icon: (meta.icon as string) ?? 'FlaskConical',
      tags: (meta.tags as string[]) ?? [],
    });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(projects, null, 2));
  console.log(`\x1b[36m[beta-projects]\x1b[0m manifest updated — ${projects.length} project(s)`);
}

function betaProjectsPlugin(): Plugin {
  let betaDir: string;

  return {
    name: 'beta-projects-manifest',

    configResolved(config) {
      betaDir = path.join(config.root, 'public', 'beta-projects');
    },

    buildStart() {
      generateManifest(betaDir);
    },

    configureServer(server) {
      generateManifest(betaDir);

      // Watch for added / removed project folders in dev mode
      server.watcher.add(betaDir);
      server.watcher.on('all', (event, filePath) => {
        if (
          filePath.startsWith(betaDir) &&
          !filePath.endsWith('manifest.json')
        ) {
          generateManifest(betaDir);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

// ===========================================================
// ESP-32 Library Manifest Plugin
//
// Projects are discovered from public/library/ESP-32/projects/*.html.
// Resources are discovered recursively from public/library/ESP-32/resources/.
// ===========================================================

function resourceKind(fileName: string): 'image' | 'video' | 'audio' | 'pdf' | 'archive' | 'code' | 'file' {
  const ext = path.extname(fileName).toLowerCase();
  if (['.png','.jpg','.jpeg','.gif','.webp','.svg','.bmp','.avif'].includes(ext)) return 'image';
  if (['.mp4','.webm','.mov','.m4v','.ogv'].includes(ext)) return 'video';
  if (['.mp3','.wav','.ogg','.m4a','.aac','.flac'].includes(ext)) return 'audio';
  if (ext === '.pdf') return 'pdf';
  if (['.zip','.7z','.rar','.tar','.gz','.tgz'].includes(ext)) return 'archive';
  if (['.c','.cc','.cpp','.cxx','.h','.hpp','.ino','.py','.js','.ts','.tsx','.jsx','.html','.css','.json','.xml','.yaml','.yml','.ini','.txt','.md','.sh','.bat'].includes(ext)) return 'code';
  return 'file';
}

function encodeUrlPath(relativePath: string): string {
  return relativePath.split(/[\\/]+/).filter(Boolean).map((part) => encodeURIComponent(part)).join('/');
}

function walkFiles(dir: string, baseDir = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const output: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(fullPath, baseDir));
    else if (entry.isFile() && entry.name !== 'manifest.json') output.push(path.relative(baseDir, fullPath));
  }
  return output;
}

function generateEsp32Manifests(esp32Dir: string): void {
  const projectsDir = path.join(esp32Dir, 'projects');
  const resourcesDir = path.join(esp32Dir, 'resources');
  fs.mkdirSync(projectsDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });

  const projectFiles = fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => {
      const title = entry.name.slice(0, -'.html'.length);
      return { slug: title, title, file: `/library/ESP-32/projects/${encodeURIComponent(entry.name)}` };
    })
    .sort((a,b) => a.title.localeCompare(b.title, undefined, { numeric:true, sensitivity:'base' }));

  const resourceFiles = walkFiles(resourcesDir)
    .sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:'base' }))
    .map((relativePath) => {
      const fullPath = path.join(resourcesDir, relativePath);
      const parsed = path.parse(relativePath);
      return { slug: relativePath, title: parsed.name, file: `/library/ESP-32/resources/${encodeUrlPath(relativePath)}`, type: resourceKind(parsed.name), extension: parsed.ext.replace(/^\./,'').toUpperCase(), size: fs.statSync(fullPath).size };
    });

  fs.writeFileSync(path.join(projectsDir,'manifest.json'), JSON.stringify(projectFiles,null,2));
  fs.writeFileSync(path.join(resourcesDir,'manifest.json'), JSON.stringify(resourceFiles,null,2));
  console.log(`\x1b[36m[esp32-library]\x1b[0m manifests updated — ${projectFiles.length} project(s), ${resourceFiles.length} resource(s)`);
}

function esp32LibraryPlugin(): Plugin {
  let esp32Dir: string;
  return {
    name: 'esp32-library-manifest',
    configResolved(config) { esp32Dir = path.join(config.root,'public','library','ESP-32'); },
    buildStart() { generateEsp32Manifests(esp32Dir); },
    configureServer(server) {
      generateEsp32Manifests(esp32Dir);
      server.watcher.add(esp32Dir);
      server.watcher.on('all', (_event,filePath) => {
        if (filePath.startsWith(esp32Dir) && !filePath.endsWith(`${path.sep}manifest.json`) && !filePath.endsWith('/manifest.json')) {
          generateEsp32Manifests(esp32Dir);
          server.ws.send({ type:'full-reload' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), betaProjectsPlugin(), esp32LibraryPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
