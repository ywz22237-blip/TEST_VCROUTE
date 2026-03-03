const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fund.controller');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/', fundController.getAllFunds);
router.get('/:id', fundController.getFundById);

// Admin routes
router.post('/', authenticate, isAdmin, fundController.createFund);
router.put('/:id', authenticate, isAdmin, fundController.updateFund);
router.delete('/:id', authenticate, isAdmin, fundController.deleteFund);

module.exports = router;
