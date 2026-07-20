import fs from 'node:fs'
import path from 'node:path'

let logoBase64: string | null = null

export function getLogoBase64(): string | null {
  if (logoBase64 !== null) return logoBase64 || null

  const logoPath = path.join(process.cwd(), 'public', 'logo-icon.png')
  if (!fs.existsSync(logoPath)) {
    logoBase64 = ''
    return null
  }

  logoBase64 = fs.readFileSync(logoPath).toString('base64')
  return logoBase64
}
