/**
 * DEPRECATED for OTP.
 * Email OTP must use Neon built-in mailer: `npm run setup:neon-otp`
 *
 * This script previously pointed Neon send.otp → Resend. Do not use for OTP.
 */
console.error(`
OTP delivery is Neon-only now.

  npm run setup:neon-otp

That enables Neon's shared email (auth@mail.myneon.app) and disables the send.otp webhook.
Resend is optional later for admin outreach / order emails — not for signup OTP.
`)
process.exit(1)
