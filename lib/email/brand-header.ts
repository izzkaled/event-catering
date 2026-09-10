export function emailLogoHtml(siteUrl: string) {
  const url = siteUrl.replace(/\/$/, '')
  return `
    <div style="text-align:center;margin-bottom:20px">
      <img src="${url}/images/brand/logo-full.webp" alt="Event Catering" width="180" height="72" style="display:inline-block" />
    </div>
  `
}
