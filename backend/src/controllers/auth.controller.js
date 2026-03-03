const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { users, verificationCodes } = require('../models/data');
const { createError } = require('../utils/helpers');

// 회원가입
const register = async (req, res, next) => {
  try {
    const { email, password, name, userType, userId, phone, company, portfolio, bio, marketingAgree } = req.body;

    if (!email || !password || !name) {
      throw createError('이메일, 비밀번호, 이름은 필수입니다.', 400);
    }

    if (!userType || !['startup', 'investor'].includes(userType)) {
      throw createError('유효한 가입 유형을 선택해주세요.', 400);
    }

    const existingUser = await users.findByEmail(email);
    if (existingUser) {
      throw createError('이미 등록된 이메일입니다.', 409);
    }

    if (userId) {
      const existingId = await users.findByUserId(userId);
      if (existingId) {
        throw createError('이미 사용 중인 아이디입니다.', 409);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await users.create({
      userId: userId || null,
      email,
      password: hashedPassword,
      name,
      userType,
      phone: phone || null,
      company: company || null,
      portfolio: portfolio || null,
      bio: bio || null,
      marketingAgree: !!marketingAgree,
      role: 'user'
    });

    const token = jwt.sign(
      { userId: newUser.id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: {
          id: newUser.id,
          userId: newUser.userId,
          email: newUser.email,
          name: newUser.name,
          userType: newUser.userType,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 아이디 중복 확인
const checkId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      throw createError('아이디를 입력해주세요.', 400);
    }
    const exists = await users.findByUserId(userId);
    res.json({ success: true, available: !exists });
  } catch (error) {
    next(error);
  }
};

// 이메일 인증코드 발송
const sendEmailCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw createError('이메일을 입력해주세요.', 400);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await verificationCodes.set('email', email, code, Date.now() + 180000);

    console.log(`[이메일 인증] ${email}: ${code}`);

    res.json({ success: true, message: '인증코드가 발송되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 이메일 인증코드 확인
const verifyEmailCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const stored = await verificationCodes.get('email', email);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.json({ success: true, verified: false, message: '인증코드가 만료되었습니다.' });
    }

    if (stored.code === code) {
      await verificationCodes.delete('email', email);
      return res.json({ success: true, verified: true });
    }

    res.json({ success: true, verified: false, message: '인증코드가 일치하지 않습니다.' });
  } catch (error) {
    next(error);
  }
};

// 연락처 인증코드 발송
const sendPhoneCode = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) throw createError('연락처를 입력해주세요.', 400);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await verificationCodes.set('phone', phone, code, Date.now() + 180000);

    console.log(`[연락처 인증] ${phone}: ${code}`);

    res.json({ success: true, message: '인증코드가 발송되었습니다.' });
  } catch (error) {
    next(error);
  }
};

// 연락처 인증코드 확인
const verifyPhoneCode = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const stored = await verificationCodes.get('phone', phone);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.json({ success: true, verified: false, message: '인증코드가 만료되었습니다.' });
    }

    if (stored.code === code) {
      await verificationCodes.delete('phone', phone);
      return res.json({ success: true, verified: true });
    }

    res.json({ success: true, verified: false, message: '인증코드가 일치하지 않습니다.' });
  } catch (error) {
    next(error);
  }
};

// 로그인
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('아이디 또는 이메일과 비밀번호를 입력해주세요.', 400);
    }

    const user = await users.findByEmailOrUserId(email);
    if (!user) {
      throw createError('아이디(이메일) 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw createError('아이디(이메일) 또는 비밀번호가 일치하지 않습니다.', 401);
    }

    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// 내 정보 조회
const getMe = (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

// 비밀번호 변경
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      throw createError('현재 비밀번호와 새 비밀번호를 입력해주세요.', 400);
    }

    const user = await users.findById(userId);
    if (!user) {
      throw createError('사용자를 찾을 수 없습니다.', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw createError('현재 비밀번호가 일치하지 않습니다.', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await users.update(userId, { password: hashedPassword });

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

// 회원 탈퇴
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await users.findById(userId);

    if (!user) {
      throw createError('사용자를 찾을 수 없습니다.', 404);
    }

    await users.delete(userId);

    res.json({
      success: true,
      message: '계정이 삭제되었습니다.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  deleteAccount,
  checkId,
  sendEmailCode,
  verifyEmailCode,
  sendPhoneCode,
  verifyPhoneCode
};
