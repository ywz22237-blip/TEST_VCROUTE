/**
 * 비로그인 대시보드 클릭 핸들러 단위 테스트
 * interceptDashboardLinks의 href 교체 방식 검증
 */

// ── 미니 DOM mock ─────────────────────────────────

let navigatedTo = null;
let modalVisible = false;

const mockModal = { style: { display: 'none' } };
const mockDocument = {
  getElementById: (id) => id === 'loginRequiredModal' ? mockModal : null,
};
const mockWindow = { location: { href: '' } };

// ── interceptDashboardLinks 핵심 로직 재현 ────────

function makeInterceptedLink(originalHref, isLoggedInFn) {
  const link = { href: originalHref, _clickHandlers: [] };
  link.addEventListener = (_, fn) => link._clickHandlers.push(fn);
  link.click = async () => { for (const fn of link._clickHandlers) await fn(); };

  // interceptDashboardLinks 핵심 로직
  const dashboardHref = link.href;
  link.href = 'javascript:void(0)';   // 기본 이동 제거
  link.addEventListener('click', async () => {
    const loggedIn = await isLoggedInFn();
    if (loggedIn) {
      mockWindow.location.href = dashboardHref;
    } else {
      mockDocument.getElementById('loginRequiredModal').style.display = 'flex';
    }
  });

  return link;
}

// ── 테스트 유틸 ───────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✅ PASS: ${label}`); passed++; }
  else           { console.error(`  ❌ FAIL: ${label}`); failed++; }
}

async function runTest(label, testFn) {
  console.log(`\n[테스트] ${label}`);
  mockWindow.location.href = '';
  mockModal.style.display = 'none';
  await testFn();
}

// ── 테스트 케이스 ─────────────────────────────────

(async () => {

  // 1. href가 javascript:void(0)으로 교체되는가
  await runTest('링크 href가 javascript:void(0)으로 교체됨', async () => {
    const link = makeInterceptedLink('http://localhost/dashboard.html', async () => false);
    assert(link.href === 'javascript:void(0)', 'href = javascript:void(0)');
  });

  // 2. 비로그인: 모달 표시, 페이지 이동 없음
  await runTest('비로그인 - 모달 표시, 이동 없음', async () => {
    const link = makeInterceptedLink('http://localhost/dashboard.html', async () => false);
    await link.click();
    assert(mockModal.style.display === 'flex', '모달 표시됨');
    assert(mockWindow.location.href === '', '페이지 이동 없음');
  });

  // 3. 비로그인: e.preventDefault 호출 필요 없음 (href 제거로 해결)
  await runTest('비로그인 - preventDefault 없이도 이동 차단', async () => {
    const link = makeInterceptedLink('http://localhost/dashboard.html', async () => false);
    // href가 javascript:void(0)이므로 click 자체가 이동 안 함
    await link.click();
    assert(mockWindow.location.href !== 'http://localhost/dashboard.html', 'dashboard.html로 이동 안 함');
  });

  // 4. 로그인 상태: 저장된 원래 URL로 이동
  await runTest('로그인 상태 - 원래 dashboard.html URL로 이동', async () => {
    const original = 'http://localhost/dashboard.html';
    const link = makeInterceptedLink(original, async () => true);
    await link.click();
    assert(mockWindow.location.href === original, `window.location.href = "${original}"`);
    assert(mockModal.style.display !== 'flex', '모달 표시 안 됨');
  });

  // 5. /pages/ 경로의 상대 URL도 처리됨
  await runTest('pages/ 경로 상대 URL 처리', async () => {
    const original = 'http://localhost/pages/../dashboard.html';
    const link = makeInterceptedLink(original, async () => false);
    assert(link.href === 'javascript:void(0)', 'pages/ 링크도 href 교체됨');
    await link.click();
    assert(mockModal.style.display === 'flex', '비로그인 모달 표시됨');
  });

  // ── 결과 출력 ───────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`결과: ${passed}/${passed + failed} 통과`);
  if (failed === 0) { console.log('모든 테스트 통과 ✅'); }
  else { console.error(`${failed}개 실패 ❌`); process.exit(1); }

})();
