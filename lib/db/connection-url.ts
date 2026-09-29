/**
 * Prefer Neon's pooled endpoint for serverless runtimes.
 * Migrations / drizzle-kit should keep using direct DATABASE_URL.
 */
export function resolveRuntimeDatabaseUrl(): string {
  const explicit = process.env.DATABASE_POOLER_URL?.trim()
  if (explicit) return explicit

  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  if (process.env.DATABASE_USE_DIRECT === 'true') return url
  return preferNeonPoolerHostname(url)
}

/** Insert `-pooler` into Neon hostnames when missing. */
export function preferNeonPoolerHostname(connectionString: string): string {
  try {
    const u = new URL(connectionString)
    const host = u.hostname
    if (!host.includes('neon.tech')) return connectionString
    if (host.includes('-pooler.') || host.startsWith('pooler.')) return connectionString

    // ep-name-12345.region.aws.neon.tech → ep-name-12345-pooler.region.aws.neon.tech
    u.hostname = host.replace(/^(ep-[a-z0-9-]+)(\.)/i, '$1-pooler$2')
    return u.toString()
  } catch {
    return connectionString
  }
}
