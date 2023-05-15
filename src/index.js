import { Router } from 'itty-router';
import CustomError from './model/CustomError.js';

const router = Router();

const forwardRequest = async (req, data, hostname) => {
  if (data &&  Object.keys(data).length > 0) {
    const url = new URL(req.url);
    url.hostname = hostname;
    const request = new Request(url, {
      headers: req.headers,
      method: 'POST',
      body: JSON.stringify({data : data}),
    });
    request.headers.set('x-byo-cdn-type', 'cloudflare');
    request.headers.set('x-forwarded-host', req.headers.get('host'));
    request.headers.set('x-frame-options', 'deny');
    const response = await fetch(request);
    console.log('Forward request', request.url, 'Status', response.status, data);
    return new Response(response.body, response);
  }
  throw new CustomError('Missing data', 400);
};

const sendResponse = (result, status = 200, headers = {}) => new Response(JSON.stringify(result), {
  status,
  headers,
});

const handleRequest = async (request, env) => {
  return router.handle(request, env)
    .then(response => {
      return response;
    })
    .catch(async (err) => {
        console.log('Error', err);
        if(err instanceof CustomError) {
          return sendResponse(err.getStatus(), err.code, {
            'x-error': err.message,
          });
        }
        return sendResponse(err.message, 500);
    });
}

router.post('*', async (request, env) => {
  const {data} = await request.json();
  const redirectHostName = env.ORIGIN_HOSTNAME;
  return await forwardRequest(request, data, redirectHostName);
});

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: async (request, env) => {
    return await handleRequest(request, env);
  }
}
