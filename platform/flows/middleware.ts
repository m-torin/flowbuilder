import { auth } from '@/src/auth';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { parse } from '#/lib/utils';

// Environment variables
const NODE_ENV = process.env.NODE_ENV!;
const NEXT_PUBLIC_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
const NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX =
  process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX;
const VALID_SUBDOMAINS = (process.env.VALID_SUBDOMAINS || 'demo').split(',');

const isProduction = NODE_ENV === 'production';
const authPages = [
  'login',
  'logout',
  'signup',
  'forgot-password',
  'reset-password',
];

// Utility functions
const serveFourOhFour = (req: NextRequest) => {
  return NextResponse.rewrite(new URL('/404', req.url), { status: 404 });
};

const rewriteUrl = (prefix: string, path: string, req: NextRequest) => {
  return NextResponse.rewrite(
    new URL(`${prefix}${path === '/' ? '' : path}`, req.url),
  );
};

// Matcher configuration - exclude specific paths from middleware processing
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api/ routes
     * 2. /_next/ (Next.js internals)
     * 3. /_proxy/ (special page for OG tags proxying)
     * 4. /_static (inside /public)
     * 5. /_vercel (Vercel internals)
     * 6. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
     */
    '/((?!api/|_next/|_proxy/|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

// Main middleware function
export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const { domain, path, key } = parse(req);
  const isAuthPage = authPages.some((page) => path === `/${page}`);
  const url = req.nextUrl;
  const searchParams = req.nextUrl.searchParams.toString();

  // Get hostname directly from request headers
  let hostname = req.headers.get('host')!;

  // Handle Vercel preview deployment URLs
  if (
    hostname.includes('---') &&
    hostname.endsWith(`.${NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split('---')[0]}.${NEXT_PUBLIC_ROOT_DOMAIN}`;
  }

  // Debug logging
  // console.log('middleware', {
  //   hostname,
  //   searchParams,
  //   domain,
  //   url,
  //   key,
  //   isProduction,
  //   isAuthPage,
  //   fullUrl: req.url,
  //   host: req.headers.get('host'),
  //   path,
  // });

  // Root domain handling
  if (hostname === NEXT_PUBLIC_ROOT_DOMAIN) {
    if (isAuthPage) {
      return serveFourOhFour(req);
    }
    return NextResponse.rewrite(
      new URL(`/home${path === '/' ? '' : path}`, req.url),
    );
  }

  // ETL Better With domain handling
  if (hostname === `etl-better-with.${NEXT_PUBLIC_ROOT_DOMAIN}`) {
    if (isAuthPage) {
      return serveFourOhFour(req);
    }
    return NextResponse.rewrite(
      new URL(`/etl-better-with${path === '/' ? '' : path}`, req.url),
    );
  }

  // Special domain mappings
  const hostMappings = {
    [`api.${NEXT_PUBLIC_ROOT_DOMAIN}`]: '/api',
    [`auth.${NEXT_PUBLIC_ROOT_DOMAIN}`]: '/auth',
    [`events.${NEXT_PUBLIC_ROOT_DOMAIN}`]: '/events',
    [`my.${NEXT_PUBLIC_ROOT_DOMAIN}`]: '/my',
  };

  if (hostMappings[hostname]) {
    if (hostname === `my.${NEXT_PUBLIC_ROOT_DOMAIN}`) {
      if (path === '/' || path === '') {
        return NextResponse.redirect(new URL('/profile', req.url));
      }
    }
    return rewriteUrl(hostMappings[hostname], path, req);
  }

  // About page redirect
  if (hostname === `about.${NEXT_PUBLIC_ROOT_DOMAIN}`) {
    return NextResponse.redirect(
      'https://vercel.com/blog/platforms-starter-kit',
    );
  }

  // Auth subdomain handling
  if (hostname === `auth.${NEXT_PUBLIC_ROOT_DOMAIN}`) {
    console.log('is auth subdomain');
  }

  // Subdomain handling
  const subdomain = hostname.replace(`.${NEXT_PUBLIC_ROOT_DOMAIN}`, '');
  const subdomainExists = VALID_SUBDOMAINS.includes(subdomain);

  // console.log({
  //   processedHostname: hostname,
  //   subdomain,
  //   subdomainExists,
  //   path,
  // });

  if (subdomainExists) {
    // Rewrite to the subdomain route with the full path
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
  }

  // Fallback for unknown routes
  return serveFourOhFour(req);
}

// Export with auth wrapper
// export default auth((req) => {
//   return middleware(req, {} as NextFetchEvent);
// }) as any;
