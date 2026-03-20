---
description: 로컬 개발 서버 실행
---

# 개발 서버 실행

## 1. 환경 변수 확인
```bash
ls backend/.env
```
`.env` 파일이 없으면 생성합니다:
```bash
cp backend/env.example backend/.env
```
그런 다음 `backend/.env` 파일을 열어 Supabase URL과 키를 입력하세요.

## 2. 의존성 설치 (최초 1회)
```bash
npm install
cd backend && npm install && cd ..
```

// turbo
## 3. 개발 서버 시작
```bash
npm run dev
```
백엔드 API 서버가 **http://localhost:5000** 에서 실행됩니다.

## 4. 프론트엔드 확인
`frontend/` 폴더의 HTML 파일을 브라우저에서 직접 열거나,
VS Code의 Live Server 익스텐션을 사용하세요.

## 5. 헬스 체크
```bash
curl http://localhost:5000/api/health
```
`{ "status": "ok" }` 응답이 오면 서버가 정상 실행 중입니다.
