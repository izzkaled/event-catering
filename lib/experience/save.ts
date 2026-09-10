import type { ExperienceDraft } from '@/lib/experience/types'

const STORAGE_KEY = 'event_experience_drafts'
const ACTIVE_KEY = 'event_experience_active'

function randomId() {
  const n = Math.floor(10000 + Math.random() * 90000)
  return `EX-${n}`
}

export function createExperienceId() {
  return randomId()
}

export function loadDrafts(): ExperienceDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ExperienceDraft[]
  } catch {
    return []
  }
}

export function saveDraft(draft: ExperienceDraft) {
  const all = loadDrafts().filter((d) => d.id !== draft.id)
  all.unshift({ ...draft, updatedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 20)))
  localStorage.setItem(ACTIVE_KEY, draft.id)
  return draft
}

export function getDraft(id: string) {
  return loadDrafts().find((d) => d.id === id) || null
}

export function getActiveDraftId() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_KEY)
}

export function createEmptyDraft(partial?: Partial<ExperienceDraft>): ExperienceDraft {
  return {
    id: createExperienceId(),
    packageId: '',
    packageSlug: '',
    occasion: null,
    guests: 50,
    date: '',
    time: '',
    location: '',
    venueType: null,
    budget: null,
    selectedServiceIds: [],
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}
