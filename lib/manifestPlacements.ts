export type ManifestPlacement = {
  id: string
  sectionId: string | null
  order: number
}

export type NormalizedManifestEntry = {
  title?: string
  description?: string
  thumbnailName?: string
  placements: ManifestPlacement[]
}

type RawManifestEntry = {
  title?: string
  description?: string
  thumbnailName?: string
  sectionId?: string | null
  order?: number
  placements?: ManifestPlacement[]
}

export function normalizeEntry(
  raw: RawManifestEntry | undefined,
  objectName: string,
): NormalizedManifestEntry {
  const title = typeof raw?.title === 'string' ? raw.title : undefined
  const description = typeof raw?.description === 'string' ? raw.description : undefined
  const thumbnailName =
    typeof raw?.thumbnailName === 'string' ? raw.thumbnailName : undefined

  const placements = Array.isArray(raw?.placements)
    ? raw.placements.filter(
        (p): p is ManifestPlacement =>
          typeof p === 'object' &&
          p !== null &&
          typeof p.id === 'string' &&
          (typeof p.sectionId === 'string' || p.sectionId === null) &&
          typeof p.order === 'number',
      )
    : []

  if (placements.length > 0) {
    return { title, description, thumbnailName, placements }
  }

  return {
    title,
    description,
    thumbnailName,
    placements: [
      {
        id: objectName,
        sectionId: typeof raw?.sectionId === 'string' ? raw.sectionId : null,
        order: typeof raw?.order === 'number' ? raw.order : 0,
      },
    ],
  }
}

type ManifestWithFiles = { files: Record<string, RawManifestEntry | undefined> }

export function resolvePlacement(
  manifest: ManifestWithFiles,
  placementId: string,
): { objectName: string; entry: NormalizedManifestEntry; placement: ManifestPlacement } {
  for (const [objectName, raw] of Object.entries(manifest.files)) {
    const entry = normalizeEntry(raw, objectName)
    const placement = entry.placements.find((p) => p.id === placementId)
    if (placement) return { objectName, entry, placement }
  }
  throw new Error('File placement not found.')
}

export function allPlacements(manifest: ManifestWithFiles): ManifestPlacement[] {
  const out: ManifestPlacement[] = []
  for (const [objectName, raw] of Object.entries(manifest.files)) {
    out.push(...normalizeEntry(raw, objectName).placements)
  }
  return out
}

export function nextPlacementOrder(manifest: ManifestWithFiles, sectionId: string | null): number {
  const orders = allPlacements(manifest)
    .filter((p) => p.sectionId === sectionId)
    .map((p) => p.order)
  return orders.length === 0 ? 0 : Math.max(...orders) + 1
}

export function serializeEntry(entry: NormalizedManifestEntry): RawManifestEntry & {
  placements: ManifestPlacement[]
} {
  return {
    title: entry.title,
    description: entry.description,
    thumbnailName: entry.thumbnailName,
    placements: entry.placements,
  }
}
