export const login = (redirectUrl?: string) => {
  return redirectUrl
    ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
    : "/auth/login";
};

export const password = (redirectUrl?: string) => {
  return redirectUrl
    ? `/auth/login/password?redirect=${encodeURIComponent(redirectUrl)}`
    : `/auth/login/password`;
};

export const oauth = (
  authUrl: string,
  clientId: string,
  callbackUrl: string,
  locale: string,
) => {
  const fixedUrl = authUrl.toLowerCase().startsWith("http")
    ? authUrl
    : `https://${authUrl}`;
  const state = Math.random().toString(36).substring(2);
  return `${fixedUrl}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=profile&state=${state}&hl=${locale}`;
};

export const oauthCallback = () => {
  return `${window.location.origin}/auth/oauth/callback`;
};
