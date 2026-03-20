const jwt = require('jsonwebtoken');
const config = require('../config');
const { users } = require('../models/data');
const supabase = require('../config/supabase');

// Verify JWT token (Supabase JWT 우선, 커스텀 JWT fallback)
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.'
    });
  }

  const token = authHeader.split(' ')[1];

  // 1. Supabase JWT 검증 시도
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const meta = data.user.user_metadata || {};
      req.user = {
        id: data.user.id,
        userId: meta.username || null,
        email: data.user.email,
        name: meta.full_name || meta.name || data.user.email,
        role: meta.role || 'user',
        userType: meta.userType || meta.user_type || null,
        phone: meta.phone || null,
        company: meta.company || meta.co_name || null,
        portfolio: meta.portfolio || null,
        bio: meta.bio || null,
        marketingAgree: false,
      };
      return next();
    }
  } catch (_) { /* Supabase 검증 실패 시 커스텀 JWT로 fallback */ }

  // 2. 커스텀 JWT 검증
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await users.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    req.user = {
      id: user.id,
      userId: user.userId || null,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType || null,
      phone: user.phone || null,
      company: user.company || null,
      portfolio: user.portfolio || null,
      bio: user.bio || null,
      marketingAgree: user.marketingAgree || false,
      createdAt: user.createdAt
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }
};

module.exports = { authenticate, isAdmin };
