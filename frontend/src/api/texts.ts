import seed from '../mocks/texts.json'
import type { ApiMode, TextEntry } from '../types/textEntry.ts'
import { ApiError } from './errors.ts'

const MOCK_DELAY_MS = 220

export type TextsApi = {
  list: () => Promise<TextEntry[]>
  create: (text: string) => Promise<TextEntry>
  update: (id: number, text: string) => Promise<TextEntry>
  remove: (id: number) => Promise<void>
}

function cloneSeed(): TextEntry[] {
  return seed.map((entry) => ({ id: entry.id, text: entry.text }))
}

let mockEntries = cloneSeed()

export function resetMockTexts() {
  mockEntries = cloneSeed()
}

function wait() {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS)
  })
}

function mockApi(): TextsApi {
  return {
    async list() {
      await wait()
      return mockEntries.map((entry) => ({ ...entry }))
    },
    async create(text) {
      await wait()
      const nextId = mockEntries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1
      const created = { id: nextId, text }
      mockEntries = [...mockEntries, created]
      return { ...created }
    },
    async update(id, text) {
      await wait()
      const current = mockEntries.find((entry) => entry.id === id)
      if (!current) {
        throw new ApiError(404, 'That note was not found.')
      }
      const updated = { id, text }
      mockEntries = mockEntries.map((entry) => (entry.id === id ? updated : entry))
      return { ...updated }
    },
    async remove(id) {
      await wait()
      if (!mockEntries.some((entry) => entry.id === id)) {
        throw new ApiError(404, 'That note was not found.')
      }
      mockEntries = mockEntries.filter((entry) => entry.id !== id)
    },
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the backend. Start Spring Boot on port 8080, or switch to mock data.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw new ApiError(response.status, await errorMessage(response))
  }

  return (await response.json()) as T
}

async function errorMessage(response: Response): Promise<string> {
  if (response.status === 404) {
    return 'That note was not found.'
  }
  const body = (await response.text()).trim()
  if (body) {
    return body
  }
  if (response.status >= 500) {
    return 'The backend failed to handle the request.'
  }
  return `Request failed (${response.status}).`
}

function liveApi(): TextsApi {
  return {
    list: () => request<TextEntry[]>('/api/texts'),
    create: (text) =>
      request<TextEntry>('/api/texts', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    update: (id, text) =>
      request<TextEntry>(`/api/texts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ text }),
      }),
    remove: (id) =>
      request<void>(`/api/texts/${id}`, {
        method: 'DELETE',
      }),
  }
}

export function createTextsApi(mode: ApiMode): TextsApi {
  return mode === 'mock' ? mockApi() : liveApi()
}

const listRequests = new Map<string, Promise<TextEntry[]>>()

export function loadTextEntries(mode: ApiMode, requestKey: number): Promise<TextEntry[]> {
  const cacheKey = `${mode}:${requestKey}`
  const existing = listRequests.get(cacheKey)
  if (existing) return existing
  const promise = createTextsApi(mode).list()
  listRequests.set(cacheKey, promise)
  return promise
}
