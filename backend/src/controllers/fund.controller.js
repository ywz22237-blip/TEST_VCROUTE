const { funds } = require('../models/data');
const { paginate, createError } = require('../utils/helpers');

// 전체 펀드 조회
const getAllFunds = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, fundType, sort } = req.query;

    const filtered = await funds.findAll({ search, fundType, sort });
    const result = paginate(filtered, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// 단일 펀드 조회
const getFundById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fund = await funds.findById(parseInt(id));

    if (!fund) {
      throw createError('펀드를 찾을 수 없습니다.', 404);
    }

    res.json({
      success: true,
      data: fund
    });
  } catch (error) {
    next(error);
  }
};

// 펀드 생성 (관리자)
const createFund = async (req, res, next) => {
  try {
    const {
      fundType, companyName, fundName, registeredAt, expiredAt,
      settlementMonth, manager, support, purpose, industry,
      baseRate, totalAmount
    } = req.body;

    if (!fundName || !companyName) {
      throw createError('펀드명과 운용사명은 필수입니다.', 400);
    }

    const newFund = await funds.create({
      fundType: fundType || '투자조합',
      companyName, fundName,
      registeredAt: registeredAt || new Date().toISOString().split('T')[0],
      expiredAt: expiredAt || '',
      settlementMonth: settlementMonth || 12,
      manager: manager || '',
      support: support || '',
      purpose: purpose || '',
      industry: industry || '',
      baseRate: baseRate || 0,
      totalAmount: totalAmount || 0
    });

    res.status(201).json({
      success: true,
      message: '펀드가 등록되었습니다.',
      data: newFund
    });
  } catch (error) {
    next(error);
  }
};

// 펀드 수정 (관리자)
const updateFund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await funds.findById(parseInt(id));

    if (!existing) {
      throw createError('펀드를 찾을 수 없습니다.', 404);
    }

    const updated = await funds.update(parseInt(id), req.body);

    res.json({
      success: true,
      message: '펀드 정보가 수정되었습니다.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 펀드 삭제 (관리자)
const deleteFund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await funds.findById(parseInt(id));

    if (!existing) {
      throw createError('펀드를 찾을 수 없습니다.', 404);
    }

    await funds.delete(parseInt(id));

    res.json({
      success: true,
      message: '펀드가 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFunds,
  getFundById,
  createFund,
  updateFund,
  deleteFund
};
