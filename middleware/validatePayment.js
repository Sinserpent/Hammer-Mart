// middleware/validatePayment.js
import currency from 'currency.js';

export const validatePaymentBody = (req, res, next) => {
  const { amount, recipient, currency: curr } = req.body;

  // Allowed currency codes
  const allowedCurrencies = ['PKR', 'USD', 'EUR'];

  // 1. Check required fields
  if (amount == null || recipient == null) {
    return res.status(400).json({ success: false, message: 'Missing amount or recipient' });
  }

  // 2. Amount validation using currency.js (forces precision to 2 decimal places)
  const parsedAmount = currency(amount, { precision: 2 }).value;
  if (typeof parsedAmount !== 'number' || isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000000) {
    return res.status(400).json({ success: false, message: 'Invalid amount' });
  }

  // 3. Decimal precision check
  if (!Number.isInteger(parsedAmount * 100)) {
    return res.status(400).json({ success: false, message: 'Amount cannot have more than 2 decimal places' });
  }

  // 4. Recipient format validation
  if (typeof recipient !== 'string' || recipient.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Invalid recipient format' });
  }

  // 5. Currency validation (optional field, but if provided must be valid)
  if (curr && (!allowedCurrencies.includes(curr.toUpperCase()))) {
    return res.status(400).json({ success: false, message: 'Unsupported currency' });
  }

  next();
};
