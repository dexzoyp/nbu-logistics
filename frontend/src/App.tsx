import { Component, Suspense, use, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { describeError } from './api/errors.ts'
import { readApiMode, writeApiMode } from './api/mode.ts'
import { createTextsApi, loadTextEntries, resetMockTexts } from './api/texts.ts'
import type { ApiMode, TextEntry } from './types/textEntry.ts'

export default function App() {
  const [mode, setMode] = useState<ApiMode>(() => readApiMode())
  const [requestKey, setRequestKey] = useState(0)

  function changeMode(next: ApiMode) {
    if (next === mode) return
    writeApiMode(next)
    setMode(next)
    setRequestKey((key) => key + 1)
  }

  function reload() {
    setRequestKey((key) => key + 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-sky-300">NBU Logistics</p>
            <h1 className="mt-1 text-3xl font-semibold">Text notes</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Create, edit, and delete notes through the same <code>/api/texts</code> routes as the
              Spring API.
            </p>
            <p className="mt-2 text-xs text-slate-500">{sourceLabel(mode)}</p>
          </div>
          <ModeSwitch mode={mode} onChange={changeMode} />
        </header>

        <Suspense fallback={<p className="text-sm text-slate-400">Loading notes…</p>}>
          <LoadErrorBoundary key={requestKey} onRetry={reload}>
            <NoteBoard key={requestKey} mode={mode} requestKey={requestKey} onReload={reload} />
          </LoadErrorBoundary>
        </Suspense>
      </div>
    </div>
  )
}

function NoteBoard({
  mode,
  requestKey,
  onReload,
}: {
  mode: ApiMode
  requestKey: number
  onReload: () => void
}) {
  const api = useMemo(() => createTextsApi(mode), [mode])
  const loaded = use(loadTextEntries(mode, requestKey))
  const [entries, setEntries] = useState(loaded)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setSaving(true)
    setError(null)
    try {
      const created = await api.create(text)
      setEntries((current) => [...current, created])
      setDraft('')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setSaving(false)
    }
  }

  function startEdit(entry: TextEntry) {
    setEditingId(entry.id)
    setEditingText(entry.text)
  }

  async function onUpdate(id: number) {
    const text = editingText.trim()
    if (!text) return
    setPendingId(id)
    setError(null)
    try {
      const updated = await api.update(id, text)
      setEntries((current) => current.map((entry) => (entry.id === id ? updated : entry)))
      setEditingId(null)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setPendingId(null)
    }
  }

  async function onDelete(id: number) {
    setPendingId(id)
    setError(null)
    try {
      await api.remove(id)
      setEntries((current) => current.filter((entry) => entry.id !== id))
      if (editingId === id) setEditingId(null)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setPendingId(null)
    }
  }

  function onResetMock() {
    resetMockTexts()
    onReload()
  }

  const ordered = [...entries].sort((a, b) => b.id - a.id)

  return (
    <>
      {error && (
        <p
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {error}
        </p>
      )}

      <form onSubmit={onCreate} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <label htmlFor="new-text" className="text-sm font-medium text-slate-200">
          New note
        </label>
        <textarea
          id="new-text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={4000}
          rows={3}
          placeholder="Shipment update, delay, or delivery note"
          className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-400 placeholder:text-slate-600 focus:ring-2"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || draft.trim().length === 0}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-slate-300">
            {ordered.length} {ordered.length === 1 ? 'note' : 'notes'}
          </h2>
          <div className="flex items-center gap-4">
            {mode === 'mock' && (
              <button type="button" onClick={onResetMock} className="text-sm text-slate-400 hover:text-slate-200">
                Reset mock data
              </button>
            )}
            <button type="button" onClick={onReload} className="text-sm text-slate-400 hover:text-slate-200">
              Reload
            </button>
          </div>
        </div>

        {ordered.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
            No notes yet.
          </p>
        )}

        {ordered.map((entry) => {
          const editing = editingId === entry.id
          const pending = pendingId === entry.id
          return (
            <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-slate-500">#{entry.id}</p>
                {!editing && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      disabled={pending}
                      className="rounded-md px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(entry.id)}
                      disabled={pending}
                      className="rounded-md px-2 py-1 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      {pending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
              {editing ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    maxLength={4000}
                    rows={3}
                    aria-label={`Edit note ${entry.id}`}
                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none ring-sky-400 focus:ring-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={pending}
                      className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void onUpdate(entry.id)}
                      disabled={pending || editingText.trim().length === 0}
                      className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 disabled:opacity-40"
                    >
                      {pending ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-6 whitespace-pre-wrap text-slate-100">{entry.text}</p>
              )}
            </article>
          )
        })}
      </section>
    </>
  )
}

function sourceLabel(mode: ApiMode) {
  if (mode === 'mock') return 'Mock JSON in the browser. The backend can stay off.'
  return 'Live API via /api/texts, proxied to localhost:8080.'
}

function ModeSwitch({ mode, onChange }: { mode: ApiMode; onChange: (mode: ApiMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1" role="group" aria-label="Data source">
      <ModeButton active={mode === 'mock'} onClick={() => onChange('mock')}>
        Mock
      </ModeButton>
      <ModeButton active={mode === 'live'} onClick={() => onChange('live')}>
        Backend
      </ModeButton>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950'
          : 'rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white'
      }
    >
      {children}
    </button>
  )
}

type LoadErrorBoundaryProps = {
  onRetry: () => void
  children: ReactNode
}

type LoadErrorBoundaryState = {
  error: string | null
}

class LoadErrorBoundary extends Component<LoadErrorBoundaryProps, LoadErrorBoundaryState> {
  state: LoadErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): LoadErrorBoundaryState {
    return { error: describeError(error) }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
        <p>{this.state.error}</p>
        <button
          type="button"
          onClick={this.props.onRetry}
          className="mt-3 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-950"
        >
          Try again
        </button>
      </div>
    )
  }
}
