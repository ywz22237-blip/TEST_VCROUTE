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

## IR 심사 모드 스펙

> AI Route API 연동 시 `mode` 파라미터로 전달

### 핵심 구분 원칙
- **간단/재심사**: PDF → Claude 분석만 (외부 공공데이터 API 호출 없음)
- **정밀**: PDF → 공공데이터 6종 병렬 수집 → Claude 심층 분석
- 공공데이터 수집 여부가 비용/시간의 핵심 차이

### simple (간단심사) — `simple_cr`
| 항목 | 내용 |
|------|------|
| 대상 | 초기 스크리닝, 관심 여부 판단 |
| 크레딧 | Free — 매일 자정 1개 충전 |
| 파이프라인 | PDF 파싱 → Claude 분석 |
| 공공데이터 | 수집 안 함 |
| 출력 | 5대 점수 + 핵심 지적 1개 + 누락 항목 목록 |
| 제외 | 점수 근거 상세, 개선 액션, 레이더 차트, 벤치마크, 특허 조회 |
| 속도 | ~30초 |

### premium (정밀심사) — `premium_cr`
| 항목 | 내용 |
|------|------|
| 대상 | 실제 투자 검토 단계 |
| 크레딧 | 유료 — 1+1 Pass ₩2,000 or 월정액 ₩20,000 (20회) |
| 파이프라인 | PDF 파싱 → 공공데이터 병렬 수집 → Claude 심층 분석 |
| 공공데이터 | DART, TIPS, KIPRIS(특허), K-Startup, KVIC, SMES 전부 |
| 출력 | 5대 점수 + 항목별 근거 + 개선 액션 + 레이더 차트 + 벤치마크 |
| 추가 | 동종 섹터 재무 비율 비교, 특허 현황, 매칭 지원 사업 목록 |
| 속도 | 2~3분 |
| 부가 효과 | 완료 즉시 `reanalysis_cr` 1개 자동 지급 (6시간 유효) |

### reanalyze (재심사) — `reanalysis_cr`
| 항목 | 내용 |
|------|------|
| 대상 | 정밀심사 후 CEO 답변/추가 자료 반영 |
| 크레딧 | 정밀심사 완료 시 자동 지급, 6시간 이내 사용 |
| 조건 | 해당 `task_id`의 정밀심사 `completed` + `reanalysis_expires_at` 이내 |
| 파이프라인 | 기존 정밀심사 캐시 + 사용자 추가 코멘트 주입 → Claude 재분석 |
| 공공데이터 | 재수집 안 함 (기존 벤치마크 재사용) |
| 출력 | 재분석 점수 + 이전 결과 대비 변동 (delta) |
| 제한 | 동일 `task_id`에 1회만 (`reanalysis_used = true`) |
| 속도 | ~30초 |

### 기능 비교표
```
기능                    간단    정밀    재심사
─────────────────────────────────────────────
5대 점수                 ✓       ✓       ✓
점수별 근거              ✗       ✓       ✓
개선 액션                ✗       ✓       ✓
레이더 차트              ✗       ✓       ✓
벤치마크 (공공데이터)    ✗       ✓    재사용
특허 조회                ✗       ✓    재사용
이전 결과 비교 (delta)   ✗       ✗       ✓
추가 코멘트 반영         ✗       ✗       ✓
```

### AI Route API 연동 엔드포인트 (예정)
```
POST /v1/route/analyze          → mode: simple | premium
POST /v1/route/reanalyze        → task_id + comment (재심사 전용)
GET  /v1/route/report/{task_id} → 결과 조회
```

---

## 주의사항

1. `.env` 파일 절대 커밋 금지
2. Supabase Service Role Key는 백엔드에서만 사용 (프론트엔드 노출 금지)
3. 새 페이지 추가 시 `vercel.json` routes 설정 확인 필요
4. `nodemon`이 없으면 `npm install -g nodemon` 또는 `npx nodemon` 사용
