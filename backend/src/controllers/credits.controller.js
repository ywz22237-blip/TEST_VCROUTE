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
