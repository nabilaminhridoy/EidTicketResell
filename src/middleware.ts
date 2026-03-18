import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should always be accessible (even during maintenance)
const ALLOWED_ROUTES = [
  '/maintenance-mode',
  '/api',
  '/_next',
  '/favicon.png',
  '/admin', // Admin panel should be accessible
]

// Static file extensions to allow
const STATIC_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.css',
  '.js',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow static files
  if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next()
  }

  // Always allow specific routes
  if (ALLOWED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check maintenance mode
  try {
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    const response = await fetch(`${baseUrl}/api/settings/environment`, {
      cache: 'no-store',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      
      // If maintenance mode is enabled, redirect to maintenance page
      if (data.maintenanceMode) {
        // Check if this is an admin user (has admin session cookie)
        const adminSession = request.cookies.get('admin_session')?.value
        
        if (!adminSession && pathname !== '/maintenance-mode') {
          const maintenanceUrl = new URL('/maintenance-mode', request.url)
          return NextResponse.rewrite(maintenanceUrl)
        }
      }
    }
  } catch (error) {
    // If we can't check maintenance mode, allow the request through
    console.error('Error checking maintenance mode:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
