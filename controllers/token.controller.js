import fs from "fs/promises";
import path from "path";
import crypto from 'crypto'
import axios from "axios";



const TOKEN_FILE = process.env.TOKEN_FILE || path.join(process.cwd(), "aliexpress-token.json");
const APP_KEY = process.env.APP_KEY
const APP_SECRET = process.env.APP_SECRET




export async function readToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function writeToken(tok) {
  await fs.writeFile(TOKEN_FILE, JSON.stringify(tok, null, 2), "utf8");
}

function isExpiring(tok, skewSeconds = 120) {
  const now = Math.floor(Date.now() / 1000);
  return tok.created_at + tok.expires_in - skewSeconds <= now;
}

// ---- Signature utility ----
function buildSignedForm(apiPath, params, secret) {
  const keys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort();

  const toSign = apiPath + keys.map((k) => `${k}${params[k]}`).join("");
  const sign = crypto.createHmac("sha256", secret)
    .update(Buffer.from(toSign, "utf8"))
    .digest("hex")
    .toUpperCase();

  const form = new URLSearchParams({ ...params, sign });
  return form.toString();
}

// ---- AliExpress OAuth ---- //NEED ADMIN TO CALL THIS ONCE A MONTH OR SO
export async function generateToken(code) {
  const apiPath = "/auth/token/create";
  const url = `https://api-sg.aliexpress.com/rest${apiPath}`;
  const params = {
    app_key: APP_KEY,
    grant_type: "authorization_code",
    code,
    sign_method: "sha256",
    timestamp: Date.now().toString(), // ms
  };

  const body = buildSignedForm(apiPath, params, APP_SECRET);
  const res = await axios.post(url, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });

  return res.data;
}

export async function refreshToken(refresh_token) {
  const apiPath = "/auth/token/refresh";
  const url = `https://api-sg.aliexpress.com/rest${apiPath}`;
  const params = {
    app_key: APP_KEY,
    grant_type: "refresh_token",
    refresh_token,
    sign_method: "sha256",
    timestamp: Date.now().toString(),
  };

  const body = buildSignedForm(apiPath, params, APP_SECRET);
  const res = await axios.post(url, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    validateStatus: () => true,
  });

  return res.data;
}

// ---- Access token management ----
export async function ensureAccessToken() {
  let tok = await readToken(); // ✅ await it

  if (!tok) {
    reportToAdmin("No token found. Admin intervention required.");
    throw new Error("Missing token. Admin has been notified.");
  }

  async function attemptToken(t) {
    if (!isExpiring(t)) return t.access_token;

    try {
      const refreshed = await refreshToken(t.refresh_token);
      if (!refreshed.access_token) throw new Error("Refresh failed");
      const next = {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        expires_in: Number(refreshed.expires_in),
        created_at: Math.floor(Date.now() / 1000),
      };
      await writeToken(next);  // also await writing
      return next.access_token;
    } catch {
      return null;
    }
  }

  let token = await attemptToken(tok);

  if (!token) {
    tok = await readToken();  // ✅ await again
    token = await attemptToken(tok);
  }

  if (!token) {
    messageToAdmin("Token and refresh failed. Admin intervention required.");
    throw new Error("Token unavailable. Admin has been notified.");
  }

  return token;
}