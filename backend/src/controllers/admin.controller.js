const { users, investors, startups, funds, notices, bookmarks } = require('../models/data');
const { paginate, createError } = require('../utils/helpers');

// 대시보드 통계
const getDashboardStats = async (req, res, next) => {
  try {
    const [userCount, investorCount, startupCount, fundCount, noticeCount] = await Promise.all([
      users.count(),
      investors.count(),
      startups.count(),
      funds.count(),
      notices.count()
    ]);

    const allUsers = await users.findAll();
    const recentUsers = allUsers.slice(-5).reverse();

    const stats = {
      totalUsers: userCount,
      totalInvestors: investorCount,
      totalStartups: startupCount,
      totalFunds: fundCount,
      totalNotices: noticeCount,
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt
      })),
      recentActivity: [
        { type: '회원가입', count: allUsers.filter(u => u.role === 'user').length },
        { type: '투자자', count: investorCount },
        { type: '스타트업', count: startupCount },
        { type: '펀드', count: fundCount }
      ]
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// 전체 사용자 조회
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;

    let allUsers = await users.findAll();
    let filtered = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    }));

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query)
      );
    }

    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }

    const result = paginate(filtered, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 사용자 역할 변경
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      throw createError('유효하지 않은 역할입니다.', 400);
    }

    const user = await users.findById(parseInt(id));
    if (!user) {
      throw createError('사용자를 찾을 수 없습니다.', 404);
    }

    const updated = await users.update(parseInt(id), { role });

    res.json({
      success: true,
      message: '사용자 역할이 변경되었습니다.',
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
};

// 사용자 삭제 (관리자)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await users.findById(parseInt(id));

    if (!user) {
      throw createError('사용자를 찾을 수 없습니다.', 404);
    }

    if (user.id === req.user.id) {
      throw createError('자신의 계정은 삭제할 수 없습니다.', 400);
    }

    await bookmarks.deleteByUserId(parseInt(id));
    await users.delete(parseInt(id));

    res.json({ success: true, message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 공지사항 조회
const getAllNotices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    const filtered = await notices.findAll({ category });
    const result = paginate(filtered, parseInt(page), parseInt(limit));

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 공지사항 생성
const createNotice = async (req, res, next) => {
  try {
    const { category, tag, title, summary, content, author, authorRole } = req.body;

    if (!title || !content) {
      throw createError('제목과 내용은 필수입니다.', 400);
    }

    const newNotice = await notices.create({
      category: category || 'notice',
      tag: tag || '# 공지',
      title,
      summary: summary || title,
      author: author || req.user.name,
      authorRole: authorRole || 'Admin',
      content
    });

    res.status(201).json({
      success: true,
      message: '공지사항이 등록되었습니다.',
      data: newNotice
    });
  } catch (error) {
    next(error);
  }
};

// 공지사항 수정
const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await notices.findById(parseInt(id));

    if (!existing) {
      throw createError('공지사항을 찾을 수 없습니다.', 404);
    }

    const updated = await notices.update(parseInt(id), req.body);

    res.json({
      success: true,
      message: '공지사항이 수정되었습니다.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 공지사항 삭제
const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await notices.findById(parseInt(id));

    if (!existing) {
      throw createError('공지사항을 찾을 수 없습니다.', 404);
    }

    await notices.delete(parseInt(id));

    res.json({ success: true, message: '공지사항이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice
};
