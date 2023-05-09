const WHITELISTED_HOST = ['localhost:3000', 'hlxsites.hlx.page', 'hlxsites.hlx.live', 'franklin-submit-wrapper.crispr-api.workers.dev'];

export const isWhiteListedHost = (reqUrl) => {
  const url = new URL(reqUrl);
  return WHITELISTED_HOST.includes(url.host);
};

export const wrapCorsHeader = (response, reqHost) => {
  if (isWhiteListedHost(reqHost)) {
    response.headers.set('Access-Control-Allow-Headers', 'content-type');
    response.headers.set('Access-Control-Allow-Origin', reqHost);
  }
  return response;
};
