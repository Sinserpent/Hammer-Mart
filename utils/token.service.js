// services/token.service.js
import axios from 'axios';

let cachedToken = null;
let tokenExpiry = null;

export const getAuthToken = async (provider) => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const creds = provider === 'UBL'
    ? { url: process.env.UBL_TOKEN_URL, id: process.env.UBL_CLIENT_ID, secret: process.env.UBL_CLIENT_SECRET }
    : { url: process.env.PAYONEER_TOKEN_URL, id: process.env.PAYONEER_CLIENT_ID, secret: process.env.PAYONEER_CLIENT_SECRET };

  const { data } = await axios.post(creds.url, null, {
    auth: { username: creds.id, password: creds.secret }
  });

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // refresh 1 min early
  return cachedToken;
};
