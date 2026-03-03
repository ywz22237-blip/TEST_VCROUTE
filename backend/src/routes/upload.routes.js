const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadController = require('../controllers/upload.controller');
const { authenticate, isAdmin } = require('../middlewares/auth');

// uploads 폴더 생성
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const allowedExtensions = ['.csv', '.xls', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('CSV 또는 엑셀 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  }
});

// 모든 업로드 라우트는 관리자 권한 필요
router.use(authenticate);
router.use(isAdmin);

// 투자자 일괄 업로드
router.post('/investors', upload.single('file'), uploadController.uploadInvestors);

// 스타트업 일괄 업로드
router.post('/startups', upload.single('file'), uploadController.uploadStartups);

// 펀드 일괄 업로드
router.post('/funds', upload.single('file'), uploadController.uploadFunds);

// 공지사항 일괄 업로드
router.post('/notices', upload.single('file'), uploadController.uploadNotices);

// 데이터 내보내기
router.get('/export/:type', uploadController.exportData);

module.exports = router;
