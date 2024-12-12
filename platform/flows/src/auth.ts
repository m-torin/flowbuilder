import 'next-auth/jwt';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prismaEdge } from './lib/prisma/edgeClient';

import type { NextAuthConfig } from 'next-auth';

export const config = {
  theme: { logo: 'https://authjs.dev/img/logo-sm.png' },
  adapter: PrismaAdapter(prismaEdge),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  basePath: '/auth',
  session: { strategy: 'jwt' },
  callbacks: {
    // authorized({ request, auth }) {
    //   const { pathname } = request.nextUrl;
    //   if (pathname === '/middleware-example') return !!auth;
    //   return true;
    // },
    authorized({ request, auth }) {
      // Get the pathname from the request URL
      const { pathname } = request.nextUrl;

      // Allow all routes by default
      return true;

      // Or if you want to protect specific routes:
      // const protectedPaths = ['/middleware-example', '/api/protected'];
      // return !protectedPaths.includes(pathname) || !!auth;
    },
    jwt({ token, trigger, session, account }) {
      if (trigger === 'update') token.name = session.user.name;
      if (account?.provider === 'github') {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        domain: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      },
    },
  },
  debug: process.env.NODE_ENV !== 'production',
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
}
