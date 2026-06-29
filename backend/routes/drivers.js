const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // All driver routes require authentication

router.get('/', driverController.getDrivers);
router.post('/', driverController.createDriver);
router.put('/:id', driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
