import { Router } from 'itty-router';
import ContentType from "./model/ContentType.js";
import CustomError from './model/CustomError.js';
import CORSHandler from './CORSHandler.js';
import googleRecaptchaValidation from './google/reCaptcha.js';
import FileUpload from './upload/FileUpload.js';
import { OBOFAuthenticationProvider } from './microsoft/OBOFAuthenticationProvider.js';
import SharePointFileUpload from './upload/SharePointFileUpload.js';
import { Util } from './model/Util.js';

const router = Router();
let corsHandler, fileUpload, obofAuthenticationProvider;

const forwardRequest = async (req, data, hostname) => {
  const url = new URL(req.url);
  url.hostname = hostname;
  url.port = ''; // Required only for test cases.
  const request = new Request(url, {
    headers: { 
      ...req.headers,
      'content-type': ContentType.APPLICATION_JSON,
      'x-byo-cdn-type': 'cloudflare',
      'x-forwarded-host': req?.headers?.get('host'),
      'x-frame-options': 'deny',
    },
    method: 'POST',
    body: JSON.stringify({data : data}),
  });
  const response = await fetch(request);
  console.log('Forward request', request.url, 'Status', response.status);
  return new Response(response.body, response);
};

const sendResponse = (result, status = 200, headers = {}) => new Response(JSON.stringify(result), {
  status,
  headers,
});

const validateRequest = (data, contentType) => {
  if (!contentType || 
      (!contentType.startsWith(ContentType.APPLICATION_JSON) 
      && !contentType.startsWith(ContentType.MULTI_PART))) {
      throw new CustomError(`Unsupported content-type - ${contentType}`, 415);
  }

  if (!data ||  Object.keys(data).length == 0) {
    throw new CustomError('Missing data', 400);
  }
}

const handleRequest = async (request, env) => {
  const origin = request.headers.get('origin');
  try {
    let response = await router.handle(request, env);
    if (origin) {
      const url = new URL(request.headers.get('origin'));
      return corsHandler.wrapHeaders(response, origin, url?.hostname);
    }
    return response;
  } catch(err) {
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
  }
}

router.options('*', async (request) => {
  const url = new URL(request.headers.get('origin'));
  if (corsHandler.isWhiteListedHost(url?.hostname)) {
    return sendResponse({});
  }
  return sendResponse({}, 404);
});

router.get('/register/token', async (request, env) => {
  const {code, state, session_state} = request.query;
  await obofAuthenticationProvider.getAccessToken(code);
  return sendResponse({received : true});
})

router.get('/authorize', async (request) => {
  const result = {link : obofAuthenticationProvider.authorize()};
  return sendResponse(result);
})

router.post('*', async (request, env) => {
  const redirectHostName = env.ORIGIN_HOSTNAME;
  const contentType = request.headers.get('Content-Type') || ContentType.APPLICATION_JSON;
  let data, token, formData;
  if (contentType.startsWith(ContentType.APPLICATION_JSON)) {
    ({data, token} = await request.json());
  } else if (contentType.startsWith(ContentType.MULTI_PART)) {
    formData = await request.formData();
    token = await formData.get('token');
    data = await formData.get('data');
    data = data ? JSON.parse(data) : {};
  }
  
  validateRequest(data, contentType);
  env.GOOGLE_RECAPTCHA_SECRET_KEY &&
    await googleRecaptchaValidation(env.GOOGLE_RECAPTCHA_SECRET_KEY, token, env.GOOGLE_RECAPTCHA_URL);

  formData && await fileUpload.verifyAndUploadFiles(data, formData);
 
  return await forwardRequest(request, data, redirectHostName);
});

router.all('*', () => new Response('Not Found.', { status: 404 }))

export default {
  fetch: async (request, env) => {
    Util.FRANKLIN_UPLOAD_KV = env.FRANKLIN_UPLOAD_KV;
    fileUpload = new SharePointFileUpload(env);
    corsHandler = new CORSHandler(env.WHITELISTED_HOST);
    obofAuthenticationProvider = new OBOFAuthenticationProvider(env);
    return await handleRequest(request, env);
  }
}
