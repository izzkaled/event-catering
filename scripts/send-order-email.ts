import { sendOrderConfirmation } from '../lib/email/send-order-confirmation'

async function main() {
  const orderId = process.argv[2] || '7761cbf1-8ec5-4914-8e36-f46d65f3de56'
  const result = await sendOrderConfirmation({ orderId, event: 'created' })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
