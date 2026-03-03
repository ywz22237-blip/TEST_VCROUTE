const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investor.controller');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/', investorController.getAllInvestors);
router.get('/:id', investorController.getInvestorById);

// Admin routes
router.post('/', authenticate, isAdmin, investorController.createInvestor);
router.put('/:id', authenticate, isAdmin, investorController.updateInvestor);
router.delete('/:id', authenticate, isAdmin, investorController.deleteInvestor);

module.exports = router;
