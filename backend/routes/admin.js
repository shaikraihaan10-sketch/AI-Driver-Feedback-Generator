const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../models/db');

// Database Backup (Admin only)
router.get('/backup', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    // In fallback mode, get file backup; in mongo mode, we can download the current in-memory status or collections
    const backupData = db.getBackupData();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      backup: backupData
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Server error during database backup' });
  }
});

// Database Restore (Admin only)
router.post('/restore', authMiddleware, (req, res) => {
  const { backup } = req.body;

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'Invalid backup payload structure' });
    }

    db.restoreBackupData(backup);
    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Server error during database restore' });
  }
});

module.exports = router;
