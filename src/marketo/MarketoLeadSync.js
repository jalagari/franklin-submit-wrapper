import Cache from "../Cache.js";
import CustomError from "../model/CustomError.js";

export default async function createLead(data, env) {
  const configCache = new Cache(env.MARKETO_UPLOAD_KV);
  const marketoConfig = await configCache.get(env.MARKETO_CONFIG_KEY);
  // Check if access token is expired or not set
  if (!marketoConfig.accessToken) {
    // Get a new access token
    await renewAccessToken(marketoConfig, env, configCache);
  }

  const payload = createMarketoPayload(data, env);
  const marketoLeadsEndpoint = `${env.MARKETO_URL}/rest/v1/leads.json`;
  const response = await fetch(marketoLeadsEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${marketoConfig.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  if (!responseData.success) {
    // If token is expired, attempt to renew the access token and retry
    if (responseData.errors?.[0]?.code === 602) {
      await renewAccessToken(marketoConfig, env, configCache);
      return createLead(data, env);
    }

    throw new CustomError(
      "Failed to sync data with Marketo.",
      responseData.errors[0].code
    );
  }
}

async function renewAccessToken(marketoConfig, env, cache) {
  const params = new URLSearchParams();
  params.append("client_id", env.CLIENT_ID);
  params.append("client_secret", env.CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  const tokenEndpoint = `${
    env.MARKETO_URL
  }/identity/oauth/token?${params.toString()}`;
  const response = await fetch(tokenEndpoint);
  if (!response.ok) {
    throw new CustomError(
      "Failed to obtain Marketo access token. Check Credentials",
      400
    );
  }
  
  const responseData = await response.json();

  // Update the access token and its expiration time
  marketoConfig.accessToken = responseData.access_token;
  const accessTokenExpirationTime = responseData.expires_in;
  // Store the updated marketoConfig object in KV store
  await cache.put(
    env.MARKETO_CONFIG_KEY,
    marketoConfig,
    accessTokenExpirationTime
  );
}

function createMarketoPayload(data, env) {
  const payload = {
    input: [],
  };
  const inputJsonObject = {};
  const fieldMap = JSON.parse(env.MARKETO_FIELD_MAP);
  for (const field in fieldMap) {
    if (data.hasOwnProperty(field)) {
      const marketoField = fieldMap[field];
      inputJsonObject[marketoField] = data[field];
    }
  }
  payload.input.push(inputJsonObject);
  return payload;
}
