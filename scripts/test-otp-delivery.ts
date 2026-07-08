import { config } from 'dotenv'
import { resolve } from 'path'
import { sendOtpSms } from '../lib/auth/sms'

config({ path: resolve(process.cwd(), '.env.local'), override: true })

sendOtpSms('+96877222432', '654321')
  .then((r) => console.log('Result:', r))
  .catch((e) => console.error('Error:', e.message))
