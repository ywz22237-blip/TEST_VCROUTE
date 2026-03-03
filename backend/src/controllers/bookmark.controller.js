const { bookmarks, investors, startups, funds } = require('../models/data');
const { createError } = require('../utils/helpers');

// 내 즐겨찾기 조회
const getMyBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userBookmarks = await bookmarks.getByUserId(userId);
    res.json({ success: true, data: userBookmarks });
  } catch (error) {
    next(error);
  }
};

// 즐겨찾기 추가
const addBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, itemId } = req.body;

    if (!type || !itemId) {
      throw createError('type과 itemId는 필수입니다.', 400);
    }

    if (!['investors', 'startups', 'funds'].includes(type)) {
      throw createError('type은 investors, startups, funds 중 하나여야 합니다.', 400);
    }

    // 아이템 존재 여부 확인
    let item = null;
    if (type === 'investors') item = await investors.findById(itemId);
    else if (type === 'startups') item = await startups.findById(itemId);
    else if (type === 'funds') item = await funds.findById(itemId);

    if (!item) {
      throw createError('해당 아이템을 찾을 수 없습니다.', 404);
    }

    const alreadyExists = await bookmarks.exists(userId, type, itemId);
    if (alreadyExists) {
      throw createError('이미 즐겨찾기에 추가된 항목입니다.', 409);
    }

    await bookmarks.add(userId, type, itemId);
    const userBookmarks = await bookmarks.getByUserId(userId);

    res.status(201).json({
      success: true,
      message: '즐겨찾기에 추가되었습니다.',
      data: userBookmarks
    });
  } catch (error) {
    next(error);
  }
};

// 즐겨찾기 삭제
const removeBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, itemId } = req.body;

    if (!type || !itemId) {
      throw createError('type과 itemId는 필수입니다.', 400);
    }

    if (!['investors', 'startups', 'funds'].includes(type)) {
      throw createError('type은 investors, startups, funds 중 하나여야 합니다.', 400);
    }

    const exists = await bookmarks.exists(userId, type, itemId);
    if (!exists) {
      throw createError('즐겨찾기에 없는 항목입니다.', 404);
    }

    await bookmarks.remove(userId, type, itemId);
    const userBookmarks = await bookmarks.getByUserId(userId);

    res.json({
      success: true,
      message: '즐겨찾기에서 삭제되었습니다.',
      data: userBookmarks
    });
  } catch (error) {
    next(error);
  }
};

// 즐겨찾기 토글
const toggleBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, itemId } = req.body;

    if (!type || !itemId) {
      throw createError('type과 itemId는 필수입니다.', 400);
    }

    if (!['investors', 'startups', 'funds'].includes(type)) {
      throw createError('type은 investors, startups, funds 중 하나여야 합니다.', 400);
    }

    const isBookmarked = await bookmarks.exists(userId, type, itemId);

    if (isBookmarked) {
      await bookmarks.remove(userId, type, itemId);
    } else {
      await bookmarks.add(userId, type, itemId);
    }

    const userBookmarks = await bookmarks.getByUserId(userId);

    res.json({
      success: true,
      message: isBookmarked ? '즐겨찾기에서 삭제되었습니다.' : '즐겨찾기에 추가되었습니다.',
      data: {
        isBookmarked: !isBookmarked,
        bookmarks: userBookmarks
      }
    });
  } catch (error) {
    next(error);
  }
};

// 즐겨찾기 상세 정보 조회
const getBookmarksWithDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userBookmarks = await bookmarks.getByUserId(userId);

    const allInvestors = await investors.findAll();
    const allStartups = await startups.findAll();
    const allFunds = await funds.findAll();

    const detailedBookmarks = {
      investors: allInvestors.filter(inv => userBookmarks.investors.includes(inv.id)),
      startups: allStartups.filter(s => userBookmarks.startups.includes(s.id)),
      funds: allFunds.filter(f => userBookmarks.funds.includes(f.id))
    };

    res.json({ success: true, data: detailedBookmarks });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookmarks,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  getBookmarksWithDetails
};
