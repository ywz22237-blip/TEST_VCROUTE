const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const { users } = require('../models/data');

// 프로필 업데이트
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    const user = await users.findById(userId);
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }

    const updates = {};
    if (name) updates.name = name;

    const updated = await users.update(userId, updates);

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
