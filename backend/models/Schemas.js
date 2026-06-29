const mongoose = require('mongoose');
const { defineModel } = require('./db');

// ==========================================
// 1. USER SCHEMA
// ==========================================
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager'], default: 'manager' },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// 2. DRIVER SCHEMA
// ==========================================
const DriverSchema = new mongoose.Schema({
  driverId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  route: { type: String, required: true },
  rating: { type: Number, default: 5 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// 3. FEEDBACK SCHEMA
// ==========================================
const FeedbackSchema = new mongoose.Schema({
  managerName: { type: String, required: true },
  managerId: { type: String, required: true },
  driverName: { type: String, required: true },
  driverId: { type: String, required: true },
  reviewMonth: { type: String, required: true }, // e.g. "June 2026"
  vehicleNumber: { type: String, required: true },
  route: { type: String, required: true },
  
  // KPI Metrics
  tripsCompleted: { type: Number, required: true },
  tripsDelayed: { type: Number, required: true },
  onTimePercentage: { type: Number, required: true },
  customerRating: { type: Number, required: true },
  fuelEfficiency: { type: Number, required: true },
  attendance: { type: Number, required: true },
  safetyViolations: { type: Number, required: true },
  complaints: { type: Number, required: true },
  
  // Qualitative fields
  positiveFeedback: { type: String, default: '' },
  managerNotes: { type: String, default: '' },
  strengths: { type: String, default: '' },
  areasOfConcern: { type: String, default: '' },
  additionalRemarks: { type: String, default: '' },

  // AI Response Content
  aiFeedbackScript: { type: String, required: true },

  // Post-Generation Actions
  userRating: { type: Number, default: 0 }, // Out of 5 (Rate Output)
  ratingFeedback: { type: String, default: '' }, // Feedback text
  isFavorite: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define Models (wrapped with fallback)
const mongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);
const mongooseDriver = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
const mongooseFeedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

const User = defineModel('User', mongooseUser);
const Driver = defineModel('Driver', mongooseDriver);
const Feedback = defineModel('Feedback', mongooseFeedback);

module.exports = {
  User,
  Driver,
  Feedback
};
