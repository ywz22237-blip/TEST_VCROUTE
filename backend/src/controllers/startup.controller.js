const { startups } = require('../models/data');
const { paginate, createError } = require('../utils/helpers');

// 전체 스타트업 조회
const getAllStartups = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, industry, stage, location } = req.query;

    const filtered = await startups.findAll({ search, industry, stage, location });
    const result = paginate(filtered, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// 단일 스타트업 조회
const getStartupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const startup = await startups.findById(parseInt(id));

    if (!startup) {
      throw createError('스타트업을 찾을 수 없습니다.', 404);
    }

    res.json({
      success: true,
      data: startup
    });
  } catch (error) {
    next(error);
  }
};

// 스타트업 생성 (관리자)
const createStartup = async (req, res, next) => {
  try {
    const {
      name, industry, industryLabel, foundedDate, location,
      employees, fundingStage, fundingAmount, description, ceo, website
    } = req.body;

    if (!name || !industry) {
      throw createError('이름과 산업 분야는 필수입니다.', 400);
    }

    const newStartup = await startups.create({
      name, industry,
      industryLabel: industryLabel || industry,
      foundedDate: foundedDate || new Date().toISOString().split('T')[0],
      location: location || '',
      employees: employees || 0,
      fundingStage: fundingStage || '',
      fundingAmount: fundingAmount || 0,
      description: description || '',
      ceo: ceo || '',
      website: website || ''
    });

    res.status(201).json({
      success: true,
      message: '스타트업이 등록되었습니다.',
      data: newStartup
    });
  } catch (error) {
    next(error);
  }
};

// 스타트업 수정 (관리자)
const updateStartup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await startups.findById(parseInt(id));

    if (!existing) {
      throw createError('스타트업을 찾을 수 없습니다.', 404);
    }

    const updated = await startups.update(parseInt(id), req.body);

    res.json({
      success: true,
      message: '스타트업 정보가 수정되었습니다.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 스타트업 삭제 (관리자)
const deleteStartup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await startups.findById(parseInt(id));

    if (!existing) {
      throw createError('스타트업을 찾을 수 없습니다.', 404);
    }

    await startups.delete(parseInt(id));

    res.json({
      success: true,
      message: '스타트업이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup
};
