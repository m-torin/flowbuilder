import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '#/styles/global.scss';

import Header from '@/auth-components/header';
import { cal, inter, notoSans } from '#/styles/fonts';
import { Metadata } from 'next';
import { cn } from '#/lib/utils';
import { ColorSchemeScript } from '@mantine/core';
import { ReactNode } from 'react';
// import { getInstanceBySubdomain } from '#/lib/prisma/ormApi/instance';
import { isolateSubdomain } from '#/lib/utils/parse';
import AppLayout from '#/ui/app/AppLayout';
import { Providers } from './providers';

const title = 'Flowbuilder';
const description = '';
const image = 'https://vercel.pub/thumbnail.png';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: [image],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [image],
    creator: '@vercel',
  },
  metadataBase: new URL('https://www.flowbuilder-demo.vercel.app'),
};

interface InstanceLayoutProps {
  children: ReactNode;
  params: {
    domain: string;
  };
}

export default async function CombinedLayout({
  children,
  params,
}: InstanceLayoutProps) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="icon" href="/api/icon" type="image/svg+xml" />
        <link
          rel="apple-touch-icon"
          href="/api/apple-icon"
          type="image/svg+xml"
        />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body className={cn(cal.variable, inter.variable, notoSans.variable)}>
        <Providers>
          <AppLayout>
            {/* <Header /> */}
            <main>{children}</main>
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
