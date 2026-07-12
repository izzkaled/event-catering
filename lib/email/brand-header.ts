export function emailLogoHtml(siteUrl: string) {
  const url = siteUrl.replace(/\/$/, '')
  return `
    <div style="text-align:center;margin-bottom:20px">
      <img src="${url}/logo.png" alt="Speedy Cleaning" width="120" height="120" style="border-radius:12px;display:inline-block" />
      <p style="margin:8px 0 0;font-size:13px;color:#64748b;font-weight:600">Speedy Cleaning · Clean Plus</p>
    </div>
  `
}
