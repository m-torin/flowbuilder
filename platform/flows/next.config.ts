import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    prependData: `@import "./src/styles/_mantine.scss";`,
  },
  images: {
    domains: [
      'flowbuilder-demo.vercel.app',
      // Uncomment and adjust the following line if you need to use subdomains
      // ...`${process.env.VALID_SUBDOMAINS}`.split(',').map(s => `${s.trim()}.flowbuilder-demo.vercel.app`)
    ],
  },
  serverActions: {
    allowedOrigins: [
      'localhost:3000',
      '*.localhost:3000',
      '*.flowbuilder-demo.vercel.app',
      'flowbuilder-demo.vercel.app',
    ],
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
    turbo: {
      resolveAlias: {
        // Add any module resolutions here
      },
      // You can add more Turbopack-specific configurations here
    },
  },
  // Consider removing this in production to enable ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },
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
