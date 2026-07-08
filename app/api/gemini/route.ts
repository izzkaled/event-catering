import { verifyAdmin } from '@/lib/admin-auth'
import { generateWithGemini } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const auth = await verifyAdmin()
  if (auth) return auth

  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    const text = await generateWithGemini(prompt)
    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    const status = message.includes('مشغولة') || message.includes('high demand') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
