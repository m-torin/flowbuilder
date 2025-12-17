import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // SCSS utilities removed from global config due to Next.js 16 Turbopack limitations
  // The rem() function and other utilities are defined inline in files that need them
  images: {
    domains: [
      'flowbuilder-demo.vercel.app',
      // Uncomment and adjust the following line if you need to use subdomains
      // ...`${process.env.VALID_SUBDOMAINS}`.split(',').map(s => `${s.trim()}.flowbuilder-demo.vercel.app`)
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '*.localhost:3000',
        '*.flowbuilder-demo.vercel.app',
        'flowbuilder-demo.vercel.app',
      ],
    },
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  // ESLint config removed - Next.js 16 no longer supports eslint config in next.config.ts
  // Configure ESLint in .eslintrc.json or eslint.config.js instead
  async redirects() {
    return [
      {
        source: '/flow/new',
        destination: '/flows/new',
        permanent: true,
      },
      {
        source: '/flow',
        destination: '/flows',
        permanent: true,
      },
      {
        source: '/flows/:cuid((?!new$|convert$).*)',
        destination: '/flow/:cuid',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
