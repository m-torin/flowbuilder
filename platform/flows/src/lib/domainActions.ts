'use server';

import type {
  DomainResponse,
  DomainConfigResponse,
  DomainVerificationResponse,
} from './domains';

export const addSubdomain = async () => {
  const projectId = 'prj_6imjw8MltW65OAxBhrDy7waV71BD';
  const subdomain = 'subdomain.flowbuilder-demo.vercel.app';
  const token = 'AYmHOKHYQwAS1EQrEeZULyI0';

  const addDomainResponse = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: subdomain,
      }),
      cache: 'no-store',
    },
  );

  const addDomainResult = await addDomainResponse.json();
  console.log('Add Domain Result:', addDomainResult);

  return addDomainResult;
};

export const verifySubdomain = async () => {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const subdomain = 'subdomain.flowbuilder-demo.vercel.app';
  const token = process.env.VERCEL_AUTH_BEARER_TOKEN;

  const verifyDomainResponse = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${subdomain}/verify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  const verifyDomainResult = await verifyDomainResponse.json();
  console.log('Verify Domain Result:', verifyDomainResult);

  return verifyDomainResult;
};

export const addDomainToVercel = async (subdomain: string) => {
  const domain = `${subdomain}.flowbuilder-demo.vercel.app`;
  return await fetch(
    `https://api.vercel.com/v10/projects/prj_6imjw8MltW65OAxBhrDy7waV71BD/domains${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer AYmHOKHYQwAS1EQrEeZULyI0`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        // Optional: Redirect www. to root domain
        // ...(domain.startsWith("www.") && {
        //   redirect: domain.replace("www.", ""),
        // }),
      }),
      cache: 'no-store',
    },
  ).then((res) => res.json());
};

export const removeDomainFromVercelProject = async (subdomain: string) => {
  const domain = `${subdomain}.${process.env.VERCEL_DOMAIN}`;
  return await fetch(
    `https://api.vercel.com/v9/projects/${
      process.env.VERCEL_PROJECT_ID
    }/domains/${domain}${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
      },
      method: 'DELETE',
    },
  ).then((res) => res.json());
};

export const removeDomainFromVercelTeam = async (subdomain: string) => {
  const domain = `${subdomain}.${process.env.VERCEL_DOMAIN}`;
  return await fetch(
    `https://api.vercel.com/v6/domains/${domain}${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
      },
      method: 'DELETE',
    },
  ).then((res) => res.json());
};

export const getDomainResponse = async (
  subdomain: string,
): Promise<DomainResponse & { error: { code: string; message: string } }> => {
  const domain = `${subdomain}.${process.env.VERCEL_DOMAIN}`;
  return await fetch(
    `https://api.vercel.com/v9/projects/${
      process.env.VERCEL_PROJECT_ID
    }/domains/${domain}${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  ).then((res) => {
    return res.json();
  });
};

export const getConfigResponse = async (
  domain: string,
): Promise<DomainConfigResponse> => {
  return await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  ).then((res) => res.json());
};

export const verifyDomain = async (
  domain: string,
): Promise<DomainVerificationResponse> => {
  return await fetch(
    `https://api.vercel.com/v9/projects/${
      process.env.VERCEL_PROJECT_ID
    }/domains/${domain}/verify${
      process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : ''
    }`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_AUTH_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  ).then((res) => res.json());
};
