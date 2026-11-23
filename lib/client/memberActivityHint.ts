export type MemberActivityHint = {
  kind: 'video' | 'audio' | 'pdf' | 'browsing' | 'idle'
  title?: string
  detail?: string
}

const KEY = 'etv_member_activity_hint'

export function setMemberActivityHint(hint: MemberActivityHint | null): void {
  if (typeof window === 'undefined') return
  if (!hint) {
    sessionStorage.removeItem(KEY)
    return
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(hint))
  } catch {
    // private mode
  }
}

export function readMemberActivityHint(): MemberActivityHint | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const value = parsed as Partial<MemberActivityHint>
    const kind = value.kind
    if (
      kind !== 'video' &&
      kind !== 'audio' &&
      kind !== 'pdf' &&
      kind !== 'browsing' &&
      kind !== 'idle'
    ) {
      return null
    }
    return {
      kind,
      title: typeof value.title === 'string' ? value.title : undefined,
      detail: typeof value.detail === 'string' ? value.detail : undefined,
    }
  } catch {
    return null
  }
}