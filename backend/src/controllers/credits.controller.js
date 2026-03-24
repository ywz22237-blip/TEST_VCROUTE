const supabase = require('../config/supabase');

// Supabase JWT에서 유저 추출
async function getUserFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// POST /api/credits/use — 크레딧 차감
exports.useCredit = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    const { mode } = req.body; // 'simple' | 'premium' | 'reanalysis'
    if (!['simple', 'premium', 'reanalysis'].includes(mode)) {
      return res.status(400).json({ success: false, message: '유효하지 않은 모드입니다.' });
    }

    const { data: cr, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!cr) return res.status(404).json({ success: false, message: '크레딧 정보가 없습니다.' });

    const now = new Date();

    // 차감 가능 여부 확인
    if (mode === 'simple' && cr.simple_cr <= 0) {
      return res.status(400).json({ success: false, message: '간단심사 크레딧이 부족합니다.' });
    }
    if (mode === 'premium' && cr.premium_cr <= 0) {
      return res.status(400).json({ success: false, message: '정밀심사 크레딧이 부족합니다.' });
    }
    if (mode === 'reanalysis') {
      const valid = cr.reanalysis_cr > 0 && cr.reanalysis_expires_at && new Date(cr.reanalysis_expires_at) > now;
      if (!valid) return res.status(400).json({ success: false, message: '재심사 크레딧이 없거나 만료되었습니다.' });
    }

    // 차감
    const updates = { updated_at: now.toISOString() };
    if (mode === 'simple')     updates.simple_cr = cr.simple_cr - 1;
    if (mode === 'premium') {
      updates.premium_cr = cr.premium_cr - 1;
      // 정밀심사 완료 시 재심사 크레딧 1개 지급 (6시간 유효)
      updates.reanalysis_cr = 1;
      updates.reanalysis_expires_at = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
    }
    if (mode === 'reanalysis') updates.reanalysis_cr = cr.reanalysis_cr - 1;

    const { error: updateError } = await supabase
      .from('user_credits')
      .update(updates)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: '크레딧이 차감되었습니다.' });
  } catch (e) {
    next(e);
  }
};

// GET /api/credits
exports.getCredits = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });

    // 크레딧 조회
    let { data: cr, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    // 레코드 없으면 신규 생성
    if (!cr) {
      const { data: newCr, error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id })
        .select()
        .single();
      if (insertError) throw insertError;
      cr = newCr;
    }

    // 간단심사 일일 리셋 (매일 자정 1개 충전, 0개일 때만)
    const today = new Date().toISOString().split('T')[0];
    if (cr.last_simple_reset !== today && cr.simple_cr === 0) {
      const { data: updated } = await supabase
        .from('user_credits')
        .update({ simple_cr: 1, last_simple_reset: today, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();
      if (updated) cr = updated;
    }

    res.json({
      success: true,
      data: {
        simple: cr.simple_cr,
        premium: cr.premium_cr,
        reanalysis: cr.reanalysis_cr,
        reanalysisExpires: cr.reanalysis_expires_at,
      },
    });
  } catch (e) {
    next(e);
  }
};
