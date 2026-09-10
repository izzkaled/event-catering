/**
 * DEPRECATED for OTP — do not point send.otp at this app.
 * Use Neon built-in email: npm run setup:neon-otp
 */
console.error(`
Do not enable Neon send.otp webhook for this project.

OTP is delivered by Neon Auth shared email (auth@mail.myneon.app).
Run: npm run setup:neon-otp
`)
process.exit(1)
