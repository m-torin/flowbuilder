// const NODE_ENV = process.env.NODE_ENV!;
const NEXT_PUBLIC_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;

// const isProduction = NODE_ENV === 'production';

export const getBaseUrl = (subdomain = '', path = ''): string => {
  // const protocol = isProduction ? 'https' : 'http';
  const rootDomain = NEXT_PUBLIC_ROOT_DOMAIN;
  const host = subdomain ? `${subdomain}.${rootDomain}` : rootDomain;
  return `//${host}${path}`;
};
