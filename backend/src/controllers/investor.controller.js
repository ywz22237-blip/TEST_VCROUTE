const { investors } = require('../models/data');
const { paginate, createError } = require('../utils/helpers');

// 전체 투자자 조회
const getAllInvestors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, focusArea, stage } = req.query;

    const filtered = await investors.findAll({ search, focusArea, stage });
    const result = paginate(filtered, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// 단일 투자자 조회
const getInvestorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const investor = await investors.findById(parseInt(id));

    if (!investor) {
      throw createError('투자자를 찾을 수 없습니다.', 404);
    }

    res.json({
      success: true,
      data: investor
    });
  } catch (error) {
    next(error);
  }
};

// 투자자 생성 (관리자)
const createInvestor = async (req, res, next) => {
  try {
    const {
      name, company, position, investments, successRate,
      portfolio, focusArea, minInvestment, maxInvestment,
      stage, bio, contact
    } = req.body;

    if (!name || !company) {
      throw createError('이름과 회사는 필수입니다.', 400);
    }

    const newInvestor = await investors.create({
      name, company,
      position: position || '',
      investments: investments || 0,
      successRate: successRate || 0,
      portfolio: portfolio || [],
      focusArea: focusArea || [],
      minInvestment: minInvestment || 0,
      maxInvestment: maxInvestment || 0,
      stage: stage || [],
      bio: bio || '',
      contact: contact || ''
    });

    res.status(201).json({
      success: true,
      message: '투자자가 등록되었습니다.',
      data: newInvestor
    });
  } catch (error) {
    next(error);
  }
};

// 투자자 수정 (관리자)
const updateInvestor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await investors.findById(parseInt(id));

    if (!existing) {
      throw createError('투자자를 찾을 수 없습니다.', 404);
    }

    const updated = await investors.update(parseInt(id), req.body);

    res.json({
      success: true,
      message: '투자자 정보가 수정되었습니다.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 투자자 삭제 (관리자)
const deleteInvestor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await investors.findById(parseInt(id));

    if (!existing) {
      throw createError('투자자를 찾을 수 없습니다.', 404);
    }

    await investors.delete(parseInt(id));

    res.json({
      success: true,
      message: '투자자가 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInvestors,
  getInvestorById,
  createInvestor,
  updateInvestor,
  deleteInvestor
};
