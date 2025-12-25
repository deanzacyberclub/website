export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return { statusCode: 500, body: 'Webhook not configured' }
  }

  try {
    const { message } = JSON.parse(event.body)

    if (!message) {
      return { statusCode: 400, body: 'Missing message' }
    }

    if (message.length > 500) {
      return { statusCode: 400, body: 'Message too long (max 500 characters)' }
    }

    const { name } = JSON.parse(event.body)
    const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               event.headers['client-ip'] ||
               'unknown'
    const displayName = name?.trim() || `visitor`

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `[${displayName} - ${ip}]: ${message}`,
        allowed_mentions: { parse: [] }
      })
    })

    if (!response.ok) {
      throw new Error('Discord API error')
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return { statusCode: 500, body: 'Failed to send message' }
  }
}
