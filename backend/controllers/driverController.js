const { Driver } = require('../models/Schemas');

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({});
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Server error fetching drivers' });
  }
};

// Create a new driver
exports.createDriver = async (req, res) => {
  const { driverId, name, vehicleNumber, route, rating } = req.body;

  if (!driverId || !name || !vehicleNumber || !route) {
    return res.status(400).json({ error: 'Please enter all required fields' });
  }

  try {
    // Check if ID already exists
    const existingDriver = await Driver.findOne({ driverId });
    if (existingDriver) {
      return res.status(400).json({ error: 'A driver with this ID already exists' });
    }

    const newDriver = await Driver.create({
      driverId,
      name,
      vehicleNumber,
      route,
      rating: rating || 5.0,
      active: true
    });

    res.status(201).json(newDriver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Server error creating driver' });
  }
};

// Update driver details
exports.updateDriver = async (req, res) => {
  const { name, vehicleNumber, route, rating, active } = req.body;
  const { id } = req.params;

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (vehicleNumber) updates.vehicleNumber = vehicleNumber;
    if (route) updates.route = route;
    if (rating !== undefined) updates.rating = rating;
    if (active !== undefined) updates.active = active;

    const updatedDriver = await Driver.findByIdAndUpdate(id, updates, { new: true });
    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Server error updating driver' });
  }
};

// Delete driver
exports.deleteDriver = async (req, res) => {
  const { id } = req.params;

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await Driver.findByIdAndDelete(id);
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Server error deleting driver' });
  }
};
