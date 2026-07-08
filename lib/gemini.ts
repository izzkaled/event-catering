const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

const RETRYABLE = new Set([429, 500, 503, 504])
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseApiError(body: string): string {
  try {
    const json = JSON.parse(body) as { error?: { message?: string; code?: number } }
    const msg = json.error?.message
    if (msg?.includes('high demand') || json.error?.code === 503) {
      return 'النموذج مشغول حالياً. جاري المحاولة بنموذج آخر...'
    }
    if (json.error?.code === 429) {
      return 'تم تجاوز حد الطلبات. حاول بعد قليل.'
    }
    if (msg) return msg
  } catch {
    // not JSON
  }
  return body || 'Gemini API request failed'
}

async function callModel(apiKey: string, model: string, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false as const, status: res.status, error: parseApiError(errText) }
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return { ok: false as const, status: 502, error: 'No content returned from Gemini' }
  }

  return { ok: true as const, text: text as string }
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to .env.local')
  }

  let lastError = 'Gemini API unavailable'

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = await callModel(apiKey, model, prompt)

      if (result.ok) return result.text

      lastError = result.error

      if (RETRYABLE.has(result.status) && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      break
    }
  }

  throw new Error(
    lastError.includes('مشغول') || lastError.includes('high demand')
      ? 'جميع نماذج Gemini مشغولة حالياً. انتظر دقيقة وحاول مرة أخرى.'
      : lastError
  )
}
