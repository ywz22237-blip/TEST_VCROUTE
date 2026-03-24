const express = require('express');
const multer = require('multer');
const router = express.Router();
const { startAnalysis, getResult } = require('../controllers/analysis.controller');

// PDF 파일을 임시 저장 (uploads/ 폴더)
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('PDF 파일만 업로드 가능합니다.'));
    }
  },
});

// POST /api/analysis/start  — PDF 업로드 + 분석 시작
router.post('/start', upload.single('file'), startAnalysis);

// GET  /api/analysis/:taskId — 결과 조회 (폴링)
router.get('/:taskId', getResult);

module.exports = router;
