import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis only if env vars are present (prevents crash in local dev without Upstash)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Auth endpoints: strict
const authLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), analytics: true }) : null;
// Transaction endpoints: strict
const txLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m') }) : null;
// General API: moderate
const generalLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m') }) : null;

// Paths that do not require authentication
const PUBLIC_PATHS = [
  '/',
  '/find-tickets',
  '/how-it-works',
  '/safety-guidelines',
  '/about-us',
  '/contact-us',
  '/terms-of-service',
  '/refund-policy',
  '/privacy-policy',
  '/faqs',
  '/user/login',
  '/user/register',
  '/user/forget-password',
  '/admin/login',
  '/install',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Expose Next.js assets & API public routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if route is explicitly public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`));
  const isApiRoute = pathname.startsWith('/api/');

  // 0. Rate Limiting for API Routes at Edge level
  if (isApiRoute && redis) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
    let rlResult;

    if (pathname.startsWith('/api/auth/')) {
       rlResult = await authLimiter?.limit(`auth_${ip}`);
    } else if (pathname.startsWith('/api/transactions/') || pathname.startsWith('/api/payments/')) {
       rlResult = await txLimiter?.limit(`tx_${ip}`);
    } else {
       rlResult = await generalLimiter?.limit(`api_${ip}`);
    }

    if (rlResult && !rlResult.success) {
       return NextResponse.json({ error: 'Too Many Requests (Rate Limit Exceeded)' }, { status: 429 });
    }
  }

  // For APIs, let them handle their own auth logic dynamically inside the route after rate limiting
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Get token from HttpOnly cookie
  const token = request.cookies.get('auth_token')?.value;

  let session = null;
  if (token) {
    session = await verifyToken(token);
  }

  // 1. Unauthenticated users trying to access protected routes
  if (!session && !isPublicPath) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.redirect(new URL('/user/login', request.url));
  }

  // 2. Authenticated users trying to access login/register pages
  if (session && (pathname === '/user/login' || pathname === '/user/register')) {
    return NextResponse.redirect(new URL('/user', request.url));
  }

  if (session && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // 3. Authorize Role-based Access Rules (RBAC)
  if (session) {
    // 3a. User trying to access Admin
    if (pathname.startsWith('/admin') && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
       return NextResponse.redirect(new URL('/user', request.url));
    }
    // 3b. Force ID verification walls if needed inside specific modules
    // Example: Block users from '/user/listings' if not verified
    if (pathname === '/user/listings' && !session.isIdVerified) {
       return NextResponse.redirect(new URL('/user/id-verification', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
