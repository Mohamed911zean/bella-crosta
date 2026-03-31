'use server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function sendTelegramNotification(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram bot credentials not configured')
    return { success: false, error: 'Telegram not configured' }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function notifyNewOrder(orderData: {
  orderNumber: string
  customerName: string
  totalAmount: number
  items: Array<{ name: string; quantity: number }>
  deliveryAddress: string
}) {
  const itemsList = orderData.items
    .map((item) => `• ${item.name} x${item.quantity}`)
    .join('\n')

  const message = `
<b>🍕 New Order Received!</b>

<b>Order #</b> ${orderData.orderNumber}
<b>Customer:</b> ${orderData.customerName}
<b>Total:</b> $${orderData.totalAmount.toFixed(2)}

<b>Items:</b>
${itemsList}

<b>Delivery Address:</b>
${orderData.deliveryAddress}
`

  return sendTelegramNotification(message)
}

export async function notifyPaymentReceived(orderData: {
  orderNumber: string
  customerName: string
  totalAmount: number
}) {
  const message = `
<b>💰 Payment Proof Received</b>

<b>Order #</b> ${orderData.orderNumber}
<b>Customer:</b> ${orderData.customerName}
<b>Amount:</b> $${orderData.totalAmount.toFixed(2)}

Please verify the payment proof in the admin dashboard.
`

  return sendTelegramNotification(message)
}

export async function notifyPaymentConfirmed(orderData: {
  orderNumber: string
  customerName: string
  totalAmount: number
}) {
  const message = `
<b>✅ Payment Confirmed</b>

<b>Order #</b> ${orderData.orderNumber}
<b>Customer:</b> ${orderData.customerName}
<b>Amount:</b> $${orderData.totalAmount.toFixed(2)}

Order is ready to be prepared.
`

  return sendTelegramNotification(message)
}

export async function notifyOrderStatusChange(orderData: {
  orderNumber: string
  customerName: string
  status: string
}) {
  const statusEmoji: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    preparing: '👨‍🍳',
    ready: '📦',
    completed: '🎉',
    cancelled: '❌',
  }

  const emoji = statusEmoji[orderData.status] || '📌'

  const message = `
<b>${emoji} Order Status Updated</b>

<b>Order #</b> ${orderData.orderNumber}
<b>Customer:</b> ${orderData.customerName}
<b>New Status:</b> <b>${orderData.status.toUpperCase()}</b>
`

  return sendTelegramNotification(message)
}
