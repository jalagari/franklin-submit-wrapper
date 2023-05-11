import { Router } from 'itty-router';
import GoogleRecaptcha from './google/reCaptcha';
import CustomError from './model/CustomError';
import { wrapCorsHeader, isWhiteListedHost } from './cors';
import ContentType from './model/ContentType';
import FileUpload from './upload/FileUpload';

const router = Router();
let fileUpload;

/**
 * {@link GoogleRecaptcha}
 */
let captchValidation;

const forwardRequest = async (req, submittedData, hostname) => {
  if (submittedData) {
    const url = new URL(req.url);
    url.hostname = hostname;
    const request = new Request(url, {
      headers: { ...req.headers,
        'content-type': ContentType.APPLICATION_JSON,
      },
      method: 'POST',
      body: JSON.stringify({ data: submittedData }),
    });
    request.headers.set('x-byo-cdn-type', 'cloudflare');
    request.headers.set('x-forwarded-host', req.headers.get('host'));
    request.headers.set('x-frame-options', 'deny');
    const response = await fetch(request);
    console.log(JSON.stringify({ data: submittedData }));
    [...request.headers.keys()].forEach((key) => console.log('req Key', key, request.headers.get(key)));
    [...response.headers.keys()].forEach((key) => console.log('Key', key, response.headers.get(key)));
    return new Response(response.body, response);
  }
  throw new CustomError('Missing data', 400);
};

const sendResponse = (result, status = 200, headers = {}) => new Response(JSON.stringify(result), {
  status,
  headers,
});

const handleRequest = async (request, env) => router.handle(request, env)
  .then((response) => wrapCorsHeader(response, request?.headers?.get('origin')))
  .catch(async (err) => {
    console.log('Error', err);
    if (err instanceof CustomError) {
      return wrapCorsHeader(sendResponse(err.getStatus(), err.code, {
        'x-error': err.message,
      }), request?.headers?.get('origin'));
    }
    return sendResponse(err.message, 500);
  });

router.options('*', async (request, env) => {
  if (isWhiteListedHost(request.headers.get('origin'))) {
    return sendResponse({});
  }
  return sendResponse({}, 404);
});

router.post('*', async (request, env) => {
  const contentType = request.headers.get('Content-Type') || ContentType.APPLICATION_JSON;
  let submittedData; let
    token;
  if (contentType.startsWith(ContentType.APPLICATION_JSON)) {
    ({ submittedData, token } = await request.json());
  } else if (contentType.startsWith(ContentType.MULTI_PART)) {
    const formData = await request.formData();
    submittedData = await formData.get('data');
    if (submittedData) {
      submittedData = JSON.parse(submittedData);
      token = await formData.get('token');
      await fileUpload.verifyAndUploadFiles(submittedData, formData);
    } else {
      throw new CustomError('Missing data', 400);
    }
  } else {
    throw new CustomError('Unsupported content-type', 415);
  }
  await captchValidation.validate(token);
  return await forwardRequest(request, submittedData, env.ORIGIN_HOSTNAME);
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: async (request, env) => {
    fileUpload = new FileUpload(env);
    captchValidation = new GoogleRecaptcha(env.GOOGLE_RECAPTCHA_SECRET_KEY);
    return await handleRequest(request, env);
  },
};
