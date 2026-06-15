// Almacenamiento offline para paginas y su contenido
const PAGES_KEY = 'amor_local_pages'
const PAGE_DATA_KEY = (id) => `amor_page_data_${id}`

export function getLocalPages(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(PAGES_KEY) || '{}')
    return all[userId] || []
  } catch {
    return []
  }
}

export function saveLocalPage(userId, page) {
  try {
    const all = JSON.parse(localStorage.getItem(PAGES_KEY) || '{}')
    all[userId] = all[userId] || []
    const idx = all[userId].findIndex(p => p.id === page.id)
    if (idx >= 0) {
      all[userId][idx] = page
    } else {
      all[userId].unshift(page)
    }
    localStorage.setItem(PAGES_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('Error guardando pagina local:', e)
  }
}

export function getLocalPageData(pageId) {
  try {
    return JSON.parse(localStorage.getItem(PAGE_DATA_KEY(pageId)) || '{}')
  } catch {
    return {}
  }
}

export function saveLocalPageData(pageId, data) {
  try {
    localStorage.setItem(PAGE_DATA_KEY(pageId), JSON.stringify(data))
  } catch (e) {
    console.error('Error guardando datos locales:', e)
  }
}

export function generateLocalSlug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'amor'
}

export function fetchWithTimeout(url, options = {}, ms = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}
