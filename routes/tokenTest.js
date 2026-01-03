import express from "express";
import { readToken, writeToken } from "../controllers/token.controller.js   "; // adjust path
import { ensureAccessToken } from "../controllers/token.controller.js";


const router = express.Router();
  
router.post("/message", async (req, res) => {
  const { subject, message, userId, role = "user" } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and message are required" });
  }

  try {
    await messageToUser(subject, message, userId, role);
    return res.status(200).json({ success: true, message: "Message sent" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// Force expire token for testing
router.post("/simulate-expiry", async (req, res) => {
  try {
    let tok = await readToken();
    if (!tok) return res.status(404).json({ error: "No token file" });

    // Set expiry to past
    tok.created_at = Math.floor(Date.now() / 1000) - tok.expires_in - 10;
    await writeToken(tok);

    res.json({ message: "Token marked as expired" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test refresh flow
router.get("/test-token", async (req, res) => {
  try {
    const token = await ensureAccessToken();
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
