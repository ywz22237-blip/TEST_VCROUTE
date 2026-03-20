# VC Route - 프로젝트 컨텍스트

## 프로젝트 개요
**VC Route**는 스타트업과 VC(벤처캐피탈) 투자자를 연결하는 매칭 플랫폼입니다.
- GitHub: https://github.com/ywz22237-blip/TEST_VCROUTE
- 배포: Vercel

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML / CSS / Vanilla JavaScript |
| 백엔드 | Node.js + Express.js |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | JWT (`jsonwebtoken`) + `bcryptjs` |
| 파일 업로드 | Multer + xlsx |
| 배포 | Vercel (`vercel.json`) |

---

## 폴더 구조

```
TEST_VCROUTE/
├── frontend/               # 정적 프론트엔드 (HTML/CSS/JS)
│   ├── index.html          # 메인 랜딩 페이지
│   ├── dashboard.html      # 대시보드
│   ├── investors.html      # 투자자 목록
│   ├── startups.html       # 스타트업 목록
│   ├── DCF.html            # DCF 분석
│   ├── ir-score.html       # IR 점수
│   ├── fund.html           # 펀드 정보
│   ├── notice.html         # 공지사항
│   ├── pricing.html        # 가격 정책
│   ├── legal.html          # 법적 고지
│   ├── admin/              # 관리자 페이지
│   ├── css/                # 스타일시트
│   ├── js/                 # 자바스크립트
│   ├── image/              # 이미지 자산
│   └── pages/              # 추가 페이지
│
├── backend/
│   └── src/
│       ├── server.js       # 서버 진입점 (PORT: 5000)
│       ├── app.js          # Express 앱 설정
│       ├── routes/         # API 라우트
│       ├── controllers/    # 비즈니스 로직
│       ├── models/         # 데이터 모델
│       ├── middlewares/    # 미들웨어 (auth, errorHandler)
│       ├── config/         # 설정 파일 (Supabase 연결 등)
│       └── utils/          # 유틸리티 함수
│
├── api/
│   └── index.js            # Vercel Serverless API 진입점
│
├── supabase/               # Supabase 마이그레이션 / 설정
├── supabase_setup.sql      # DB 초기 스키마
├── vercel.json             # Vercel 배포 설정
└── package.json            # 루트 패키지 설정
```

---

## API 라우트 목록

| 라우트 | 설명 |
|--------|------|
| `POST /api/auth/register` | 회원가입 |
| `POST /api/auth/login` | 로그인 |
| `GET/PUT /api/users/:id` | 사용자 조회/수정 |
| `GET/POST /api/investors` | 투자자 목록/등록 |
| `GET/POST /api/startups` | 스타트업 목록/등록 |
| `GET/POST /api/funds` | 펀드 정보 |
| `GET/POST /api/bookmarks` | 북마크 |
| `GET/POST /api/admin` | 관리자 기능 |
| `GET/POST /api/notices` | 공지사항 |
| `POST /api/upload` | 파일 업로드 (xlsx, csv) |
| `GET /api/health` | 헬스 체크 |

---

## 환경 변수 (.env)

```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
```

> ⚠️ `.env` 파일은 절대 커밋하지 마세요. `.gitignore`에 포함되어 있습니다.

---

## 개발 서버 실행

```bash
# 루트 디렉토리에서
npm run dev         # nodemon으로 백엔드 실행 (포트 5000)
npm start           # 프로덕션 모드 실행

# .env 파일이 backend/ 폴더에 있어야 합니다
cp backend/env.example backend/.env
```

---

## 코딩 컨벤션

### 백엔드
- 파일명: `kebab-case.js` (예: `auth.routes.js`, `errorHandler.js`)
- 함수명: `camelCase`
- 라우트 파일은 `backend/src/routes/`에, 컨트롤러는 `backend/src/controllers/`에 분리
- 모든 API 응답은 `{ success: true/false, data: ..., message: ... }` 형식
- 에러 처리는 `next(error)` 패턴 사용

### 프론트엔드
- 페이지 파일: `kebab-case.html`
- CSS는 `frontend/css/` 폴더에 분리
- JS 모듈은 `frontend/js/` 폴더에 분리
- Vanilla JS 사용 (프레임워크 없음)

---

## 새 API 엔드포인트 추가 방법

1. `backend/src/routes/[name].routes.js` 생성
2. `backend/src/controllers/[name].controller.js` 생성
3. `backend/src/app.js`에 라우트 등록:
   ```js
   const newRoutes = require('./routes/[name].routes');
   app.use('/api/[name]', newRoutes);
   ```

---

## Git 워크플로우

```bash
git add .
git commit -m "feat: 기능 설명"
git push origin main
```

### 커밋 메시지 컨벤션
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 코드 개선
- `style:` UI/CSS 변경
- `docs:` 문서 수정

---

## Vercel 배포

```bash
vercel --prod
```

또는 GitHub `main` 브랜치에 push하면 자동 배포됩니다.

---

## 주의사항

1. `.env` 파일 절대 커밋 금지
2. Supabase Service Role Key는 백엔드에서만 사용 (프론트엔드 노출 금지)
3. 새 페이지 추가 시 `vercel.json` routes 설정 확인 필요
4. `nodemon`이 없으면 `npm install -g nodemon` 또는 `npx nodemon` 사용
