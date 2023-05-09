import { Router } from 'itty-router'
import GoogleRecaptcha from './google/reCaptcha';
import CustomError from './model/CustomError';
import { wrapCorsHeader, isWhiteListedHost } from './cors';

const router = Router()

/**
 * {@link GoogleRecaptcha}
 */
let captchValidation;
let ORIGIN_HOSTNAME;

const forwardRequest = async (req, formData) => {
  if (formData) {
    const url = new URL(req.url);
    url.hostname = ORIGIN_HOSTNAME;
    const request = new Request(url, {
      headers: req.headers,
      method: 'POST',
      body: JSON.stringify({data : formData}),
    });
    request.headers.set('x-byo-cdn-type', 'cloudflare');
    request.headers.set('x-forwarded-host', req.headers.get('host'));
    request.headers.set('x-frame-options', 'deny');
    const response = await fetch(request);
    return new Response(response.body, response);
  } else {
    throw new CustomError('Missing data', 400);
  }
}

const sendResponse = (result, status = 200, headers) => {
  return new Response(JSON.stringify(result), {
    status: status,
    headers: headers,
  });
}

const handleRequest = async (request, env) => {
  return router.handle(request, env)
    .then(response => {
      return wrapCorsHeader(response, request?.headers?.get('origin'));
    })
    .catch(async (err) => {
        console.log('Error', err);
        if(err instanceof CustomError) {
          return wrapCorsHeader(sendResponse(err.getStatus(), err.code, {
            'x-error': err.message,
          }), request?.headers?.get('origin'));
        } 
        return sendResponse(err.message, 500);
    });
}

router.options('*', async (request, env) => {
  if (isWhiteListedHost(request.headers.get('origin'))) {
    return sendResponse({});
  }
  return sendResponse({}, 404);
});

router.post('*', async (request, env) => {
  const {data, token} = await request.json();
  await captchValidation.validate(token);
  return await forwardRequest(request, data);
});

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: async (request, env) => {
    ORIGIN_HOSTNAME = env.ORIGIN_HOSTNAME;
    captchValidation = new GoogleRecaptcha(env.GOOGLE_RECAPTCHA_SECRET_KEY)
    return await handleRequest(request, env);
  }
}