/**
 * Windows local Node often cannot verify Neon TLS (AV HTTPS inspection).
 * Loaded only from the Node.js instrumentation runtime — never Edge.
 */
export async function registerNode() {
  if (process.env.NODE_ENV === 'production') return
  if (process.platform !== 'win32') return
  if (process.env.ALLOW_INSECURE_TLS === 'false') return
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
