/**
 * analysis.controller.js
 * AI.ROUTE 연동 프록시 컨트롤러
 *
 * POST /api/analysis/start  → AI.ROUTE /v1/route/analyze
 * GET  /api/analysis/:taskId → AI.ROUTE /v1/route/report/:taskId
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const supabase = require('../config/supabase');

const AI_ROUTE_URL = process.env.AI_ROUTE_URL;
const ROUTE_API_KEY = process.env.ROUTE_API_KEY;

// Supabase JWT로 유저 추출
async function getUserFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// ── POST /api/analysis/start ─────────────────────────────────────
// 프론트엔드에서 PDF + 섹터/단계/모드를 받아 AI.ROUTE에 전달
exports.startAnalysis = async (req, res, next) => {
  let filePath = null;
  try {
    // 로그인 확인
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    // 파일 확인
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'PDF 파일이 없습니다.' });
    }
    filePath = file.path;

    const { sector = '기타', stage = 'Seed', mode = 'simple', company_name } = req.body;

    // AI.ROUTE로 보낼 FormData 구성
    const form = new FormData();
    form.append('file', fs.createReadStream(file.path), {
      filename: file.originalname || 'ir.pdf',
      contentType: file.mimetype || 'application/pdf',
    });
    form.append('sector', sector);
    form.append('stage', stage);
    form.append('mode', mode);
    if (company_name) form.append('company_name', company_name);

    // AI.ROUTE 호출
    const response = await axios.post(
      `${AI_ROUTE_URL}/v1/route/analyze`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': ROUTE_API_KEY,
        },
        timeout: 30000,
      }
    );

    // 임시 업로드 파일 삭제
    fs.unlink(filePath, () => {});

    res.json({ success: true, data: response.data });
  } catch (e) {
    // 임시 파일 정리
    if (filePath) fs.unlink(filePath, () => {});

    // AI.ROUTE 에러 메시지 전달
    if (e.response) {
      return res.status(e.response.status).json({
        success: false,
        message: e.response.data?.detail || 'AI 심사 서버 오류',
      });
    }
    next(e);
  }
};

// ── GET /api/analysis/:taskId ────────────────────────────────────
// 분석 결과 조회 (프론트엔드가 폴링)
exports.getResult = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const response = await axios.get(
      `${AI_ROUTE_URL}/v1/route/report/${taskId}`,
      {
        headers: { 'X-API-Key': ROUTE_API_KEY },
        timeout: 10000,
      }
    );

    res.json({ success: true, data: response.data });
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        success: false,
        message: e.response.data?.detail || '결과 조회 실패',
      });
    }
    next(e);
  }
};
