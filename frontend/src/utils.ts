const configuredApiBase = import.meta.env.VITE_API_BASE_URL || '/api'
const backendOrigin = /^https?:\/\//i.test(configuredApiBase)
  ? configuredApiBase.replace(/\/api\/?$/, '')
  : ''

export function mediaUrl(path: string | null | undefined) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${backendOrigin}${path.startsWith('/') ? path : `/${path}`}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'ثبت نشده'
  return new Date(value).toLocaleDateString('fa-AF')
}