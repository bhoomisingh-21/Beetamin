import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const r = request.nextUrl.searchParams.get('redirect_after_auth')
  if (!r || !r.startsWith('/') || r.startsWith('//')) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.searchParams.delete('redirect_after_auth')

  const res = NextResponse.redirect(url)
  res.cookies.set('redirect_after_auth', r, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
