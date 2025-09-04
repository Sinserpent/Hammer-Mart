export default function dropshipperValidator(req, res, next) {
  const dropshipperId = req.headers['x-dropshipper-id'];
  if (!dropshipperId) return res.status(400).json({ error: 'Dropshipper ID missing' });
  req.dropshipperId = dropshipperId;
  next();
}
