import { sql } from 'drizzle-orm'
import { orders } from '@/lib/db/schema'

/** Admin payment list/detail fields — excludes large receipt blobs from list payloads. */
export const adminPaymentSelect = {
  id: orders.id,
  order_number: orders.order_number,
  customer_name: orders.customer_name,
  customer_phone: orders.customer_phone,
  price_omr: orders.price_omr,
  payment_method: orders.payment_method,
  payment_status: orders.payment_status,
  paymob_transaction_id: orders.paymob_transaction_id,
  payment_reference: orders.payment_reference,
  paid_at: orders.paid_at,
  created_at: orders.created_at,
  refund_status: orders.refund_status,
  refund_amount_omr: orders.refund_amount_omr,
  hasReceipt: sql<boolean>`(${orders.transfer_receipt_url} is not null)`.as('has_receipt'),
}

export type AdminPaymentRow = {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  price_omr: string
  payment_method: string
  payment_status: string
  paymob_transaction_id: string | null
  payment_reference: string | null
  paid_at: Date | null
  created_at: Date | null
  refund_status: string | null
  refund_amount_omr: string | null
  hasReceipt: boolean
}
