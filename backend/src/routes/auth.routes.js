const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/check-id', authController.checkId);
router.post('/send-email-code', authController.sendEmailCode);
router.post('/verify-email-code', authController.verifyEmailCode);
router.post('/send-phone-code', authController.sendPhoneCode);
router.post('/verify-phone-code', authController.verifyPhoneCode);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);
router.delete('/delete-account', authenticate, authController.deleteAccount);

module.exports = router;
