const express = require('express');
const router = express.Router();
const startupController = require('../controllers/startup.controller');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/', startupController.getAllStartups);
router.get('/:id', startupController.getStartupById);

// Admin routes
router.post('/', authenticate, isAdmin, startupController.createStartup);
router.put('/:id', authenticate, isAdmin, startupController.updateStartup);
router.delete('/:id', authenticate, isAdmin, startupController.deleteStartup);

module.exports = router;
