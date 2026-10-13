import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export const middleware = (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Never run middleware on static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  return handleAdminAuth(req);
};

function handleAdminAuth(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isLoginApi = pathname === '/api/admin/login';

  // Allow login page and login API without auth
  if (isLoginPage || isLoginApi) return NextResponse.next();

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const token = req.cookies.get('admin_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
