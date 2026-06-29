const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware); // All feedback routes require authentication

router.post('/generate-feedback', feedbackController.generateFeedback);
router.get('/history', feedbackController.getHistory);
router.get('/history/:id', feedbackController.getHistoryById);
router.delete('/history/:id', feedbackController.deleteHistory);
router.post('/rating/:id', feedbackController.rateFeedback);
router.post('/favorite/:id', feedbackController.toggleFavorite);

module.exports = router;
