const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/Schemas');

// Register a new Manager/Admin
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'manager',
    });

    // Create JWT token
    const token = jwt.sign(
      { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'manivtha_driver_feedback_secret_jwt_token_key_2026',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'manivtha_driver_feedback_secret_jwt_token_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user details
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error fetching user details' });
  }
};

// Update profile password and settings
exports.updateProfile = async (req, res) => {
  const { name, avatarUrl, oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    // Handle password change
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Please provide current password to change password' });
      }

      // Check password match
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// Get list of all managers (Admin function)
exports.getManagers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    const managers = await User.find({ role: 'manager' });
    // Remove passwords
    const safeManagers = managers.map(({ password, ...m }) => m);
    res.json(safeManagers);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({ error: 'Server error fetching managers' });
  }
};

// Delete a Manager (Admin function)
exports.deleteManager = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Manager deleted successfully' });
  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({ error: 'Server error deleting manager' });
  }
};
