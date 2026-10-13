import type { Artifact } from '@/data/pipeline';

/** Resolve the exact saved revision; a missing version never falls back to latest. */
export function getArtifactVersion(
  artifact: Artifact,
  version: number,
): Artifact | undefined {
  if (artifact.version === version) return { ...artifact };
  const revision = artifact.history?.find((entry) => entry.version === version);
  if (!revision) return undefined;
  return {
    ...artifact,
    version,
    name: revision.name ?? artifact.name,
    content: revision.content,
    analytics: revision.analytics,
    notes: revision.notes,
    sourceId: revision.sourceId ?? artifact.sourceId,
    sourceVersion: revision.sourceVersion ?? artifact.sourceVersion,
    baseVersion: revision.baseVersion,
    updatedAt: revision.updatedAt,
    updatedBy: revision.updatedBy,
    status: revision.status ?? 'draft',
    validatedAt: undefined,
    validatedBy: undefined,
    validatedVersion: undefined,
  };
}
