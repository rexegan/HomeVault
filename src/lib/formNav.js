// Moving between boxes: Tab / Shift+Tab and Return / "Next" step through every
// field in order — text boxes, drop-downs and date boxes alike — even where the
// iPad's keyboard would normally skip drop-downs. One listener covers every form
// and pop-up in the app.

const CONTROL = 'input:not([type=hidden]):not([type=file]):not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
const FIELD = 'input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled])'
const TEXTISH = 'input:not([type]), input[type=text], input[type=search], input[type=tel], input[type=email], input[type=url], input[type=number]'

const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
const scopeOf = (el) => el.closest('.sheet') || document.querySelector('.content') || document.body

function focusEl(el) {
  el.focus({ preventScroll: true })
  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }) } catch { /* ignore */ }
  if (el.matches(TEXTISH) && typeof el.select === 'function') { try { el.select() } catch { /* ignore */ } }
}

function onKey(e) {
  if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return
  const el = e.target
  if (!(el instanceof HTMLElement)) return
  const isField = el.matches('input, select, textarea') && !el.matches('[type=file], [type=hidden]')
  const inSheet = !!el.closest('.sheet')

  if (e.key === 'Tab' && (isField || inSheet)) {
    const list = [...scopeOf(el).querySelectorAll(CONTROL)].filter(visible)
    const i = list.indexOf(el)
    if (i < 0) return
    let next = list[i + (e.shiftKey ? -1 : 1)]
    // A pop-up keeps focus inside itself: wrap from the last control to the first.
    if (!next && inSheet) next = e.shiftKey ? list[list.length - 1] : list[0]
    if (!next) return                      // at either end of a page: let the browser carry on
    e.preventDefault()
    focusEl(next)
    return
  }

  if (!isField) return

  if (e.key === 'Enter') {
    // Leave Return alone where it already does something: forms, search boxes, text areas, checkboxes, drop-downs.
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.matches('[type=checkbox], [type=radio], [type=submit], [type=button]')) return
    if (el.closest('form, .hw-search, .wx-city, [data-enter-own]')) return
    const fields = [...scopeOf(el).querySelectorAll(FIELD)].filter(visible)
    const i = fields.indexOf(el)
    if (i < 0) return
    e.preventDefault()
    const next = fields[i + 1]
    if (next) focusEl(next)
    else el.blur()                          // last box: put the keyboard away
  }
}

// Make the iPad keyboard's Return key say "Next" (or "Done" on the last box).
function onFocus(e) {
  const el = e.target
  if (!(el instanceof HTMLElement) || !el.matches(TEXTISH) || el.closest('form, .hw-search, .wx-city, [data-enter-own]')) return
  const fields = [...scopeOf(el).querySelectorAll(FIELD)].filter(visible)
  el.setAttribute('enterkeyhint', fields.indexOf(el) === fields.length - 1 ? 'done' : 'next')
}

export function installFormNav() {
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('focusin', onFocus, true)
  return () => {
    document.removeEventListener('keydown', onKey, true)
    document.removeEventListener('focusin', onFocus, true)
  }
}
