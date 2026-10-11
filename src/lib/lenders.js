// Mortgage servicer customer-service numbers, for the Financial tab.
//
// Every number below was read off the lender's own official website (the page in
// `page`), not a third-party directory. Phone numbers change — the statement a
// homeowner receives is always the final word, and the UI says so.
//
// { name, aliases (lower-case fragments to recognise typed names), phone, label, hours, page }

export const LENDER_DIRECTORY = [
  { name: 'Wells Fargo', aliases: ['wells fargo', 'wellsfargo', 'wells'],
    phone: '1-800-357-6675', label: 'Home Mortgage Customer Service (also 1-866-234-8271)',
    hours: 'Mon–Fri 7 am–10 pm CT · Sat 8 am–2 pm CT', page: 'https://www.wellsfargo.com/help/contact-us/' },
  { name: 'Chase', aliases: ['chase', 'jpmorgan', 'jp morgan'],
    phone: '1-800-848-9136', label: 'Chase Home Lending customer service',
    hours: 'Mon–Fri 8 am–8 pm ET · Sat 9 am–6 pm ET', page: 'https://www.chase.com/personal/mortgage/mortgage-contact-us' },
  { name: 'Bank of America', aliases: ['bank of america', 'bofa', 'boa', 'bankofamerica', 'countrywide'],
    phone: '800-669-6607', label: 'Existing mortgages',
    hours: 'Mon–Fri 8 am–9 pm ET', page: 'https://www.bankofamerica.com/customer-service/contact-us/mortgage-home-equity/' },
  { name: 'U.S. Bank', aliases: ['u.s. bank', 'us bank', 'usbank', 'u s bank'],
    phone: '800-365-7772', label: 'Mortgage questions & payoff quotes (existing loans)',
    hours: 'Mon–Fri 7 am–8 pm CT · Sat 8 am–2 pm CT', page: 'https://www.usbank.com/customer-service/personal-banking/home-loans.html' },
  { name: 'Rocket Mortgage', aliases: ['rocket', 'quicken'],
    phone: '(800) 4-ROCKET', label: 'Client Support — existing servicing customers',
    hours: 'Mon–Fri 8:30 am–9 pm ET · Sat 9 am–4 pm ET', page: 'https://www.rocketmortgage.com/contact-us' },
  { name: 'Mr. Cooper', aliases: ['mr. cooper', 'mr cooper', 'mrcooper', 'nationstar'],
    phone: '(800) 4-ROCKET', label: 'Mr. Cooper loans are now serviced by Rocket Mortgage',
    hours: 'Mon–Fri 8:30 am–9 pm ET · Sat 9 am–4 pm ET', page: 'https://www.rocketmortgage.com/contact-us' },
  { name: 'PennyMac', aliases: ['pennymac', 'penny mac'],
    phone: '800-777-4001', label: 'Existing loan — customer service',
    hours: 'Mon–Fri 5 am–6 pm PT · Sat 7–11 am PT', page: 'https://www.pennymac.com/contact-us' },
  { name: 'Citi', aliases: ['citi', 'citimortgage', 'cenlar'],
    phone: '1-855-839-6253', label: 'Cenlar FSB — Citi’s loan servicing partner',
    hours: 'Mon–Fri 8:30 am–8 pm ET · Sat 9 am–5 pm ET', page: 'https://www.citi.com/mortgage/manage-your-mortgage' },
  { name: 'Truist', aliases: ['truist', 'suntrust', 'bb&t', 'bbt'],
    phone: '855-257-4040', label: 'Manage an existing mortgage',
    hours: '', page: 'https://www.truist.com/contact' },
  { name: 'PNC', aliases: ['pnc'],
    phone: '1-800-822-5626', label: 'Current mortgage customers (automated 24/7; representatives during business hours)',
    hours: 'Reps Mon–Fri 8 am–9 pm ET · Sat–Sun 8 am–5 pm ET', page: 'https://www.pnc.com/en/customer-service/mortgage-customer-service.html' },
  { name: 'Fifth Third', aliases: ['fifth third', '5/3', '53 bank'],
    phone: '1-800-972-3030', label: 'Mortgage customer support',
    hours: 'Mon–Fri 8 am–6 pm ET', page: 'https://www.53.com/content/fifth-third/en/customer-service.html' },
  { name: 'Regions', aliases: ['regions'],
    phone: '1-800-986-2462', label: 'Regions Mortgage customer service',
    hours: '', page: 'https://www.regions.com/help/contact-us-by-phone' },
  { name: 'Navy Federal', aliases: ['navy federal', 'navy fed', 'nfcu'],
    phone: '1-888-842-6328', label: 'Mortgage servicing (say “Mortgage” at the prompt)',
    hours: '7 am–midnight Mon–Sat · noon–midnight Sun (ET)', page: 'https://www.navyfederal.org/contact-us/phone-numbers.html' },
  { name: 'USAA', aliases: ['usaa'],
    phone: '855-430-8489', label: 'Mortgage servicing (Nationstar / Mr. Cooper line on USAA’s support page)',
    hours: 'Mon–Fri 7 am–7 pm CT · Sat 7 am–3 pm CT', page: 'https://www.usaa.com/support/' },
  { name: 'Freedom Mortgage', aliases: ['freedom'],
    phone: '855-690-5900', label: 'Existing-loan customer service',
    hours: 'Mon–Fri 8 am–8 pm ET · Sat 9 am–2 pm ET', page: 'https://www.freedommortgage.com/contact' },
  { name: 'Newrez / Shellpoint', aliases: ['newrez', 'shellpoint', 'caliber'],
    phone: '1-800-365-7107', label: 'Shellpoint Mortgage Servicing — Customer Care (Newrez: 866-317-2347)',
    hours: 'Mon–Fri 8 am–9 pm ET · Sat 10 am–2 pm ET', page: 'https://www.shellpointmtg.com/contact-us' },
  { name: 'Lakeview Loan Servicing', aliases: ['lakeview'],
    phone: '(855) 294-8564', label: 'Customer care team (check your statement — sub-servicer numbers differ)',
    hours: 'Mon–Thu 8 am–9 pm ET · Fri 8 am–8 pm ET · Sat 10 am–2 pm ET', page: 'https://lakeview.com/contact-us/' },
  { name: 'Carrington Mortgage', aliases: ['carrington'],
    phone: '(800) 561-4567', label: 'Customer service',
    hours: 'Mon–Fri 8 am–9 pm ET', page: 'https://www.carringtonmortgage.com/contact-us' },
  { name: 'Flagstar', aliases: ['flagstar'],
    phone: '800-968-7700', label: 'MyLoans support (servicing now handled by Mr. Cooper / Rocket)',
    hours: '', page: 'https://www.flagstar.com/personal/help/home-loans-support.html' },
  { name: 'Guild Mortgage', aliases: ['guild'],
    phone: '800-365-4441', label: 'Loan servicing help',
    hours: 'Mon–Fri 5 am–5 pm PT', page: 'https://www.guildmortgage.com/help-center/' },
  { name: 'loanDepot', aliases: ['loandepot', 'loan depot'],
    phone: '(866) 258-6572', label: 'Customer service — existing loans',
    hours: 'Mon–Fri 7 am–7 pm CT · Sat 8 am–5 pm CT', page: 'https://www.loandepot.com/about/contactus' },
  { name: 'Onity (Ocwen / PHH)', aliases: ['onity', 'ocwen', 'phh'],
    phone: '1-800-449-8767', label: 'General servicing inquiries',
    hours: 'Mon–Fri 8 am–9 pm ET · Sat 8 am–5 pm ET', page: 'https://www.onitymortgage.com/support/contact-us' },
  { name: 'Cardinal Financial', aliases: ['cardinal', 'servicemac'],
    phone: '(855) 416-8962', label: 'Loan servicer ServiceMac, LLC',
    hours: 'Mon–Fri 8:30 am–8 pm ET', page: 'https://www.cardinalfinancial.com/contact-us/' },
  { name: 'Veterans United', aliases: ['veterans united', 'veteransunited'],
    phone: '1-855-217-0772', label: 'Mortgage servicing',
    hours: '', page: 'https://www.veteransunited.com/contact/' },
  { name: 'Fairway Mortgage', aliases: ['fairway'],
    phone: '(800) 201-7544', label: 'Customer Experience — loan servicing',
    hours: 'Mon–Fri 8:30 am–5 pm CT', page: 'https://www.fairway.com/contact-us/contact-us' },
]

export const LENDER_NAMES = LENDER_DIRECTORY.map((l) => l.name)

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9&./ ]+/g, ' ').replace(/\s+/g, ' ').trim()
const digits = (s) => String(s || '').replace(/\D/g, '')

// Exact name first, then an alias appearing in what was typed.
export function findLender(typed) {
  const t = clean(typed)
  if (t.length < 2) return null
  const exact = LENDER_DIRECTORY.find((l) => clean(l.name) === t)
  if (exact) return exact
  let best = null
  for (const l of LENDER_DIRECTORY) {
    for (const a of l.aliases) {
      const hit = t === a || (a.length >= 4 && t.includes(a)) || (t.length >= 4 && a.startsWith(t))
      if (hit && (!best || a.length > best.len)) best = { l, len: a.length }
    }
  }
  return best ? best.l : null
}

// True when a phone value is one of ours (so switching lenders may replace it,
// but a number the person typed themselves is never overwritten).
export function isDirectoryPhone(value) {
  const d = digits(value)
  if (!d) return false
  return LENDER_DIRECTORY.some((l) => {
    const m = l.phone.replace('(800) 4-ROCKET', '800-476-2538')
    return digits(m) === d || digits(l.phone) === d
  })
}
