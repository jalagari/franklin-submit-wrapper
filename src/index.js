import { Router } from 'itty-router';
import CustomError from './model/CustomError.js';
import CORSHandler from './CORSHandler.js';
import googleRecaptchaValidation from './google/reCaptcha.js';

const router = Router();
let corsHandler;

const forwardRequest = async (req, data, hostname) => {
  if (data &&  Object.keys(data).length > 0) {
    const url = new URL(req.url);
    url.hostname = hostname;
    url.port = ''; // Required only for test cases.
    const request = new Request(url, {
      headers: req.headers,
      method: 'POST',
      body: JSON.stringify({data : data}),
    });
    request.headers.set('x-byo-cdn-type', 'cloudflare');
    request.headers.set('x-forwarded-host', req.headers.get('host'));
    request.headers.set('x-frame-options', 'deny');
    const response = await fetch(request);
    console.log('Forward request', request.url, 'Status', response.status);
    return new Response(response.body, response);
  }
  throw new CustomError('Missing data', 400);
};

const sendResponse = (result, status = 200, headers = {}) => new Response(JSON.stringify(result), {
  status,
  headers,
});

const handleRequest = async (request, env) => {
  const origin = request.headers.get('origin');
  return router.handle(request, env)
    .then(response => {
      if (origin) {
        const url = new URL(request.headers.get('origin'));
        return corsHandler.wrapHeaders(response, origin, url?.hostname);
      }
      return response;
    })
    .catch(async (err) => {
        console.log('Error', err);
        let msg = err instanceof CustomError ? err.getStatus() : err.message;
        let code = err?.code || 500;
        let headers = {
          'x-error': err.message || "Server side error",
        };
        if (origin) {
          const url = new URL(request.headers.get('origin'));
          return corsHandler.wrapHeaders(sendResponse(msg, code, headers), origin, url?.hostname);
        }
        return sendResponse(msg, code, headers);
    });
}

router.options('*', async (request) => {
  const url = new URL(request.headers.get('origin'));
  if (corsHandler.isWhiteListedHost(url?.hostname)) {
    return sendResponse({});
  }
  return sendResponse({}, 404);
});

router.post('*', async (request, env) => {
  const {data, token} = await request.json();
  const redirectHostName = env.ORIGIN_HOSTNAME;
  env.GOOGLE_RECAPTCHA_SECRET_KEY &&
   await googleRecaptchaValidation(env.GOOGLE_RECAPTCHA_SECRET_KEY, token, env.GOOGLE_RECAPTCHA_URL);
  return await forwardRequest(request, data, redirectHostName);
});

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: async (request, env) => {
    corsHandler = new CORSHandler(env.WHITELISTED_HOST);
    return await handleRequest(request, env);
  }
}
