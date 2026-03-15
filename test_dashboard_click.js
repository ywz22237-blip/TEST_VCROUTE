/**
 * 비로그인 대시보드 클릭 핸들러 단위 테스트
 * Node.js + 가벼운 DOM mock으로 실행
 */

// ── 미니 DOM mock ─────────────────────────────────

let preventDefaultCalled = false;
let navigatedTo = null;
let modalVisible = false;

const mockModal = {
  style: { display: 'none' },
};

const mockDocument = {
  getElementById: (id) => id === 'loginRequiredModal' ? mockModal : null,
};

const mockWindow = {
  location: { href: '' },
};

// ── handleDashboardLinkClick 인라인 재현 ─────────

function makeHandler(isLoggedInFn) {
  return async function handleDashboardLinkClick(e) {
    e.preventDefault();                      // 동기 호출
    const href = e.currentTarget.href;       // await 전에 저장
    const loggedIn = await isLoggedInFn();
    if (loggedIn) {
      mockWindow.location.href = href;
      return;
    }
    const modal = mockDocument.getElementById('loginRequiredModal');
    if (modal) modal.style.display = 'flex';
  };
}

// ── 테스트 유틸 ───────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

async function runTest(label, testFn) {
  console.log(`\n[테스트] ${label}`);
  // 매 테스트 전 초기화
  preventDefaultCalled = false;
  mockWindow.location.href = '';
  mockModal.style.display = 'none';
  await testFn();
}

// ── 테스트 케이스 ─────────────────────────────────

(async () => {

  // 1. 비로그인: e.preventDefault()가 동기적으로 즉시 호출되는가
  await runTest('비로그인 - e.preventDefault() 동기 호출 확인', async () => {
    let preventCalledBeforeAwait = false;
    let awaitReached = false;

    const handler = async function(e) {
      e.preventDefault();                 // 동기
      preventCalledBeforeAwait = !awaitReached;
      await new Promise(r => setTimeout(r, 0)); // await 시뮬레이션
      awaitReached = true;
      const modal = mockDocument.getElementById('loginRequiredModal');
      if (modal) modal.style.display = 'flex';
    };

    // 이벤트 객체 mock
    const e = {
      preventDefault: () => { preventDefaultCalled = true; },
      currentTarget: { href: 'http://localhost/dashboard.html' },
    };

    const promise = handler(e);
    // 핸들러가 리턴한 직후(첫 await 전) preventDefault가 호출됐어야 함
    assert(preventDefaultCalled, 'handler 리턴 전에 preventDefault 호출됨');
    assert(preventCalledBeforeAwait, 'await 이전에 preventDefault 호출됨');
    await promise;
  });

  // 2. 비로그인: 모달이 표시되는가
  await runTest('비로그인 - 로그인 모달 표시', async () => {
    const isLoggedIn = async () => false;
    const handler = makeHandler(isLoggedIn);

    const e = {
      preventDefault: () => { preventDefaultCalled = true; },
      currentTarget: { href: 'http://localhost/dashboard.html' },
    };

    await handler(e);

    assert(preventDefaultCalled, 'e.preventDefault() 호출됨');
    assert(mockModal.style.display === 'flex', '모달 display=flex (표시됨)');
    assert(mockWindow.location.href === '', '페이지 이동 없음');
  });

  // 3. 비로그인: 페이지 이동이 일어나지 않는가
  await runTest('비로그인 - 페이지 이동 차단', async () => {
    const isLoggedIn = async () => false;
    const handler = makeHandler(isLoggedIn);

    const e = {
      preventDefault: () => {},
      currentTarget: { href: 'http://localhost/dashboard.html' },
    };

    await handler(e);
    assert(mockWindow.location.href === '', 'dashboard.html 로 이동하지 않음');
  });

  // 4. 로그인 상태: 저장된 href로 직접 이동
  await runTest('로그인 상태 - 대시보드로 직접 이동', async () => {
    const isLoggedIn = async () => true;
    const handler = makeHandler(isLoggedIn);
    const dashboardUrl = 'http://localhost/dashboard.html';

    const e = {
      preventDefault: () => { preventDefaultCalled = true; },
      currentTarget: { href: dashboardUrl },
    };

    await handler(e);

    assert(preventDefaultCalled, 'e.preventDefault() 호출됨 (href는 수동 이동으로 처리)');
    assert(mockWindow.location.href === dashboardUrl, `window.location.href = "${dashboardUrl}" 로 이동`);
    assert(mockModal.style.display !== 'flex', '모달 표시 안 됨');
  });

  // 5. 로그인 상태: currentTarget이 null이어도 href가 보존되는가
  await runTest('로그인 상태 - await 후 currentTarget null이어도 href 보존', async () => {
    const isLoggedIn = async () => true;
    const savedHref = 'http://localhost/pages/dashboard.html';

    const handler = async function(e) {
      e.preventDefault();
      const href = e.currentTarget.href;   // 저장
      e.currentTarget = null;              // await 후 null 시뮬레이션
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        mockWindow.location.href = href;   // 저장값 사용
        return;
      }
    };

    const e = {
      preventDefault: () => {},
      currentTarget: { href: savedHref },
    };

    await handler(e);
    assert(mockWindow.location.href === savedHref, 'href 사전 저장으로 정상 이동');
  });

  // ── 결과 출력 ───────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`결과: ${passed}/${passed + failed} 통과`);
  if (failed === 0) {
    console.log('모든 테스트 통과 ✅');
  } else {
    console.error(`${failed}개 실패 ❌`);
    process.exit(1);
  }

})();
