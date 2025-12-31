const TRACKING_CHANNEL_ID = '1127840971053350925'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const botToken = process.env.DISCORD_BOT_TOKEN
  if (!botToken) {
    return { statusCode: 500, body: 'Bot token not configured' }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { type, visitorData } = body

    const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               event.headers['client-ip'] ||
               'unknown'

    if (type === 'page_view') {
      await updateStats(botToken)
      const embed = buildVisitorEmbed(ip, visitorData, 'New Visitor')
      await sendEmbed(botToken, embed)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    if (type === 'chat_opened') {
      const embed = buildVisitorEmbed(ip, visitorData, 'Chat Session Started')
      await sendEmbed(botToken, embed)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    return { statusCode: 400, body: 'Invalid type' }
  } catch (error) {
    console.error('Track visit error:', error)
    return { statusCode: 500, body: 'Failed to track visit' }
  }
}

function buildVisitorEmbed(ip, data = {}, title = 'New Visitor') {
  const timestamp = new Date().toISOString()

  const fields = [
    { name: 'IP Address', value: `\`${ip || 'Unknown'}\``, inline: true },
    { name: 'Timezone', value: data.timezone || 'Unknown', inline: true },
    { name: 'Language', value: data.language || 'Unknown', inline: true },
    { name: 'Screen Resolution', value: data.screen || 'Unknown', inline: true },
    { name: 'Viewport Size', value: data.viewportSize || 'Unknown', inline: true },
    { name: 'Device Pixel Ratio', value: data.devicePixelRatio?.toString() || 'Unknown', inline: true },
    { name: 'Platform', value: data.platform || 'Unknown', inline: true },
    { name: 'CPU Cores', value: data.hardwareConcurrency?.toString() || 'Unknown', inline: true },
    { name: 'Device Memory', value: data.deviceMemory ? `${data.deviceMemory} GB` : 'Unknown', inline: true },
    { name: 'Color Depth', value: data.colorDepth ? `${data.colorDepth}-bit` : 'Unknown', inline: true },
    { name: 'Touch Support', value: data.touchSupport ? `Yes (${data.maxTouchPoints} points)` : 'No', inline: true },
    { name: 'Connection Type', value: data.connectionType || 'Unknown', inline: true },
    { name: 'Cookies Enabled', value: data.cookiesEnabled ? 'Yes' : 'No', inline: true },
    { name: 'Do Not Track', value: data.doNotTrack || 'Not set', inline: true },
    { name: 'Online Status', value: data.online ? 'Online' : 'Offline', inline: true },
    { name: 'Referrer', value: data.referrer || 'Direct', inline: false },
    { name: 'Page URL', value: data.pageUrl || 'Unknown', inline: false },
  ]

  if (data.userAgent) {
    const browserInfo = parseUserAgent(data.userAgent)
    fields.push({ name: 'Browser Info', value: browserInfo, inline: false })
    fields.push({ name: 'Full User Agent', value: `\`\`\`${data.userAgent.substring(0, 1000)}\`\`\``, inline: false })
  }

  const color = title === 'New Visitor' ? 0x00ff41 : 0x10b981

  return {
    title: `${title}`,
    color,
    fields,
    timestamp,
    footer: { text: 'DACC Website Tracker' }
  }
}

function parseUserAgent(ua) {
  if (!ua) return 'Unknown'

  let browser = 'Unknown'
  let version = ''
  let os = 'Unknown'

  // Detect browser
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
    version = ua.match(/Firefox\/(\d+)/)?.[1] || ''
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
    version = ua.match(/Edg\/(\d+)/)?.[1] || ''
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome'
    version = ua.match(/Chrome\/(\d+)/)?.[1] || ''
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari'
    version = ua.match(/Version\/(\d+)/)?.[1] || ''
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    browser = 'Opera'
    version = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || ''
  }

  // Detect OS
  if (ua.includes('Windows NT 10')) os = 'Windows 10/11'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8'
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7'
  else if (ua.includes('Mac OS X')) {
    const macVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.')
    os = macVersion ? `macOS ${macVersion}` : 'macOS'
  }
  else if (ua.includes('iPhone')) os = 'iOS (iPhone)'
  else if (ua.includes('iPad')) os = 'iOS (iPad)'
  else if (ua.includes('Android')) {
    const androidVersion = ua.match(/Android (\d+\.?\d*)/)?.[1]
    os = androidVersion ? `Android ${androidVersion}` : 'Android'
  }
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('CrOS')) os = 'Chrome OS'

  // Detect device type
  let device = 'Desktop'
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) device = 'Mobile'
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet'

  return `${browser}${version ? ' ' + version : ''} on ${os} (${device})`
}

async function sendEmbed(botToken, embed) {
  const response = await fetch(`https://discord.com/api/v10/channels/${TRACKING_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ embeds: [embed] })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Discord API error: ${error}`)
  }
}

async function updateStats(botToken) {
  const statsMessageId = process.env.DISCORD_STATS_MESSAGE_ID

  if (!statsMessageId) {
    return
  }

  const getResponse = await fetch(
    `https://discord.com/api/v10/channels/${TRACKING_CHANNEL_ID}/messages/${statsMessageId}`,
    {
      headers: { 'Authorization': `Bot ${botToken}` }
    }
  )

  if (!getResponse.ok) {
    const errorText = await getResponse.text()
    throw new Error(`Failed to fetch stats: ${errorText}`)
  }

  const message = await getResponse.json()
  const content = message.content

  const todayMatch = content.match(/Today:\*\* (\d+)/)
  const totalMatch = content.match(/Total:\*\* (\d+)/)
  const lastResetMatch = content.match(/Last Reset:\*\* (\d{4}-\d{2}-\d{2})/)

  let todayCount = todayMatch ? parseInt(todayMatch[1]) : 0
  let totalCount = totalMatch ? parseInt(totalMatch[1]) : 0
  const lastReset = lastResetMatch ? lastResetMatch[1] : null

  const today = new Date().toISOString().split('T')[0]

  if (lastReset !== today) {
    todayCount = 0
  }

  todayCount++
  totalCount++

  const updatedContent = buildStatsMessage(todayCount, totalCount, today)

  const editResponse = await fetch(
    `https://discord.com/api/v10/channels/${TRACKING_CHANNEL_ID}/messages/${statsMessageId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: updatedContent })
    }
  )

  if (!editResponse.ok) {
    const errorText = await editResponse.text()
    throw new Error(`Failed to edit stats: ${errorText}`)
  }
}

function buildStatsMessage(today, total, resetDate) {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'short',
    timeStyle: 'short'
  })

  return `**DACC Website Stats**
---
**Today:** ${today} visitors
**Total:** ${total} visitors
**Last Reset:** ${resetDate}
**Last Updated:** ${now} PST`
}
