const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middlewares/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Notice management
router.get('/notices', adminController.getAllNotices);
router.post('/notices', adminController.createNotice);
router.put('/notices/:id', adminController.updateNotice);
router.delete('/notices/:id', adminController.deleteNotice);

module.exports = router;
