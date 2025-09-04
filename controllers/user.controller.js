// controllers/user.controller.js
import mongoose from 'mongoose';

export const createUserController = (Model) => async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Email / phone uniqueness
    if (email) {
      const existingEmail = await Model.exists({ email });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }
    if (phone) {
      const existingPhone = await Model.exists({ phone });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already exists.' });
      }
    }

    const user = await Model.create(req.body);
    return res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err.message);
    return res.status(500).json({ error: 'Server error while creating user.' });
  }
};

export const getAllUsersController = (Model) => async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const users = await Model.find();
    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({ error: 'Server error while fetching users.' });
  }
};

export const getUserController = (Model) => async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (!req.user || (req.user.role !== 'admin' && req.user.id !== id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

export const updateUserController = (Model) => async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (!req.user || (req.user.role !== 'admin' && req.user.id !== id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Uniqueness check
    if (updates.email) {
      const existingEmail = await Model.findOne({
        email: updates.email,
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
    }
    if (updates.phone) {
      const existingPhone = await Model.findOne({
        phone: updates.phone,
        _id: { $ne: id },
      });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already in use.' });
      }
    }

    const user = await Model.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Error updating user:', err.message);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
};

export const deleteUserController = (Model) => async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (!req.user || (req.user.role !== 'admin' && req.user.id !== id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await Model.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    return res.status(500).json({ error: 'Server error while deleting user.' });
  }
};
