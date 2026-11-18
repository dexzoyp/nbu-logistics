import type { ApiMode } from '../types/textEntry.ts'

const STORAGE_KEY = 'logistics.apiMode'

export function readApiMode(): ApiMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'mock' || stored === 'live') {
    return stored
  }
  return import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock'
}

export function writeApiMode(mode: ApiMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}
