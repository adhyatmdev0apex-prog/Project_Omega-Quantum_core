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
// Scans public/library/ESP-32/ at build time and in dev mode for
// .html guide files and writes public/library/ESP-32/manifest.json
// so the ESP-32 Library page can discover guides at runtime with
// zero React/TS changes per guide.
//
// To add a new ESP-32 guide:
//   1. Drop <name>.html into public/library/ESP-32/
//   2. Done — display name is <name> (only the .html extension is
//      stripped; no other transformation), sorted alphabetically.
//
// Handles a missing/empty folder gracefully (writes an empty array).
// ===========================================================

function generateEsp32Manifest(esp32Dir: string): void {
  const manifestPath = path.join(esp32Dir, 'manifest.json');

  if (!fs.existsSync(esp32Dir)) {
    fs.mkdirSync(esp32Dir, { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify([], null, 2));
    return;
  }

  const entries = fs.readdirSync(esp32Dir, { withFileTypes: true });
  const guides = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => {
      const title = e.name.slice(0, -'.html'.length); // strip only the extension
      return {
        slug: title,
        title,
        file: `/library/ESP-32/${e.name}`,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  fs.writeFileSync(manifestPath, JSON.stringify(guides, null, 2));
  console.log(`\x1b[36m[esp32-library]\x1b[0m manifest updated — ${guides.length} guide(s)`);
}

function esp32LibraryPlugin(): Plugin {
  let esp32Dir: string;

  return {
    name: 'esp32-library-manifest',

    configResolved(config) {
      esp32Dir = path.join(config.root, 'public', 'library', 'ESP-32');
    },

    buildStart() {
      generateEsp32Manifest(esp32Dir);
    },

    configureServer(server) {
      generateEsp32Manifest(esp32Dir);

      // Watch for added / removed / renamed guides in dev mode
      server.watcher.add(esp32Dir);
      server.watcher.on('all', (event, filePath) => {
        if (
          filePath.startsWith(esp32Dir) &&
          !filePath.endsWith('manifest.json')
        ) {
          generateEsp32Manifest(esp32Dir);
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
