const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { users } = require('../models/data');

const MAX_SESSIONS = 3;

async function getUserFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  // Supabase JWT 우선
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return data.user;
  } catch (_) {}

  // 커스텀 JWT fallback
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await users.findById(decoded.userId);
    if (user) return { id: user.id, email: user.email };
  } catch (_) {}

  return null;
}

function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function getDeviceHint(ua = '') {
  if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
  return 'desktop';
}

// POST /api/sessions/register — 로그인 후 세션 등록
exports.registerSession = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const ip = getIp(req);
    const ua = req.headers['user-agent'] || '';
    const sessionId = req.body.sessionId;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId 필요' });

    // 활성 세션 목록 조회 (오래된 순)
    const { data: activeSessions } = await supabase
      .from('user_sessions')
      .select('id, ip_address, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_seen_at', { ascending: true });

    // 동일 IP에서 이미 세션이 있으면 갱신만 (중복 등록 방지)
    const sameIp = activeSessions?.find(s => s.ip_address === ip);

    // MAX 초과 시 가장 오래된 세션 만료
    if (!sameIp && activeSessions && activeSessions.length >= MAX_SESSIONS) {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', activeSessions[0].id);
    }

    // 세션 upsert
    await supabase.from('user_sessions').upsert({
      user_id: user.id,
      session_id: sessionId,
      ip_address: ip,
      user_agent: ua,
      device_hint: getDeviceHint(ua),
      is_active: true,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'session_id' });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

// GET /api/sessions — 활성 세션 목록
exports.getSessions = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, ip_address, device_hint, user_agent, created_at, last_seen_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_seen_at', { ascending: false });

    if (error) throw error;

    const currentSessionId = req.body.sessionId || req.headers['x-session-id'];

    const sessions = (data || []).map(s => ({
      id: s.id,
      ip: s.ip_address,
      device: s.device_hint,
      browser: parseBrowser(s.user_agent),
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      isCurrent: s.session_id === currentSessionId,
    }));

    res.json({ success: true, data: sessions });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/sessions/others — 현재 세션 제외 모두 만료
exports.revokeOthers = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const currentSessionId = req.body.sessionId || req.headers['x-session-id'];

    const query = supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (currentSessionId) query.neq('session_id', currentSessionId);

    const { error } = await query;
    if (error) throw error;

    res.json({ success: true, message: '다른 기기에서 로그아웃 처리되었습니다.' });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/sessions/:id — 특정 세션 만료
exports.revokeSession = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .eq('user_id', user.id); // 본인 세션만 만료 가능

    if (error) throw error;

    res.json({ success: true, message: '세션이 만료되었습니다.' });
  } catch (e) {
    next(e);
  }
};

function parseBrowser(ua = '') {
  if (/Chrome/i.test(ua) && !/Chromium|Edge/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Edge/i.test(ua)) return 'Edge';
  return '알 수 없음';
}
