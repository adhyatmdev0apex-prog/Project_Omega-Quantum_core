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
// Scans two dedicated ESP-32 directories:
//   public/library/ESP-32/projects/
//   public/library/ESP-32/resources/
//
// Projects are discovered from .html guide files.
// Resources are discovered from every file placed in resources/.
// The React app reads these scoped manifests at runtime.
// ===========================================================

function getResourceType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mov', '.m4v', '.avi'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) return 'audio';
  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  if (['.c', '.h', '.cpp', '.hpp', '.ino', '.py', '.js', '.ts', '.tsx', '.html', '.css', '.json', '.ini', '.txt', '.md'].includes(ext)) return 'code';
  return 'file';
}

function toDisplayTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
}

function generateEsp32Manifests(esp32Dir: string): void {
  const projectsDir = path.join(esp32Dir, 'projects');
  const resourcesDir = path.join(esp32Dir, 'resources');
  const projectsManifestPath = path.join(projectsDir, 'manifest.json');
  const resourcesManifestPath = path.join(resourcesDir, 'manifest.json');

  fs.mkdirSync(projectsDir, { recursive: true });
  fs.mkdirSync(resourcesDir, { recursive: true });

  const projectEntries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const guides = projectEntries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => {
      const title = e.name.slice(0, -'.html'.length);
      return {
        slug: title,
        title,
        file: `/library/ESP-32/projects/${e.name}`,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

  const resourceEntries = fs.readdirSync(resourcesDir, { withFileTypes: true });
  const resourceItems = resourceEntries
    .filter((e) => e.isFile() && e.name !== 'manifest.json')
    .map((e) => {
      const filePath = path.join(resourcesDir, e.name);
      const stat = fs.statSync(filePath);
      return {
        name: e.name,
        title: toDisplayTitle(e.name),
        file: `/library/ESP-32/resources/${encodeURIComponent(e.name)}`,
        type: getResourceType(e.name),
        extension: path.extname(e.name).slice(1).toUpperCase(),
        size: stat.size,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

  fs.writeFileSync(projectsManifestPath, JSON.stringify(guides, null, 2));
  fs.writeFileSync(resourcesManifestPath, JSON.stringify(resourceItems, null, 2));

  console.log(`\x1b[36m[esp32-library]\x1b[0m projects manifest updated — ${guides.length} guide(s)`);
  console.log(`\x1b[36m[esp32-library]\x1b[0m resources manifest updated — ${resourceItems.length} resource(s)`);
}

function esp32LibraryPlugin(): Plugin {
  let esp32Dir: string;

  return {
    name: 'esp32-library-manifest',

    configResolved(config) {
      esp32Dir = path.join(config.root, 'public', 'library', 'ESP-32');
    },

    buildStart() {
      generateEsp32Manifests(esp32Dir);
    },

    configureServer(server) {
      generateEsp32Manifests(esp32Dir);

      // Watch both project guides and arbitrary resources in dev mode.
      server.watcher.add(esp32Dir);
      server.watcher.on('all', (event, filePath) => {
        if (
          filePath.startsWith(esp32Dir) &&
          !filePath.endsWith(`${path.sep}projects${path.sep}manifest.json`) &&
          !filePath.endsWith(`${path.sep}resources${path.sep}manifest.json`)
        ) {
          generateEsp32Manifests(esp32Dir);
          server.ws.send({ type: 'full-reload' });
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
