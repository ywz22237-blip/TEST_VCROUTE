const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { users } = require('../models/data');

// 프로필 업데이트
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, company, phone, portfolio, bio } = req.body;

    const updates = {};
    if (name      !== undefined) updates.name      = name;
    if (company   !== undefined) updates.company   = company;
    if (phone     !== undefined) updates.phone     = phone;
    if (portfolio !== undefined) updates.portfolio = portfolio;
    if (bio       !== undefined) updates.bio       = bio;

    // users 테이블에 레코드 있는 경우만 업데이트 (소셜 가입 시 없을 수 있음)
    const user = await users.findById(userId);
    if (user) {
      await users.update(userId, updates);
    }

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
