async function main() {
  const phone = '77222432'
  const send = await fetch('http://localhost:3000/api/phone/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const s = (await send.json()) as { previewOtp?: string; channel?: string }
  console.log('send', send.status, s.channel, s.previewOtp)

  const verify = await fetch('http://localhost:3000/api/phone/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: s.previewOtp, name: 'Test User' }),
  })
  const setCookie = verify.headers.getSetCookie?.() || []
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
  const v = (await verify.json()) as { user?: { phone?: string; name?: string; role?: string } }
  console.log('verify', verify.status, v.user?.phone, v.user?.name, v.user?.role)
  console.log('cookie', cookie ? 'set' : 'missing')

  const profile = await fetch('http://localhost:3000/api/profile', {
    headers: { cookie },
  })
  const p = (await profile.json()) as {
    user?: { phone?: string; name?: string; source?: string }
  }
  console.log('profile', profile.status, p.user?.phone, p.user?.name, p.user?.source)

  const patch = await fetch('http://localhost:3000/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ area: 'Qurum', address: 'Street 1' }),
  })
  const u = (await patch.json()) as { user?: { area?: string; address?: string } }
  console.log('patch', patch.status, u.user?.area, u.user?.address)

  const profile2 = await fetch('http://localhost:3000/api/profile', {
    headers: { cookie },
  })
  const p2 = (await profile2.json()) as {
    user?: { area?: string; address?: string; phone?: string; name?: string }
  }
  console.log('reload', profile2.status, p2.user?.name, p2.user?.phone, p2.user?.area, p2.user?.address)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
