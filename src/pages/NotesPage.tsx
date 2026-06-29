import { useEffect, useState } from 'react';
import { useProgress } from '../state/progress';
import { GlassPanel, SectionHeader, NeonButton, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { cn } from '../lib/cn';

// ===========================================================
// Notes — built-in notebook with multiple notes, autosave to
// localStorage. Tracks count for the progress store.
// ===========================================================

const KEY = 'qc.notes.v1';

interface Note {
  id: string;
  title: string;
  body: string;
  updated: number;
}

function load(): Note[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

export function NotesPage() {
  const { setNotesCount } = useProgress();
  const [notes, setNotes] = useState<Note[]>(() => load());
  const [activeId, setActiveId] = useState<string | null>(() => load()[0]?.id ?? null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch { /* ignore */ }
    setNotesCount(notes.length);
  }, [notes, setNotesCount]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const create = () => {
    const n: Note = { id: crypto.randomUUID(), title: 'Untitled note', body: '', updated: Date.now() };
    setNotes((s) => [n, ...s]);
    setActiveId(n.id);
  };

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((s) => s.map((n) => (n.id === active.id ? { ...n, ...patch, updated: Date.now() } : n)));
  };

  const remove = (id: string) => {
    setNotes((s) => s.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operator Notebook"
        title="Notes"
        description="Autosaved locally. Your field notes, findings, and write-ups."
        action={<NeonButton onClick={create}><Icon name="Plus" size={14} /> New Note</NeonButton>}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={<Icon name="StickyNote" size={32} />}
          title="No notes yet"
          description="Create your first note to start capturing findings."
          action={<NeonButton onClick={create}><Icon name="Plus" size={14} /> New Note</NeonButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          {/* List */}
          <GlassPanel className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
            {notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveId(n.id)}
                className={cn(
                  'qc-focus group flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors',
                  activeId === n.id ? 'bg-neon-400/10' : 'hover:bg-white/5',
                )}
              >
                <Icon name="StickyNote" size={14} className={cn('mt-0.5 shrink-0', activeId === n.id ? 'text-neon-400' : 'text-slate-500')} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-200">{n.title || 'Untitled'}</div>
                  <div className="font-mono text-[10px] text-slate-600">{new Date(n.updated).toLocaleString()}</div>
                </div>
                <span onClick={(e) => { e.stopPropagation(); remove(n.id); }} className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Icon name="X" size={13} className="text-slate-500 hover:text-err-400" />
                </span>
              </button>
            ))}
          </GlassPanel>

          {/* Editor */}
          {active ? (
            <GlassPanel className="flex flex-col p-0">
              <input
                value={active.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Note title"
                className="qc-focus border-b border-white/5 bg-transparent px-5 py-4 font-display text-lg font-semibold text-white outline-none placeholder:text-slate-600"
              />
              <textarea
                value={active.body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder="Start writing… autosaves as you type."
                className="qc-focus h-64 flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
              />
              <div className="flex items-center justify-between border-t border-white/5 px-5 py-2.5 font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5 text-neon-400"><Icon name="Save" size={11} /> autosaved</span>
                <span>{active.body.length} chars</span>
              </div>
            </GlassPanel>
          ) : (
            <EmptyState icon={<Icon name="StickyNote" size={28} />} title="Select a note" description="Choose a note from the list or create a new one." />
          )}
        </div>
      )}
    </div>
  );
}
