const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { users } = require('../models/data');

// 프로필 업데이트
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, company, phone, portfolio, bio } = req.body;

    const user = await users.findById(userId);
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }

    const updates = {};
    if (name      !== undefined) updates.name      = name;
    if (company   !== undefined) updates.company   = company;
    if (phone     !== undefined) updates.phone     = phone;
    if (portfolio !== undefined) updates.portfolio = portfolio;
    if (bio       !== undefined) updates.bio       = bio;

    const updated = await users.update(userId, updates);

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        id:        updated.id,
        email:     updated.email,
        name:      updated.name,
        company:   updated.company,
        phone:     updated.phone,
        portfolio: updated.portfolio,
        bio:       updated.bio,
        role:      updated.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
