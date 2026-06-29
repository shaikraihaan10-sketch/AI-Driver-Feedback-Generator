const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./models/db');
const { User, Driver } = require('./models/Schemas');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Seed data function
const seedData = async () => {
  try {
    // 1. Seed Users if empty
    const userCount = await User.countDocuments({});
    if (userCount === 0) {
      console.log('🌱 Database is empty. Seeding default Admin and Manager accounts...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedAdminPassword = await bcrypt.hash('password123', salt);
      const hashedManagerPassword = await bcrypt.hash('password123', salt);

      // Create Admin
      await User.create({
        name: 'Super Admin',
        email: 'admin@manivtha.com',
        password: hashedAdminPassword,
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
      });

      // Create Manager
      await User.create({
        name: 'Rohan Sharma',
        email: 'manager@manivtha.com',
        password: hashedManagerPassword,
        role: 'manager',
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
      });

      console.log('✅ Registered Default Accounts:');
      console.log('   - Admin:   admin@manivtha.com   / password123');
      console.log('   - Manager: manager@manivtha.com / password123');
    }

    // 2. Seed Drivers if empty
    const driverCount = await Driver.countDocuments({});
    if (driverCount === 0) {
      console.log('🌱 Seeding sample driver directory...');
      
      const sampleDrivers = [
        {
          driverId: 'DRV-101',
          name: 'Ramesh Kumar',
          vehicleNumber: 'KA-01-MF-7821',
          route: 'Bengaluru - Mysore (National Highway)',
          rating: 4.8,
          active: true
        },
        {
          driverId: 'DRV-102',
          name: 'Suresh Patel',
          vehicleNumber: 'KA-01-MF-5592',
          route: 'Bengaluru - Chennai (Interstate Express)',
          rating: 4.2,
          active: true
        },
        {
          driverId: 'DRV-103',
          name: 'Amit Sharma',
          vehicleNumber: 'KA-01-MF-3301',
          route: 'Bengaluru Airport Shuttles (Local)',
          rating: 4.5,
          active: true
        },
        {
          driverId: 'DRV-104',
          name: 'Priya Nair',
          vehicleNumber: 'KA-01-MF-4402',
          route: 'Bengaluru - Mangalore (Western Ghats Route)',
          rating: 4.9,
          active: true
        },
        {
          driverId: 'DRV-105',
          name: 'Jagdish Singh',
          vehicleNumber: 'KA-01-MF-1092',
          route: 'Bengaluru - Ooty Tourist Special',
          rating: 3.9,
          active: true
        }
      ];

      for (let driver of sampleDrivers) {
        await Driver.create(driver);
      }
      console.log(`✅ Seeded ${sampleDrivers.length} sample drivers.`);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  await seedData();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
