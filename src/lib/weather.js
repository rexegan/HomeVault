// Weather for the home: Open-Meteo (free, no account) gives a 16-day daily
// forecast for the home's coordinates. The same data drives "weather care" —
// alerts like "freeze Thursday: cover the faucets tonight."

export async function fetchForecast(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat}&longitude=${lon}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,' +
    'precipitation_probability_max,precipitation_sum,precipitation_hours,' +
    'relative_humidity_2m_mean,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset' +
    '&hourly=temperature_2m,precipitation_probability,weather_code' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch' +
    '&timezone=auto&forecast_days=16'
  const res = await fetch(url)
  if (!res.ok) throw new Error('forecast ' + res.status)
  const js = await res.json()
  const d = js.daily
  const clock = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase().replace(' ', '') : ''
  // Group hourly data by date for the per-day hourly breakdown.
  const hoursByDate = {}
  const h = js.hourly
  if (h?.time) {
    h.time.forEach((iso, i) => {
      const date = iso.slice(0, 10)
      const hr = parseInt(iso.slice(11, 13), 10)
      ;(hoursByDate[date] = hoursByDate[date] || []).push({
        label: hr === 0 ? '12a' : hr < 12 ? hr + 'a' : hr === 12 ? '12p' : (hr - 12) + 'p',
        temp: Math.round(h.temperature_2m[i]),
        rain: h.precipitation_probability?.[i] ?? 0,
        code: h.weather_code?.[i] ?? 0,
      })
    })
  }
  return d.time.map((date, i) => ({
    hours: hoursByDate[date] || [],
    date,
    code: d.weather_code[i],
    hi: Math.round(d.temperature_2m_max[i]),
    lo: Math.round(d.temperature_2m_min[i]),
    feels: Math.round(d.apparent_temperature_max?.[i] ?? d.temperature_2m_max[i]),
    rain: d.precipitation_probability_max?.[i] ?? 0,
    rainAmt: +(d.precipitation_sum?.[i] ?? 0).toFixed(2),
    rainHrs: Math.round(d.precipitation_hours?.[i] ?? 0),
    hum: Math.round(d.relative_humidity_2m_mean?.[i] ?? 0),
    wind: Math.round(d.wind_speed_10m_max[i]),
    gust: Math.round(d.wind_gusts_10m_max?.[i] ?? 0),
    uv: Math.round(d.uv_index_max?.[i] ?? 0),
    sunrise: clock(d.sunrise?.[i]),
    sunset: clock(d.sunset?.[i]),
  }))
}

const WX = [
  [[0], '☀️', 'Clear'],
  [[1, 2], '🌤️', 'Mostly sunny'],
  [[3], '☁️', 'Cloudy'],
  [[45, 48], '🌫️', 'Fog'],
  [[51, 53, 55, 56, 57], '🌦️', 'Drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', 'Rain'],
  [[71, 73, 75, 77, 85, 86], '🌨️', 'Snow'],
  [[95, 96, 99], '⛈️', 'Thunderstorms'],
]
export function wx(code) {
  for (const [codes, icon, label] of WX) if (codes.includes(code)) return { icon, label }
  return { icon: '🌡️', label: '' }
}

const dayName = (iso, i) => {
  if (i === 0) return 'Today'
  if (i === 1) return 'Tomorrow'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
export { dayName }

// Forecast-driven maintenance alerts — the "stay ahead of the weather" engine.
export function weatherAlerts(days) {
  const out = []
  const seen = new Set()
  const push = (key, sev, icon, title, detail) => {
    if (seen.has(key)) return
    seen.add(key)
    out.push({ sev, icon, title, detail })
  }
  days.slice(0, 10).forEach((d, i) => {
    const when = dayName(d.date, i)
    if (d.lo <= 25) push('hardfreeze', 'danger', '🥶', `Hard freeze ${when} (${d.lo}°)`,
      'Wrap every outdoor faucet, disconnect hoses, drip indoor taps on outside walls, open cabinets under sinks, and run the pool pump overnight.')
    else if (d.lo <= 32) push('freeze', 'danger', '❄️', `Freeze ${when} (${d.lo}°)`,
      'Cover outdoor faucets and disconnect hoses before dark. Bring in potted plants.')
    if (d.hi >= 100) push('heat', 'warn', '🔥', `Triple digits ${when} (${d.hi}°)`,
      'Water the foundation with a soaker hose in the evening, deep-water young trees, and hose dust off the A/C condenser coils.')
    if (d.rain >= 60) push('rain', 'warn', '🌧️', `Heavy rain likely ${when} (${d.rain}%)`,
      'Clear gutters, downspouts and yard drains now so water moves away from the foundation.')
    if (d.wind >= 30) push('wind', 'warn', '💨', `High wind ${when} (${d.wind} mph)`,
      'Secure patio furniture, umbrellas and the trampoline; close the pool umbrella.')
    if ([95, 96, 99].includes(d.code)) push('storm', 'warn', '⛈️', `Storms possible ${when}`,
      'Charge devices, test the generator, and park under cover if hail is mentioned.')
  })
  if (out.length === 0) out.push({
    sev: 'ok', icon: '✅', title: 'Nothing threatening in the next 10 days',
    detail: 'No freezes, triple digits, heavy rain or high wind on the horizon — a good week for the routine list below.',
  })
  return out
}

// The seasonal playbook: staying ahead of weather-driven maintenance.
export const SEASONS = [
  {
    icon: '❄️', title: 'Before a freeze', items: [
      'Wrap or cover every outdoor faucet; disconnect and drain hoses',
      'Drip indoor faucets on exterior walls overnight',
      'Open cabinet doors under sinks so warm air reaches pipes',
      'Keep the pool pump running (moving water doesn\'t freeze)',
      'Shut off and drain the sprinkler system; insulate the backflow preventer',
      'Know where your main water shut-off is before you need it',
    ],
  },
  {
    icon: '🔥', title: 'Heat & drought (Texas summers)', items: [
      'Water the foundation — soaker hose 18" from the slab, evenings, during long dry spells',
      'Deep-water trees and shrubs weekly instead of daily sprinkles',
      'Walk the sprinkler zones; fix tilted or clogged heads before the $400 water bill',
      'Rinse dust and cottonwood fluff off the A/C condenser coils',
      'Raise the mowing height — taller grass shades roots',
      'Check attic ventilation; a cooked attic ages the roof and the A/C',
    ],
  },
  {
    icon: '⛈️', title: 'Before storm & hail season', items: [
      'Clean gutters and downspouts; check they drain away from the house',
      'Trim dead limbs near the roof and power lines',
      'Secure or store anything that flies: furniture, umbrellas, trampolines',
      'Test the generator under load and top off fuel',
      'Photograph the roof and exterior now — before-and-after wins hail claims',
      'After hail: ground-level roof check, then a pro inspection if you see bruising',
    ],
  },
  {
    icon: '🍂', title: 'Fall setup', items: [
      'Gutters again after leaf drop',
      'Chimney sweep before the first fire',
      'Furnace tune-up and fresh filter before the first cold snap',
      'Replace weatherstripping on doors that show daylight',
      'Reverse ceiling fans (clockwise pushes warm air down)',
      'Fertilize the lawn — fall feeding beats spring feeding',
    ],
  },
  {
    icon: '🌱', title: 'Spring reset', items: [
      'A/C tune-up before the first 95° week books every tech in town',
      'Roof and shingle check after winter and spring storms',
      'Re-caulk windows, tubs and exterior gaps',
      'Termite inspection — spring is swarm season',
      'Clean window screens and weep holes',
      'Restart sprinklers zone by zone; watch for geysers',
    ],
  },
]
