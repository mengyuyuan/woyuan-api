import { sanitizeUrl } from '@/utils/url'

export function updateFavicon(logoUrl: string): void {
  // Use the light-backed mark for legible browser tabs in both OS themes.
  const sanitizedLogoUrl = sanitizeUrl(logoUrl === '/brand/logo.png' ? '/logo.svg' : logoUrl, {
    allowRelative: true,
    allowDataUrl: true,
  })
  if (!sanitizedLogoUrl) {
    return
  }

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  link.type = sanitizedLogoUrl.endsWith('.svg') ? 'image/svg+xml' : sanitizedLogoUrl.endsWith('.png') ? 'image/png' : 'image/x-icon'
  link.href = sanitizedLogoUrl
}
