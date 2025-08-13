import seller from '../models/seller.model.js';

export const getUsers = async (req, res) => {
  try {
    const users = await seller.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching users.' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await seller.findById(id);
    if (!user)
      return res.status(404).json({ error: 'User not found.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, phone } = req.body;

    const existingEmail = await seller.exists({ email });
    if (existingEmail)
      return res.status(400).json({ error: 'Email already exists.' });

    const existingPhone = await seller.exists({ phone });
    if (existingPhone)
      return res.status(400).json({ error: 'Phone number already exists.' });

    const user = await seller.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error while creating user.' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) {
      const existingEmail = await seller.findOne({ email: updates.email, _id: { $ne: id } });
      if (existingEmail)
        return res.status(400).json({ error: 'Email already in use.' });
    }

    if (updates.phone) {
      const existingPhone = await seller.findOne({ phone: updates.phone, _id: { $ne: id } });
      if (existingPhone)
        return res.status(400).json({ error: 'Phone number already in use.' });
    }

    const user = await seller.findByIdAndUpdate(id, updates, { new: true });
    if (!user)
      return res.status(404).json({ error: 'User not found.' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await seller.findByIdAndDelete(id);

    if (!user)
      return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting user.' });
  }
};
