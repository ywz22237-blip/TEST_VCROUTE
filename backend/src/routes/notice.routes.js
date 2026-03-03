const express = require('express');
const router = express.Router();
const { notices } = require('../models/data');

// 공개 공지사항 조회 (인증 불필요)
router.get('/', async (req, res, next) => {
  try {
    const { category, limit } = req.query;

    let filtered = await notices.findAll({ category });

    // 최신순 정렬
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 개수 제한
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// 공지사항 상세 조회 (인증 불필요)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const notice = await notices.findById(parseInt(id));

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      });
    }

    res.json(notice);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
