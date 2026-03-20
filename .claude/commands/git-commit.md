---
description: 변경사항을 깃허브에 커밋하고 푸시
---

# Git 커밋 & 푸시 워크플로우

## 1. 변경된 파일 확인
```bash
git status
git diff --stat
```

## 2. 스테이징
```bash
# 전체 변경사항 추가
git add .

# 특정 파일만 추가할 경우
# git add frontend/index.html backend/src/routes/auth.routes.js
```

## 3. 커밋
```bash
git commit -m "feat: $ARGUMENTS"
```
> `$ARGUMENTS`에 커밋 메시지를 입력하세요.

### 커밋 메시지 컨벤션
| 접두어 | 사용 목적 |
|--------|-----------|
| `feat:` | 새 기능 추가 |
| `fix:` | 버그 수정 |
| `refactor:` | 코드 리팩토링 |
| `style:` | UI/CSS 변경 |
| `docs:` | 문서 수정 |
| `chore:` | 설정/빌드 변경 |

## 4. 푸시
```bash
git push origin main
```

## 5. 확인
https://github.com/ywz22237-blip/TEST_VCROUTE 에서 커밋 확인
