import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { verifyAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { packageSections, packages } from '@/lib/db/schema'
import { generateWithGemini } from '@/lib/gemini'
import { visitsPerMonthFromWeekly } from '@/lib/booking/schedule'
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export type PackageProposal = {
  action: 'update' | 'create' | 'toggle_popular' | 'toggle_active' | 'create_section'
  package_id?: string | null
  package_name?: string | null
  rationale: string
  changes?: {
    name_ar?: string
    name_en?: string
    slug?: string
    description_ar?: string
    description_en?: string
    hours_per_visit?: number
    visits_per_week?: number
    price_omr?: number | string
    section_id?: string | null
    /** Link to a section by slug when section_id is unknown / newly created */
    section_slug?: string | null
    is_popular?: boolean
    is_active?: boolean
    sort_order?: number
  }
}

const ACTION_ALIASES: Record<string, PackageProposal['action']> = {
  update: 'update',
  create: 'create',
  create_package: 'create',
  add_package: 'create',
  toggle_popular: 'toggle_popular',
  popular: 'toggle_popular',
  toggle_active: 'toggle_active',
  create_section: 'create_section',
  add_section: 'create_section',
  new_section: 'create_section',
  section: 'create_section',
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = (fenced?.[1] || text).trim()
  const start = raw.indexOf('{')
  const startArr = raw.indexOf('[')
  const begin =
    startArr >= 0 && (start < 0 || startArr < start) ? startArr : start
  if (begin < 0) throw new Error('لم يُرجع المساعد اقتراحات بصيغة صحيحة')
  const opener = raw[begin]
  const closer = opener === '[' ? ']' : '}'
  const end = raw.lastIndexOf(closer)
  if (end < begin) throw new Error('استجابة الذكاء الاصطناعي غير مكتملة')
  try {
    return JSON.parse(raw.slice(begin, end + 1))
  } catch {
    throw new Error('تعذر قراءة اقتراحات الذكاء الاصطناعي — أعد المحاولة بصياغة أوضح')
  }
}

function normalizeProposals(data: unknown): PackageProposal[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { proposals?: unknown }).proposals)
      ? (data as { proposals: unknown[] }).proposals
      : null

  if (!list) throw new Error('صيغة الاقتراحات غير متوقعة')

  const proposals: PackageProposal[] = []

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const rawAction = String(row.action || 'update')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
    const action = ACTION_ALIASES[rawAction]
    if (!action) continue

    proposals.push({
      action,
      package_id: row.package_id ? String(row.package_id) : null,
      package_name: row.package_name
        ? String(row.package_name)
        : row.section_name
          ? String(row.section_name)
          : null,
      rationale: String(row.rationale || 'اقتراح من المساعد'),
      changes: (row.changes && typeof row.changes === 'object'
        ? row.changes
        : {}) as PackageProposal['changes'],
    })
  }

  if (!proposals.length) {
    throw new Error('لم يُرجع المساعد اقتراحات قابلة للتطبيق — جرّب صياغة أوضح')
  }

  // Apply sections before packages when admin confirms in order
  proposals.sort((a, b) => {
    if (a.action === 'create_section' && b.action !== 'create_section') return -1
    if (b.action === 'create_section' && a.action !== 'create_section') return 1
    return 0
  })

  return proposals.slice(0, 12)
}

export async function POST(request: Request) {
  const unauthorized = await verifyAdmin()
  if (unauthorized) return unauthorized

  const ip = getClientIp(request)
  if (!(await checkRateLimit(`ai-packages:${ip}`))) {
    return NextResponse.json({ error: 'طلبات كثيرة — حاول بعد قليل' }, { status: 429 })
  }

  try {
    let body: {
      action?: 'propose' | 'apply'
      instruction?: string
      proposal?: PackageProposal
    }
    try {
      body = (await request.json()) as typeof body
    } catch {
      return NextResponse.json({ error: 'طلب غير صالح (JSON فارغ أو تالف)' }, { status: 400 })
    }

    if (body.action === 'apply') {
      try {
        return await applyProposal(body.proposal)
      } catch (applyError) {
        console.error('applyProposal:', applyError)
        const message = applyError instanceof Error ? applyError.message : 'فشل تطبيق التعديل'
        return NextResponse.json({ error: message }, { status: 500 })
      }
    }

    const instruction = body.instruction?.trim()
    if (!instruction) {
      return NextResponse.json({ error: 'اكتب ماذا تريد تغييره في الباقات أو الأقسام' }, { status: 400 })
    }

    const [allPackages, sections] = await Promise.all([
      db.select().from(packages).orderBy(asc(packages.sort_order)),
      db.select().from(packageSections).orderBy(asc(packageSections.sort_order)),
    ])

    const catalog = allPackages.map((p) => ({
      id: p.id,
      section_id: p.section_id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      hours_per_visit: p.hours_per_visit,
      visits_per_week: p.visits_per_week,
      visits_per_month: p.visits_per_month,
      price_omr: p.price_omr,
      is_active: p.is_active,
      is_popular: p.is_popular,
      sort_order: p.sort_order,
    }))

    const prompt = `You are an admin operations planner for Speedy Cleaning (Muscat).
The admin asked to change packages AND/OR service sections. Propose concrete edits. DO NOT apply them yourself.

Admin instruction (Arabic or English):
"""
${instruction}
"""

Current sections:
${JSON.stringify(sections.map((s) => ({ id: s.id, slug: s.slug, name_ar: s.name_ar, name_en: s.name_en, is_active: s.is_active })), null, 2)}

Current packages:
${JSON.stringify(catalog, null, 2)}

Return ONLY valid JSON (no markdown) in this shape:
{
  "summary": "short Arabic summary of what you propose",
  "proposals": [
    {
      "action": "update" | "create" | "toggle_popular" | "toggle_active" | "create_section",
      "package_id": "uuid for existing package or null",
      "package_name": "arabic display name (package or section)",
      "rationale": "one short Arabic reason",
      "changes": {
        "name_ar": optional,
        "name_en": optional,
        "slug": optional english slug for create_section (e.g. laundry),
        "description_ar": optional (section),
        "description_en": optional (section),
        "hours_per_visit": optional number (packages),
        "visits_per_week": optional 1-7 (packages),
        "price_omr": optional number (packages),
        "section_id": optional uuid of an EXISTING section only (never invent),
        "section_slug": optional english slug when package belongs to a newly proposed section,
        "is_popular": optional boolean,
        "is_active": optional boolean,
        "sort_order": optional number
      }
    }
  ]
}

Rules:
- If the admin asks to add a section/category/خدمة/قسم (laundry, deep clean, disinfection, etc.) use action "create_section" with name_ar, name_en, and english slug.
- Prefer update over create unless admin asked for a new package.
- Keep visits_per_week between 1 and 7.
- Prices in OMR, realistic for Muscat.
- Use real package_id values from the catalog when updating packages.
- NEVER invent UUIDs for package_id or section_id. Only copy IDs that appear in Current sections / Current packages above.
- When creating a package for a NEW section that you also propose in this same response: set section_id to null and set changes.section_slug to that section's english slug (e.g. "laundry"). Do NOT invent a section UUID.
- When linking to an EXISTING section: use that section's real id from Current sections.
- Max 8 proposals.`

    const text = await generateWithGemini(prompt)
    const parsed = extractJson(text)
    const proposals = normalizeProposals(parsed)
    const summary =
      parsed && typeof parsed === 'object' && 'summary' in parsed
        ? String((parsed as { summary: unknown }).summary)
        : 'اقتراحات جاهزة للمراجعة'

    return NextResponse.json({ summary, proposals, catalogCount: catalog.length })
  } catch (error) {
    console.error('POST /api/admin/ai-packages:', error)
    const message = error instanceof Error ? error.message : 'فشل اقتراح التعديلات'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function resolveSectionId(
  sectionId: string | null | undefined,
  sectionSlug: string | null | undefined,
): Promise<string | null> {
  if (sectionId) {
    const [byId] = await db
      .select({ id: packageSections.id })
      .from(packageSections)
      .where(eq(packageSections.id, sectionId))
      .limit(1)
    if (byId) return byId.id
  }

  const slug = sectionSlug ? slugify(sectionSlug) : ''
  if (slug) {
    const [bySlug] = await db
      .select({ id: packageSections.id })
      .from(packageSections)
      .where(eq(packageSections.slug, slug))
      .limit(1)
    if (bySlug) return bySlug.id
  }

  return null
}

async function applyProposal(proposal: PackageProposal | undefined) {
  if (!proposal?.action) {
    return NextResponse.json({ error: 'الاقتراح ناقص' }, { status: 400 })
  }

  const changes = proposal.changes || {}

  if (proposal.action === 'create_section') {
    const nameAr = String(changes.name_ar || proposal.package_name || '').trim()
    const nameEn = String(changes.name_en || '').trim()
    if (!nameAr || !nameEn) {
      return NextResponse.json({ error: 'اسم القسم بالعربي والإنجليزي مطلوبان' }, { status: 400 })
    }

    const slug =
      slugify(String(changes.slug || '')) ||
      slugify(nameEn) ||
      slugify(nameAr)

    if (!slug) {
      return NextResponse.json(
        { error: 'المعرّف (slug) مطلوب — استخدم حروفاً إنجليزية مثل laundry' },
        { status: 400 },
      )
    }

    try {
      const [section] = await db
        .insert(packageSections)
        .values({
          slug,
          name_ar: nameAr,
          name_en: nameEn,
          description_ar: changes.description_ar ? String(changes.description_ar).trim() : null,
          description_en: changes.description_en ? String(changes.description_en).trim() : null,
          sort_order: changes.sort_order != null ? Number(changes.sort_order) : 0,
        })
        .returning()

      return NextResponse.json({ success: true, section }, { status: 201 })
    } catch (insertError: unknown) {
      const message = insertError instanceof Error ? insertError.message : ''
      if (message.includes('unique') || message.includes('duplicate')) {
        return NextResponse.json({ error: 'هذا القسم (slug) موجود مسبقاً' }, { status: 409 })
      }
      throw insertError
    }
  }

  if (proposal.action === 'create') {
    const weekly = Number(changes.visits_per_week ?? 2)
    if (!Number.isFinite(weekly) || weekly < 1 || weekly > 7) {
      return NextResponse.json({ error: 'زيارات الأسبوع يجب أن تكون بين 1 و 7' }, { status: 400 })
    }
    if (!changes.name_ar || !changes.name_en || !changes.hours_per_visit || changes.price_omr == null) {
      return NextResponse.json({ error: 'حقول الباقة الجديدة ناقصة' }, { status: 400 })
    }

    const sectionId = await resolveSectionId(
      changes.section_id as string | null | undefined,
      (changes as { section_slug?: string }).section_slug,
    )

    if (changes.section_id && !sectionId && !(changes as { section_slug?: string }).section_slug) {
      // Fake UUID from the model — create package without section rather than crashing FK
      console.warn('Ignoring unknown section_id from AI proposal:', changes.section_id)
    }

    const [pkg] = await db
      .insert(packages)
      .values({
        name_ar: String(changes.name_ar).trim(),
        name_en: String(changes.name_en).trim(),
        hours_per_visit: Number(changes.hours_per_visit),
        visits_per_week: weekly,
        visits_per_month: visitsPerMonthFromWeekly(weekly),
        price_omr: parseFloat(String(changes.price_omr)).toFixed(2),
        section_id: sectionId,
        is_popular: Boolean(changes.is_popular),
        is_featured: Boolean(changes.is_popular),
        is_active: changes.is_active !== false,
        sort_order: Number.isFinite(Number(changes.sort_order)) ? Number(changes.sort_order) : 0,
      })
      .returning()

    return NextResponse.json({
      success: true,
      package: pkg,
      warning: !sectionId && (changes.section_id || (changes as { section_slug?: string }).section_slug)
        ? 'تم إنشاء الباقة بدون قسم — طبّق إنشاء القسم أولاً ثم اربط الباقة من لوحة الباقات'
        : undefined,
    })
  }

  if (!proposal.package_id) {
    return NextResponse.json({ error: 'معرّف الباقة مطلوب' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(packages)
    .where(eq(packages.id, proposal.package_id))
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'الباقة غير موجودة' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date() }

  if (proposal.action === 'toggle_popular') {
    const next = changes.is_popular !== undefined ? Boolean(changes.is_popular) : !existing.is_popular
    updates.is_popular = next
    updates.is_featured = next
  } else if (proposal.action === 'toggle_active') {
    updates.is_active =
      changes.is_active !== undefined ? Boolean(changes.is_active) : !existing.is_active
  } else {
    if (changes.name_ar !== undefined) updates.name_ar = String(changes.name_ar).trim()
    if (changes.name_en !== undefined) updates.name_en = String(changes.name_en).trim()
    if (changes.hours_per_visit !== undefined) updates.hours_per_visit = Number(changes.hours_per_visit)
    if (changes.visits_per_week !== undefined) {
      const weekly = Number(changes.visits_per_week)
      if (!Number.isFinite(weekly) || weekly < 1 || weekly > 7) {
        return NextResponse.json({ error: 'زيارات الأسبوع يجب أن تكون بين 1 و 7' }, { status: 400 })
      }
      updates.visits_per_week = weekly
      updates.visits_per_month = visitsPerMonthFromWeekly(weekly)
    }
    if (changes.price_omr !== undefined) {
      updates.price_omr = parseFloat(String(changes.price_omr)).toFixed(2)
    }
    if (changes.section_id !== undefined || (changes as { section_slug?: string }).section_slug) {
      updates.section_id = await resolveSectionId(
        changes.section_id as string | null | undefined,
        (changes as { section_slug?: string }).section_slug,
      )
    }
    if (changes.is_popular !== undefined) {
      updates.is_popular = Boolean(changes.is_popular)
      updates.is_featured = Boolean(changes.is_popular)
    }
    if (changes.is_active !== undefined) updates.is_active = Boolean(changes.is_active)
    if (changes.sort_order !== undefined) {
      updates.sort_order = Number.isFinite(Number(changes.sort_order)) ? Number(changes.sort_order) : 0
    }
  }

  const [pkg] = await db
    .update(packages)
    .set(updates)
    .where(eq(packages.id, proposal.package_id))
    .returning()

  return NextResponse.json({ success: true, package: pkg })
}
