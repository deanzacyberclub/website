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

    // Get geolocation data from IP
    const geoData = await getGeoLocation(ip)

    if (type === 'page_view') {
      await updateStats(botToken)
      const embed = buildVisitorEmbed(ip, visitorData, geoData, 'New Visitor')
      await sendEmbed(botToken, embed)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }

    if (type === 'chat_opened') {
      const embed = buildVisitorEmbed(ip, visitorData, geoData, 'Chat Session Started')
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

async function getGeoLocation(ip) {
  // Default empty geo data
  const defaultGeo = {
    city: null,
    region: null,
    country: null,
    countryCode: null,
    isp: null,
    org: null,
    lat: null,
    lon: null
  }

  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return defaultGeo
  }

  // Try ip-api.com first (free, no API key, 45 req/min)
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,isp,org,lat,lon`, {
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success') {
        return {
          city: data.city,
          region: data.regionName,
          country: data.country,
          countryCode: data.countryCode,
          isp: data.isp,
          org: data.org,
          lat: data.lat,
          lon: data.lon
        }
      }
    }
  } catch (e) {
    console.error('ip-api.com failed:', e.message)
  }

  // Fallback to ipapi.co (free tier, 1000 req/day)
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000)
    })
    if (response.ok) {
      const data = await response.json()
      if (!data.error) {
        return {
          city: data.city,
          region: data.region,
          country: data.country_name,
          countryCode: data.country_code,
          isp: data.org,
          org: data.org,
          lat: data.latitude,
          lon: data.longitude
        }
      }
    }
  } catch (e) {
    console.error('ipapi.co failed:', e.message)
  }

  return defaultGeo
}

function buildVisitorEmbed(ip, data = {}, geo = {}, title = 'New Visitor') {
  const timestamp = new Date().toISOString()

  // Build location string
  let locationStr = 'Unknown'
  if (geo.city || geo.region || geo.country) {
    const parts = [geo.city, geo.region, geo.country].filter(Boolean)
    locationStr = parts.join(', ')
    if (geo.countryCode) {
      locationStr += ` :flag_${geo.countryCode.toLowerCase()}:`
    }
  }

  const fields = [
    { name: 'IP Address', value: `\`${ip || 'Unknown'}\``, inline: true },
    { name: 'Location', value: locationStr, inline: true },
    { name: 'ISP / Org', value: geo.isp || geo.org || 'Unknown', inline: true },
    { name: 'Timezone', value: data.timezone || 'Unknown', inline: true },
    { name: 'Language', value: data.language || 'Unknown', inline: true },
    { name: 'Platform', value: data.platform || 'Unknown', inline: true },
    { name: 'Screen Resolution', value: data.screen || 'Unknown', inline: true },
    { name: 'Viewport Size', value: data.viewportSize || 'Unknown', inline: true },
    { name: 'CPU Cores', value: data.hardwareConcurrency?.toString() || 'Unknown', inline: true },
    { name: 'Device Memory', value: data.deviceMemory ? `${data.deviceMemory} GB` : 'Unknown', inline: true },
    { name: 'Touch Support', value: data.touchSupport ? `Yes (${data.maxTouchPoints} points)` : 'No', inline: true },
    { name: 'Connection Type', value: data.connectionType || 'Unknown', inline: true },
    { name: 'Referrer', value: data.referrer || 'Direct', inline: false },
    { name: 'Page URL', value: data.pageUrl || 'Unknown', inline: false },
  ]

  // Add coordinates if available
  if (geo.lat && geo.lon) {
    fields.push({
      name: 'Coordinates',
      value: `[${geo.lat}, ${geo.lon}](https://www.google.com/maps?q=${geo.lat},${geo.lon})`,
      inline: false
    })
  }

  if (data.userAgent) {
    const browserInfo = parseUserAgent(data.userAgent)
    fields.push({ name: 'Browser Info', value: browserInfo, inline: false })
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
