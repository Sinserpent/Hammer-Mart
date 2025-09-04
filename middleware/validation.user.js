// middleware/validateUser.js
export default function validateUser(req, res, next) {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  const phoneRegex = /^\d{7,15}$/; // simple phone check
  if (!phoneRegex.test(String(phone))) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  next();
}
