import { useEffect } from 'react';
import { RouterProvider, useRouter, useRoute } from './state/router';
import { SettingsProvider } from './state/settings';
import { ProgressProvider } from './state/progress';
import { BackgroundFX } from './components/BackgroundFX';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { TextbookPage } from './pages/TextbookPage';
import { LabsPage } from './pages/LabsPage';
import { LabPage } from './pages/LabPage';
import { MissionsPage } from './pages/MissionsPage';
import { MissionPage } from './pages/MissionPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { NotesPage } from './pages/NotesPage';
import { SearchPage } from './pages/SearchPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { TerminalPage } from './pages/TerminalPage';
import { LinuxLabPage } from './pages/LinuxLabPage';

// ===========================================================
// App — providers + router. Home is a full-screen boot; every
// other route renders inside the AppShell (4-region dashboard).
// ===========================================================

export default function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <RouterProvider>
          <BackgroundFX />
          <Routed />
        </RouterProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
}

function Routed() {
  const { segments } = useRoute();
  const { navigate } = useRouter();

  // ⌘K / Ctrl+K → search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const root = segments[0] ?? '';

  // Home = full-screen boot, no shell
  if (!root) return <HomePage />;

  const page = renderPage(segments);
  return <AppShell>{page}</AppShell>;
}

function renderPage(segments: string[]) {
  const [root, sub] = segments;
  switch (root) {
    case 'dashboard':
      return <DashboardPage />;
    case 'library':
      return sub ? <TextbookPage slug={sub} /> : <LibraryPage />;
    case 'labs':
      if (sub === 'linux') return <LinuxLabPage />;
      return sub ? <LabPage slug={sub} /> : <LabsPage />;
    case 'missions':
      return sub ? <MissionPage slug={sub} /> : <MissionsPage />;
    case 'achievements':
      return <AchievementsPage />;
    case 'notes':
      return <NotesPage />;
    case 'search':
      return <SearchPage />;
    case 'downloads':
      return <DownloadsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'about':
      return <AboutPage />;
    case 'terminal':
      return <TerminalPage />;
    default:
      return <DashboardPage />;
  }
}
