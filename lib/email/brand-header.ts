export function emailLogoHtml(siteUrl: string) {
  const url = siteUrl.replace(/\/$/, '')
  return `
    <div style="text-align:center;margin-bottom:20px">
      <img src="${url}/logo-transparent.png" alt="KHOUSA" width="120" height="90" style="display:inline-block" />
      <p style="margin:8px 0 0;font-size:13px;color:#5c6b5e;font-weight:600;letter-spacing:0.12em">خوصة · KHOUSA Oman</p>
    </div>
  `
}
