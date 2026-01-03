import crypto from 'crypto';
import { generateToken, writeToken } from './token.controller.js';


export function login(req, res) {
  const state = crypto.randomBytes(16).toString("hex");
  const u = new URL("https://auth.aliexpress.com/oauth/authorize");
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", process.env.APP_KEY);
  u.searchParams.set("redirect_uri", process.env.REDIRECT_URI);
  u.searchParams.set("state", state);
  res.redirect(u.toString());
}


export async function callback(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("No code returned");

    const tokenResp = await generateToken(code);
    if (!tokenResp.access_token) return res.status(400).json({ ok: false, resp: tokenResp });

    writeToken({
      access_token: tokenResp.access_token,
      refresh_token: tokenResp.refresh_token,
      expires_in: Number(tokenResp.expires_in),
      created_at: Math.floor(Date.now() / 1000),
    });
    res.send("✅ Access token saved!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Auth error");
  }
}

