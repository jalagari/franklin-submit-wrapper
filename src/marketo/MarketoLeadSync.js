import CustomError from "../model/CustomError.js";

const MARKETO_CONFIG_KEY = "marketoConfig";
const MARKETO_URL = "https://797-MKX-025.mktorest.com";
const MARKETO_LEADS_ENDPOINT = `${MARKETO_URL}/rest/v1/leads.json`;

function getMarketoFieldName(fieldName) {
  const fieldMap = {
    "First Name": "firstName",
    "Last Name": "lastName",
    Email: "email",
  };

  return fieldMap[fieldName] || null;
}

export default async function syncDataWithMarketo(data, env) {
  const marketoConfig = await getMarketoConfig(env);
  const currentTime = Date.now() / 1000;

  // Check if access token is expired or not set
  if (
    !marketoConfig.accessToken ||
    marketoConfig.expirationTime < currentTime
  ) {
    // Get a new access token
    await renewAccessToken(marketoConfig, env);
  }

  const payload = createMarketoPayload(data);

  const response = await fetch(MARKETO_LEADS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${marketoConfig.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  if (!responseData.status) {
    // If token is expired, attempt to renew the access token and retry
    if (responseData.errors[0].code === 602) {
      await renewAccessToken(marketoConfig);
      return syncDataWithMarketo(data, env);
    }

    throw new CustomError("Failed to sync data with Marketo.", responseData.errors[0].code);
  }
}

async function renewAccessToken(marketoConfig, env) {
  const params = new URLSearchParams();
  params.append("client_id", env.CLIENT_ID);
  params.append("client_secret", env.CLIENT_SECRET);
  params.append("grant_type", "client_credentials");
  const tokenEndpoint = `${MARKETO_URL}/identity/oauth/token?${params.toString()}`;
  const response = await fetch(tokenEndpoint);
  if (!response.ok) {
    throw new CustomError("Failed to obtain Marketo access token. Check Credentials", 400);
  }

  const responseData = await response.json();

  // Update the access token and its expiration time
  marketoConfig.accessToken = responseData.access_token;
  marketoConfig.expirationTime = Date.now() / 1000 + responseData.expires_in;

  // Store the updated marketoConfig object in KV store
  await setMarketoConfig(marketoConfig, env);
}

async function getMarketoConfig(env) {
  // Retrieve marketoConfig object from KV store
  const marketoConfigValue = await env.MARKETO_UPLOAD_KV.get(MARKETO_CONFIG_KEY, "json");

  // If marketoConfig is not found in KV store, return an empty object
  return marketoConfigValue || {};
}

async function setMarketoConfig(marketoConfig, env) {
  // Store marketoConfig object in KV store
  await env.MARKETO_UPLOAD_KV.put(MARKETO_CONFIG_KEY, JSON.stringify(marketoConfig));
}

function createMarketoPayload(data) {
  const payload = {
    input: [],
  };

  const inputJsonObject = {};
  for (const field in data) {
    if (data.hasOwnProperty(field)) {
      const marketoField = getMarketoFieldName(field);
      if (marketoField !== null) {
        inputJsonObject[marketoField] = data[field];
      }
    }
  }
  payload.input.push(inputJsonObject);
  return payload;
}
