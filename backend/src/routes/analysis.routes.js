const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  startAnalysis,
  startMultiAnalysis,
  getResult,
  startExaminerChat,
  sendExaminerMessage,
} = require('../controllers/analysis.controller');

// 공통 multer 설정 (PDF 전용)
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('PDF 파일만 업로드 가능합니다.'));
  }
};

const uploadSingle = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: pdfFilter,
});

// 멀티에이전트용: ir_deck(필수) + biz_plan(선택) + financials(선택)
const uploadMulti = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 각 파일 50MB
  fileFilter: pdfFilter,
});

// POST /api/analysis/start       — 단일 PDF 분석 (기존)
router.post('/start', uploadSingle.single('file'), startAnalysis);

// POST /api/analysis/start/multi — 3개 PDF 멀티에이전트 분석
router.post(
  '/start/multi',
  uploadMulti.fields([
    { name: 'ir_deck',    maxCount: 1 },
    { name: 'biz_plan',   maxCount: 1 },
    { name: 'financials', maxCount: 1 },
  ]),
  startMultiAnalysis
);

// GET  /api/analysis/:taskId           — 결과 조회 (폴링, 단일/멀티 공통)
// ※ chat 라우트보다 반드시 먼저 등록 (/:taskId가 /chat/* 를 가로채지 않도록)
router.get('/:taskId', getResult);

// POST /api/analysis/chat/start/:taskId — AI 심사역 첫 질문 (SSE)
router.post('/chat/start/:taskId', startExaminerChat);

// POST /api/analysis/chat/message       — AI 심사역 피드백+다음질문 (SSE)
router.post('/chat/message', sendExaminerMessage);

module.exports = router;
