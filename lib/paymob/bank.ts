import { createHash } from 'crypto'

export type BankDetails = {
  bankName: string
  accountName: string
  accountNumber: string
  iban: string
  swift: string | null
}

export function getBankDetails(): BankDetails {
  return {
    bankName: process.env.BANK_NAME?.trim() || 'Bank Muscat',
    accountName: process.env.BANK_ACCOUNT_NAME?.trim() || 'Speedy Cleaning',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER?.trim() || '',
    iban: process.env.BANK_IBAN?.trim() || '',
    swift: process.env.BANK_SWIFT?.trim() || null,
  }
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  )
}

/** Upload receipt to Cloudinary when configured; otherwise return a data URL. */
export async function storeTransferReceipt(opts: {
  buffer: Buffer
  mimeType: string
  orderNumber: string
}): Promise<string> {
  if (isCloudinaryConfigured()) {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME!.trim()
    const key = process.env.CLOUDINARY_API_KEY!.trim()
    const secret = process.env.CLOUDINARY_API_SECRET!.trim()
    const timestamp = Math.floor(Date.now() / 1000)
    const publicId = `bank-receipts/${opts.orderNumber}-${timestamp}`
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${secret}`
    const signature = createHash('sha1').update(toSign).digest('hex')

    const form = new FormData()
    form.append('file', `data:${opts.mimeType};base64,${opts.buffer.toString('base64')}`)
    form.append('api_key', key)
    form.append('timestamp', String(timestamp))
    form.append('public_id', publicId)
    form.append('signature', signature)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body: form,
    })
    const data = (await res.json().catch(() => null)) as {
      secure_url?: string
      error?: { message?: string }
    } | null
    if (!res.ok || !data?.secure_url) {
      throw new Error(data?.error?.message || 'Cloudinary upload failed')
    }
    return data.secure_url
  }

  // Fallback: store as data URL (keep receipts small — enforced by API)
  return `data:${opts.mimeType};base64,${opts.buffer.toString('base64')}`
}
