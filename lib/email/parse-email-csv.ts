export type ParsedEmailRow = {
  email: string
  company_name: string | null
  notes: string | null
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Minimal CSV line splitter that respects double quotes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

/**
 * Parse CSV with flexible headers: email / e-mail / mail / company / name / notes.
 * If no header, treats first column as email and optional second as company.
 */
export function parseEmailCsv(text: string): ParsedEmailRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const first = splitCsvLine(lines[0]).map((c) => c.toLowerCase())
  const emailIdx = first.findIndex((h) =>
    ['email', 'e-mail', 'mail', 'إيميل', 'بريد', 'البريد'].includes(h),
  )
  const companyIdx = first.findIndex((h) =>
    ['company', 'company_name', 'name', 'اسم', 'الشركة', 'شركة'].includes(h),
  )
  const notesIdx = first.findIndex((h) => ['notes', 'note', 'ملاحظات'].includes(h))

  let start = 0
  let eCol = 0
  let cCol = 1
  let nCol = -1

  if (emailIdx >= 0) {
    start = 1
    eCol = emailIdx
    cCol = companyIdx
    nCol = notesIdx
  } else if (first.some((c) => isValidEmail(normalizeEmail(c)))) {
    start = 0
    eCol = first.findIndex((c) => isValidEmail(normalizeEmail(c)))
    if (eCol < 0) eCol = 0
    cCol = eCol === 0 ? 1 : 0
  } else {
    start = 1
    eCol = 0
    cCol = 1
  }

  const map = new Map<string, ParsedEmailRow>()

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i])
    const email = normalizeEmail(cells[eCol] || '')
    if (!isValidEmail(email)) continue
    const company_name = cCol >= 0 ? (cells[cCol]?.trim() || null) : null
    const notes = nCol >= 0 ? (cells[nCol]?.trim() || null) : null
    if (!map.has(email)) {
      map.set(email, { email, company_name, notes })
    }
  }

  // Heuristic fallback: scan all cells for emails if map empty
  if (!map.size) {
    for (const line of lines) {
      for (const cell of splitCsvLine(line)) {
        const email = normalizeEmail(cell)
        if (isValidEmail(email) && !map.has(email)) {
          map.set(email, { email, company_name: null, notes: null })
        }
      }
    }
  }

  return [...map.values()]
}
