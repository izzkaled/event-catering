import twilio from 'twilio'

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const apiKey = process.env.TWILIO_API_KEY?.trim()
  const apiSecret = process.env.TWILIO_API_SECRET?.trim()

  if (!accountSid) {
    throw new Error('TWILIO_ACCOUNT_SID is required for SMS')
  }

  // Account SID from Twilio Console must start with AC (not SK).
  if (!accountSid.startsWith('AC')) {
    throw new Error(
      'TWILIO_ACCOUNT_SID must start with AC (from Twilio Console → Account info). ' +
        'You currently have an API Key (SK...). Put the AC Account SID in TWILIO_ACCOUNT_SID, ' +
        'and optionally put the SK value in TWILIO_API_KEY with TWILIO_API_SECRET.',
    )
  }

  // Preferred for API Keys: Account SID (AC) + API Key (SK) + API Secret
  if (apiKey || apiSecret) {
    if (!apiKey?.startsWith('SK') || !apiSecret) {
      throw new Error('TWILIO_API_KEY (SK...) and TWILIO_API_SECRET are both required when using API Keys')
    }
    return twilio(apiKey, apiSecret, { accountSid })
  }

  // Classic auth: Account SID (AC) + Auth Token
  if (!authToken) {
    throw new Error('TWILIO_AUTH_TOKEN is required (or set TWILIO_API_KEY + TWILIO_API_SECRET)')
  }
  return twilio(accountSid, authToken)
}

function twilioFromNumber(): string | undefined {
  const raw = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER
  if (!raw?.trim()) return undefined
  const value = raw.trim()
  // Personal Oman mobiles cannot be used as Twilio "From"
  if (value.startsWith('+968') || value.replace(/\D/g, '').startsWith('968')) return undefined
  if (!value.startsWith('+')) return `+${value.replace(/\D/g, '')}`
  return value
}

function verifyServiceSid(): string | undefined {
  return process.env.TWILIO_VERIFY_SERVICE_SID?.trim() || undefined
}

function hasTwilioCredentials(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  if (!accountSid?.startsWith('AC')) return false
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const apiKey = process.env.TWILIO_API_KEY?.trim()
  const apiSecret = process.env.TWILIO_API_SECRET?.trim()
  return Boolean(authToken || (apiKey?.startsWith('SK') && apiSecret))
}

/** True when we can deliver real SMS (Verify service or Messages From number). */
export function canSendSms(): boolean {
  if (!hasTwilioCredentials()) return false
  return Boolean(verifyServiceSid() || twilioFromNumber() || process.env.TWILIO_MESSAGING_SERVICE_SID?.trim())
}

/**
 * Sends OTP SMS to any user phone.
 * Prefers Twilio Verify (no From number needed), then Messages API.
 */
export async function sendOtpSms(phone: string, code?: string): Promise<{ sent: boolean; channel: 'sms'; provider: 'verify' | 'messages' }> {
  const client = getTwilioClient()
  const serviceSid = verifyServiceSid()

  // 1) Twilio Verify — sends SMS using Twilio's numbers (works in dev + prod)
  if (serviceSid) {
    await client.verify.v2.services(serviceSid).verifications.create({
      to: phone,
      channel: 'sms',
    })
    return { sent: true, channel: 'sms', provider: 'verify' }
  }

  // 2) Messages API — needs a Twilio-owned From number
  const from = twilioFromNumber()
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  if (!code) {
    throw new Error('OTP code is required when not using Twilio Verify')
  }
  if (!from && !messagingServiceSid) {
    throw new Error(
      'SMS not configured. Set TWILIO_VERIFY_SERVICE_SID (recommended) or TWILIO_PHONE_NUMBER (+1... from Twilio Console).',
    )
  }

  await client.messages.create({
    to: phone,
    body: `Speedy Cleaning: رمز التحقق ${code}\nYour code: ${code}`,
    ...(messagingServiceSid ? { messagingServiceSid } : { from: from! }),
  })

  return { sent: true, channel: 'sms', provider: 'messages' }
}

/** Checks OTP with Twilio Verify. */
export async function checkOtpSms(phone: string, code: string): Promise<boolean> {
  const serviceSid = verifyServiceSid()
  if (!serviceSid) return false

  const client = getTwilioClient()
  const check = await client.verify.v2.services(serviceSid).verificationChecks.create({
    to: phone,
    code,
  })
  return check.status === 'approved'
}

export function usesTwilioVerify(): boolean {
  return Boolean(hasTwilioCredentials() && verifyServiceSid())
}
