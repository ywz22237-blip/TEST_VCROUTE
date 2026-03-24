/**
 * analysis.controller.js
 * AI.ROUTE 연동 프록시 컨트롤러
 *
 * POST /api/analysis/start           → AI.ROUTE /v1/route/analyze        (단일 PDF)
 * POST /api/analysis/start/multi     → AI.ROUTE /v1/route/analyze/multi  (3개 PDF 교차검증)
 * GET  /api/analysis/:taskId         → AI.ROUTE /v1/route/report/:taskId
 * POST /api/analysis/chat/start/:id  → AI.ROUTE /v1/route/chat/start/:id (SSE 스트리밍)
 * POST /api/analysis/chat/message    → AI.ROUTE /v1/route/chat/message   (SSE 스트리밍)
 */

const axios = require('axios');
const FormData = require('form-data');
const supabase = require('../config/supabase');

// env 없을 경우 Railway 기본값 fallback
const AI_ROUTE_URL = process.env.AI_ROUTE_URL || 'https://ai-route-production-7b73.up.railway.app';
const ROUTE_API_KEY = process.env.ROUTE_API_KEY || 'vcroute-745c6e4b9b268d24e779a6488cb097c1';

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
  try {
    // 로그인 확인
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    // 파일 확인 (memoryStorage: file.buffer 사용)
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'PDF 파일이 없습니다.' });
    }

    const { sector = '기타', stage = 'Seed', mode = 'simple', company_name } = req.body;

    // AI.ROUTE로 보낼 FormData 구성 (buffer 직접 전달)
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname || 'ir.pdf',
      contentType: file.mimetype || 'application/pdf',
      knownLength: file.buffer.length,
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

    res.json({ success: true, data: response.data });
  } catch (e) {

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

// ── POST /api/analysis/start/multi ──────────────────────────────
// 3개 PDF를 받아 AI.ROUTE 멀티에이전트 분석 시작
exports.startMultiAnalysis = async (req, res, next) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    // multer fields: ir_deck (필수), biz_plan (선택), financials (선택) — memoryStorage
    const irDeckFile     = req.files?.ir_deck?.[0];
    const bizPlanFile    = req.files?.biz_plan?.[0];
    const financialsFile = req.files?.financials?.[0];

    if (!irDeckFile) {
      return res.status(400).json({ success: false, message: '회사소개서(ir_deck) PDF가 필요합니다.' });
    }

    const { sector = '기타', stage = 'Seed', company_name } = req.body;

    // AI.ROUTE multi 엔드포인트로 보낼 FormData 구성 (buffer 직접 전달)
    const form = new FormData();

    form.append('ir_deck', irDeckFile.buffer, {
      filename: irDeckFile.originalname || 'ir_deck.pdf',
      contentType: 'application/pdf',
      knownLength: irDeckFile.buffer.length,
    });

    if (bizPlanFile) {
      form.append('biz_plan', bizPlanFile.buffer, {
        filename: bizPlanFile.originalname || 'biz_plan.pdf',
        contentType: 'application/pdf',
        knownLength: bizPlanFile.buffer.length,
      });
    }

    if (financialsFile) {
      form.append('financials', financialsFile.buffer, {
        filename: financialsFile.originalname || 'financials.pdf',
        contentType: 'application/pdf',
        knownLength: financialsFile.buffer.length,
      });
    }

    form.append('sector', sector);
    form.append('stage', stage);
    if (company_name) form.append('company_name', company_name);

    const response = await axios.post(
      `${AI_ROUTE_URL}/v1/route/analyze/multi`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-API-Key': ROUTE_API_KEY,
        },
        timeout: 30000,
      }
    );

    res.json({ success: true, data: response.data });
  } catch (e) {
    if (e.response) {
      return res.status(e.response.status).json({
        success: false,
        message: e.response.data?.detail || 'AI 멀티에이전트 심사 서버 오류',
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

// ── POST /api/analysis/chat/start/:taskId ────────────────────────
// AI 심사역 첫 질문 — AI.ROUTE SSE를 프론트엔드로 그대로 파이프
exports.startExaminerChat = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const upstream = await axios.post(
      `${AI_ROUTE_URL}/v1/route/chat/start/${taskId}`,
      {},
      {
        headers: { 'X-API-Key': ROUTE_API_KEY },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    // AI.ROUTE SSE → 클라이언트로 파이프
    upstream.data.pipe(res);

    upstream.data.on('end', () => res.end());
    upstream.data.on('error', (err) => {
      console.error('[examiner.start] upstream error', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

    req.on('close', () => upstream.data.destroy());
  } catch (e) {
    console.error('[examiner.start] error', e.message);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// ── POST /api/analysis/chat/message ──────────────────────────────
// AI 심사역 피드백 + 다음 질문 — AI.ROUTE SSE를 프론트엔드로 파이프
exports.sendExaminerMessage = async (req, res, next) => {
  try {
    const { task_id, messages } = req.body;
    if (!task_id || !messages) {
      return res.status(400).json({ success: false, message: 'task_id와 messages가 필요합니다.' });
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const upstream = await axios.post(
      `${AI_ROUTE_URL}/v1/route/chat/message`,
      { task_id, messages },
      {
        headers: {
          'X-API-Key': ROUTE_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    upstream.data.pipe(res);

    upstream.data.on('end', () => res.end());
    upstream.data.on('error', (err) => {
      console.error('[examiner.message] upstream error', err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });

    req.on('close', () => upstream.data.destroy());
  } catch (e) {
    console.error('[examiner.message] error', e.message);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};
