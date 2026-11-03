import { create as createFont } from 'fontkit'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ARABIC_FONT_CANDIDATES = [
  join(process.cwd(), 'public/fonts/NotoNaskhArabic.ttf'),
  join(process.cwd(), 'public/fonts/NotoNaskhArabic-Regular.ttf'),
]

const LATIN_FONT_CANDIDATES = [
  join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'),
  join(process.cwd(), 'public/fonts/NotoSans.ttf'),
]

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const LATIN_OR_DIGIT = /[A-Za-z0-9\u00C0-\u024F]/
/** Prefer Latin font for punctuation — Naskh often lacks · — () boxes show as tofu. */
const LATIN_PUNCT =
  /[\u0020-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A0-\u00BF\u2010-\u2027\u2030-\u205E\u2212\u00B7\u2022\u2026]/

type OpenTypeFont = ReturnType<typeof createFont>

type GlyphPathCommand = {
  command: string
  args: number[]
}

type LaidOutGlyph = {
  path: { commands: GlyphPathCommand[] }
  advanceWidth: number
}

type GlyphPosition = {
  xAdvance: number
  yAdvance: number
  xOffset: number
  yOffset: number
}

export type FontPair = {
  arabic: OpenTypeFont
  latin: OpenTypeFont
}

type ScriptRun = {
  arabic: boolean
  text: string
}

export type ShapedTextOptions = {
  width?: number
  align?: 'left' | 'right'
  lineGap?: number
}

export function resolveArabicFontPath() {
  return ARABIC_FONT_CANDIDATES.find((path) => existsSync(path)) ?? null
}

export function resolveLatinFontPath() {
  return LATIN_FONT_CANDIDATES.find((path) => existsSync(path)) ?? null
}

export function openInvoiceFont(fontPath: string) {
  return createFont(readFileSync(fontPath)) as OpenTypeFont
}

export function loadInvoiceFonts(): FontPair {
  const arabicFontPath = resolveArabicFontPath()
  const latinFontPath = resolveLatinFontPath()
  if (!arabicFontPath) {
    throw new Error('Missing Arabic invoice font at public/fonts/NotoNaskhArabic.ttf')
  }
  if (!latinFontPath) {
    throw new Error('Missing Latin invoice font at public/fonts/NotoSans-Regular.ttf')
  }
  return {
    arabic: openInvoiceFont(arabicFontPath),
    latin: openInvoiceFont(latinFontPath),
  }
}

/**
 * Split mixed strings so Arabic uses Naskh shaping and Latin/digits use Noto Sans.
 * Neutrals follow the next strong character when possible.
 */
export function splitPdfScriptRuns(value: string): ScriptRun[] {
  if (!value) return [{ arabic: false, text: '' }]

  const chars = Array.from(value)
  const strongOf = (char: string): 'arab' | 'latn' | null => {
    if (ARABIC_SCRIPT.test(char)) return 'arab'
    if (LATIN_OR_DIGIT.test(char) || LATIN_PUNCT.test(char)) return 'latn'
    return null
  }

  const types = chars.map((char, index) => {
    const strong = strongOf(char)
    if (strong) return strong
    const ahead = chars
      .slice(index + 1)
      .map(strongOf)
      .find(Boolean)
    if (ahead) return ahead
    const behind = chars.slice(0, index).reverse().map(strongOf).find(Boolean)
    return behind ?? 'latn'
  })

  const runs: ScriptRun[] = []
  let start = 0
  for (let index = 1; index < types.length; index += 1) {
    if (types[index] === types[start]) continue
    runs.push({
      arabic: types[start] === 'arab',
      text: chars.slice(start, index).join(''),
    })
    start = index
  }
  runs.push({
    arabic: types[start] === 'arab',
    text: chars.slice(start).join(''),
  })
  return runs
}

function fontForRun(fonts: FontPair, arabic: boolean) {
  return arabic ? fonts.arabic : fonts.latin
}

function measureRun(font: OpenTypeFont, text: string, fontSize: number) {
  const run = font.layout(text) as {
    advanceWidth: number
    glyphs: LaidOutGlyph[]
    positions: GlyphPosition[]
  }
  const scale = fontSize / font.unitsPerEm
  return { run, scale, width: run.advanceWidth * scale }
}

function measureLine(fonts: FontPair, text: string, fontSize: number) {
  return splitPdfScriptRuns(text).reduce((total, part) => {
    if (!part.text) return total
    return total + measureRun(fontForRun(fonts, part.arabic), part.text, fontSize).width
  }, 0)
}

/**
 * Draw OpenType-shaped glyph outlines. pdfkit text() cannot shape Arabic;
 * fontkit.layout() applies GSUB/GPOS correctly (same approach as Teeb invoices).
 */
function drawShapedText(
  doc: PDFKit.PDFDocument,
  font: OpenTypeFont,
  text: string,
  x: number,
  y: number,
  fontSize: number,
) {
  const { run, scale } = measureRun(font, text, fontSize)
  let cursorX = x

  for (let index = 0; index < run.glyphs.length; index += 1) {
    const glyph = run.glyphs[index]
    const pos = run.positions[index] ?? {
      xAdvance: glyph.advanceWidth,
      yAdvance: 0,
      xOffset: 0,
      yOffset: 0,
    }
    const ox = pos.xOffset * scale
    const oy = pos.yOffset * scale
    const commands = glyph.path.commands

    if (commands.length > 0) {
      doc.save()
      doc.translate(cursorX + ox, y - oy)
      doc.scale(scale, -scale)

      for (const command of commands) {
        const a = command.args
        if (command.command === 'moveTo') doc.moveTo(a[0] ?? 0, a[1] ?? 0)
        else if (command.command === 'lineTo') doc.lineTo(a[0] ?? 0, a[1] ?? 0)
        else if (command.command === 'quadraticCurveTo') {
          doc.quadraticCurveTo(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0, a[3] ?? 0)
        } else if (command.command === 'bezierCurveTo') {
          doc.bezierCurveTo(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0, a[3] ?? 0, a[4] ?? 0, a[5] ?? 0)
        } else if (command.command === 'closePath') doc.closePath()
      }

      doc.fill()
      doc.restore()
    }

    cursorX += pos.xAdvance * scale
  }

  return run.advanceWidth * scale
}

function drawMixedLine(
  doc: PDFKit.PDFDocument,
  fonts: FontPair,
  text: string,
  x: number,
  y: number,
  fontSize: number,
) {
  let cursorX = x
  for (const part of splitPdfScriptRuns(text)) {
    if (!part.text) continue
    cursorX += drawShapedText(doc, fontForRun(fonts, part.arabic), part.text, cursorX, y, fontSize)
  }
  return cursorX - x
}

function wrapLines(fonts: FontPair, text: string, fontSize: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = words[0] ?? ''

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`
    if (measureLine(fonts, candidate, fontSize) <= maxWidth) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  lines.push(current)
  return lines
}

export function writeShaped(
  doc: PDFKit.PDFDocument,
  fonts: FontPair,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  options?: ShapedTextOptions,
) {
  const lineGap = options?.lineGap ?? fontSize * 0.35
  const maxWidth = options?.width
  const lines = maxWidth != null ? wrapLines(fonts, text, fontSize, maxWidth) : [text]

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const lineY = y + index * (fontSize + lineGap)
    const width = measureLine(fonts, line, fontSize)
    let drawX = x
    if (options?.align === 'right' && maxWidth != null) {
      drawX = x + maxWidth - width
    } else if (options?.align === 'right') {
      drawX = x - width
    }
    drawMixedLine(doc, fonts, line, drawX, lineY, fontSize)
  }

  const usedHeight = lines.length * fontSize + Math.max(0, lines.length - 1) * lineGap
  doc.x = x
  doc.y = y + usedHeight
  return usedHeight
}
