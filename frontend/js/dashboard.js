document.addEventListener("DOMContentLoaded", () => {
  checkDashboardAuth();
  renderDashboard();
  initStoredFiles();

  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab) switchSection(tab);
});

// 대시보드 접근 권한 확인 및 프로필 로드
async function checkDashboardAuth() {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = "index.html";
    return;
  }
  loadUserProfile();
}

// 서버에서 최신 회원 정보 가져오기
async function loadUserProfile() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  let user = await getUserInfo();

  try {
    const response = await fetch(API_CONFIG.BASE_URL + '/api/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      const data = await response.json();
      user = data.data || data;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  } catch (e) {
    console.log('서버 연결 실패, 로컬 데이터 사용');
  }

  if (user) {
    _profileUser = user;
    renderUserProfile(user);
  }
}

// 현재 로그인된 유저 데이터 (편집용)
let _profileUser = null;

// 프로필 데이터를 UI에 렌더링
function renderUserProfile(user) {
  const typeLabel = user.userType === 'startup' ? '스타트업' :
                    user.userType === 'investor' ? '투자자' : '회원';
  const initial = (user.company || user.name || user.userId || user.email || '?')[0].toUpperCase();

  // 사이드바 유저 타입 뱃지
  const sidebar = document.getElementById('sidebarProfile');
  const typeEl = document.getElementById('sidebarType');
  if (sidebar) {
    sidebar.style.display = 'block';
    if (typeEl) {
      typeEl.textContent = typeLabel;
      if (user.userType === 'investor') {
        typeEl.style.background = 'rgba(245,158,11,0.1)';
        typeEl.style.color = '#f59e0b';
      } else {
        typeEl.style.background = 'rgba(37,99,235,0.1)';
        typeEl.style.color = '#2563eb';
      }
    }
  }

  // 프로필 섹션 상세
  const loginRequired = document.getElementById('profileLoginRequired');
  const profileContent = document.getElementById('profileContent');
  if (loginRequired) loginRequired.style.display = 'none';
  if (profileContent) profileContent.style.display = 'block';

  const avatarLarge = document.getElementById('profileAvatarLarge');
  if (avatarLarge) {
    if (user.logoUrl) {
      avatarLarge.innerHTML = `<img src="${user.logoUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      avatarLarge.innerHTML = initial;
    }
  }

  // 헤더: 기업명 표시
  setText('pName', user.company || user.name || user.userId || '-');

  const typeBadge = document.getElementById('pTypeBadge');
  if (typeBadge) {
    typeBadge.textContent = typeLabel;
    if (user.userType === 'investor') {
      typeBadge.style.background = 'rgba(245,158,11,0.2)';
    }
  }

  const dateLabel = user.userType === 'startup' ? '설립일: ' : '가입일: ';
  setText('pCreatedAt', user.createdAt ? dateLabel + user.createdAt : '');
  setText('pUserId', user.company || '-');
  setText('pEmail', user.email || '-');

  const phone = user.phone || '-';
  if (phone !== '-' && phone.length >= 10) {
    let formatted;
    if (phone.length === 12) {
      // 050X 번호: 4-4-4 포맷
      formatted = phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    } else {
      formatted = phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
    setText('pPhone', formatted);
  } else {
    setText('pPhone', phone);
  }

  // 대표자란에 이름 표시
  setText('pCompany', user.name || '-');

  // 인증
  const verifiedEl = document.getElementById('pVerified');
  if (verifiedEl) {
    if (user.verified) {
      verifiedEl.innerHTML = '<span style="color:#16a34a; font-weight:800;">✓ 인증완료</span>';
    } else {
      verifiedEl.textContent = '미인증';
    }
  }

  // 투자희망금액
  const investVal = parseFloat(user.investTarget);
  setText('pInvestTarget', (!isNaN(investVal) && investVal > 0) ? investVal + '억원' : (user.investTarget || '-'));

  // 대표자 나이
  setText('pCeoAge', user.ceoAge ? user.ceoAge + '세' : '-');

  // 성별
  setText('pGender', user.gender || '-');

  // 현황 — 즐겨찾기 실시간 집계
  const bm = BookmarkMgr.getBookmarks();
  const bmInvestors = (bm.investors || []).length;
  const bmFunds = (bm.funds || []).length;
  const bmStartups = (bm.startups || []).length;
  const bmTotal = bmInvestors + bmFunds + bmStartups;
  setText('pBmTotal', bmTotal);
  setText('pBmInvestors', bmInvestors);
  setText('pBmFunds', bmFunds);
  setText('pBmStartups', bmStartups);

  // 클릭 횟수 · 자료요청: localStorage 기반 실제 카운팅 (샘플 계정 포함)
  const uid = user.userId || user.username || '';
  const SAMPLE_STATS = { 'ywz22': { clickCount: 248, docRequest: 33, bookmarkTotal: 12 } };
  const isSample = SAMPLE_STATS[uid];

  // 샘플 계정은 미리 seeded 값 사용, 그 외 localStorage 누적값 사용
  const storedStats = JSON.parse(localStorage.getItem('vcr_stats_' + uid) || '{}');
  if (isSample && !storedStats._seeded) {
    const seeded = { clickCount: SAMPLE_STATS[uid].clickCount, docRequest: SAMPLE_STATS[uid].docRequest, _seeded: true };
    localStorage.setItem('vcr_stats_' + uid, JSON.stringify(seeded));
    storedStats.clickCount = seeded.clickCount;
    storedStats.docRequest = seeded.docRequest;
    if (bmTotal === 0 && isSample.bookmarkTotal > 0) {
      // 샘플 즐겨찾기 보정: localStorage에 시드된 경우 표시값 덮어쓰기
      setText('pBmTotal', SAMPLE_STATS[uid].bookmarkTotal);
    }
  }
  const clickCount = user.clickCount !== undefined ? user.clickCount : (storedStats.clickCount || 0);
  const docRequest = user.docRequest !== undefined ? user.docRequest : (storedStats.docRequest || 0);
  setText('pClickCount', clickCount);
  setText('pDocRequest', docRequest);

  const portfolioWrap = document.getElementById('pPortfolioWrap');
  const portfolioEl = document.getElementById('pPortfolio');
  if (portfolioWrap && user.portfolio) {
    portfolioWrap.style.display = 'block';
    const url = /^https?:\/\//i.test(user.portfolio) ? user.portfolio : 'https://' + user.portfolio;
    portfolioEl.textContent = user.portfolio;
    portfolioEl.href = url;
    portfolioEl.setAttribute('target', '_blank');
    portfolioEl.setAttribute('rel', 'noopener noreferrer');
    portfolioEl.onclick = function(e) {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  }

  const bioWrap = document.getElementById('pBioWrap');
  const bioEl = document.getElementById('pBio');
  const bio = user.bio || user.su_bio || user.inv_bio || '';
  if (bioWrap && bio) {
    bioWrap.style.display = 'block';
    bioEl.textContent = bio;
  }

  // 추가 정보 그리드 (회원가입 extra fields)
  renderExtraInfo(user);
}

function renderExtraInfo(user) {
  const wrap = document.getElementById('pExtraInfoWrap');
  const grid = document.getElementById('pExtraGrid');
  if (!wrap || !grid) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  const items = [];

  if (isInvestor) {
    if (user.inv_type)     items.push(['형태',   'fa-building',        user.inv_type]);
    if (user.inv_role)     items.push(['역할',   'fa-id-badge',        user.inv_role]);
    if (user.inv_homepage) items.push(['홈페이지', 'fa-globe',          user.inv_homepage, true]);
    if (user.inv_sns)      items.push(['SNS',    'fa-share-nodes',     user.inv_sns, true]);
  }

  if (isStartup) {
    if (user.su_nationality) items.push(['국적',     'fa-earth-asia',    user.su_nationality]);
    if (user.su_age)         items.push(['나이',     'fa-cake-candles',  user.su_age + '세']);
    if (user.su_job)         items.push(['직무',     'fa-briefcase',     user.su_job]);
    if (user.su_sns)         items.push(['SNS',      'fa-share-nodes',   user.su_sns, true]);
    if (user.co_name)        items.push(['회사명',   'fa-building',      user.co_name]);
    if (user.co_stage)       items.push(['단계',     'fa-flag',          user.co_stage]);
    if (user.co_address)     items.push(['주소',     'fa-location-dot',  user.co_address]);
    if (user.co_biz_type)    items.push(['형태',     'fa-file-contract', user.co_biz_type]);
    if (user.co_keywords)    items.push(['키워드',   'fa-tags',          user.co_keywords]);
    if (user.co_cofounder)   items.push(['공동창업자','fa-people-group', user.co_cofounder]);
    if (user.co_cur_invest_stage) items.push(['현재투자단계','fa-chart-line', user.co_cur_invest_stage]);
    if (user.co_cur_invest_amt)   items.push(['현재투자금액','fa-sack-dollar', user.co_cur_invest_amt + '억원']);
    if (user.co_hope_invest_stage) items.push(['희망투자단계','fa-bullseye', user.co_hope_invest_stage]);
    if (user.co_hope_invest_amt)   items.push(['희망투자금액','fa-hand-holding-dollar', user.co_hope_invest_amt + '억원']);
  }

  if (items.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  grid.innerHTML = items.map(([label, icon, val, isLink]) => `
    <div style="padding:1rem; background:#f8fafc; border-radius:14px; border:1px solid var(--border-color);">
      <div style="font-size:0.78rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.4rem;">
        <i class="fa-solid ${icon}" style="margin-right:0.35rem; color:var(--primary-color);"></i>${label}
      </div>
      ${isLink
        ? `<a href="${/^https?:\/\//i.test(val) ? val : 'https://'+val}" target="_blank" rel="noopener noreferrer" style="font-size:0.9rem; font-weight:700; color:#2563eb; word-break:break-all;">${val}</a>`
        : `<div style="font-size:0.9rem; font-weight:700; color:var(--text-primary); word-break:break-all;">${val}</div>`
      }
    </div>
  `).join('');
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── 프로필 편집 ─────────────────────────────────

function enterProfileEdit() {
  if (!_profileUser) return;
  // 편집 가능한 필드: [valueId, inputId, currentValue]
  const fields = [
    ['pUserId',       'pUserId_e',       _profileUser.company      || ''],
    ['pPhone',        'pPhone_e',        _profileUser.phone        || ''],
    ['pCompany',      'pCompany_e',      _profileUser.name         || ''],
    ['pInvestTarget', 'pInvestTarget_wrap', _profileUser.investTarget || ''],
    ['pCeoAge',       'pCeoAge_e',       _profileUser.ceoAge       || ''],
    ['pGender',       'pGender_e',       _profileUser.gender       || ''],
  ];

  fields.forEach(([valId, inpId, curVal]) => {
    const val = document.getElementById(valId);
    const inp = document.getElementById(inpId);
    if (val) val.style.display = 'none';
    if (inp) {
      inp.style.display = inpId.endsWith('_wrap') ? 'flex' : 'block';
      // input 자식이 있으면 실제 input에 값 세팅
      const actualInput = inp.tagName === 'INPUT' || inp.tagName === 'SELECT' || inp.tagName === 'TEXTAREA'
        ? inp : inp.querySelector('input');
      if (actualInput) actualInput.value = curVal;
    }
  });

  // 포트폴리오 (링크 → input)
  const portWrap = document.getElementById('pPortfolioWrap');
  if (portWrap) portWrap.style.display = 'block';
  const portLink = document.getElementById('pPortfolio');
  const portInp  = document.getElementById('pPortfolio_e');
  if (portLink) portLink.style.display = 'none';
  if (portInp) { portInp.style.display = 'block'; portInp.value = _profileUser.portfolio || ''; }

  // 소개 (p → textarea)
  const bioWrap = document.getElementById('pBioWrap');
  if (bioWrap) bioWrap.style.display = 'block';
  const bioPara = document.getElementById('pBio');
  const bioInp  = document.getElementById('pBio_e');
  if (bioPara) bioPara.style.display = 'none';
  if (bioInp) { bioInp.style.display = 'block'; bioInp.value = _profileUser.bio || ''; }

  document.getElementById('profileEditBtn').style.display  = 'none';
  document.getElementById('profileSaveBtn').style.display  = 'inline-flex';
  document.getElementById('profileCancelBtn').style.display = 'inline-flex';
}

async function saveProfileEdit() {
  const company     = document.getElementById('pUserId_e')?.value.trim()       || '';
  const phone       = document.getElementById('pPhone_e')?.value.trim()        || '';
  const name        = document.getElementById('pCompany_e')?.value.trim()      || '';
  const investTarget= document.getElementById('pInvestTarget_e')?.value.trim() || '';
  const ceoAge      = document.getElementById('pCeoAge_e')?.value.trim()       || '';
  const gender      = document.getElementById('pGender_e')?.value.trim()       || '';
  const portfolio   = document.getElementById('pPortfolio_e')?.value.trim()    || '';
  const bio         = document.getElementById('pBio_e')?.value.trim()          || '';

  const saveBtn = document.getElementById('profileSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...';

  // 1) Supabase user_metadata 업데이트
  try {
    const sb = getSupabase ? getSupabase() : null;
    if (sb) {
      await sb.auth.updateUser({
        data: { company, phone, full_name: name, portfolio, bio, investTarget, ceoAge, gender }
      });
    }
  } catch (e) {
    console.warn('Supabase 업데이트 실패:', e);
  }

  // 2) 백엔드 DB 업데이트 (선택적)
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    await fetch(API_CONFIG.BASE_URL + '/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name, company, phone, portfolio, bio })
    });
  } catch (e) { /* 무시 */ }

  // 3) localStorage + 화면 반영
  _profileUser = Object.assign({}, _profileUser, { company, phone, name, investTarget, ceoAge, gender, portfolio, bio });
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));

  cancelProfileEdit();
  renderUserProfile(_profileUser);

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 저장';
}

function cancelProfileEdit() {
  const valIds = ['pUserId','pPhone','pCompany','pCeoAge','pGender'];
  valIds.forEach(id => {
    const val = document.getElementById(id);
    const inp = document.getElementById(id + '_e');
    if (val) val.style.display = 'block';
    if (inp) inp.style.display = 'none';
  });

  // 투자희망금액 (wrap 구조)
  const investVal = document.getElementById('pInvestTarget');
  const investWrap = document.getElementById('pInvestTarget_wrap');
  if (investVal)  investVal.style.display  = 'block';
  if (investWrap) investWrap.style.display = 'none';

  const portLink = document.getElementById('pPortfolio');
  const portInp  = document.getElementById('pPortfolio_e');
  if (portLink) portLink.style.display = 'block';
  if (portInp)  portInp.style.display  = 'none';

  const bioPara = document.getElementById('pBio');
  const bioInp  = document.getElementById('pBio_e');
  if (bioPara) bioPara.style.display = 'block';
  if (bioInp)  bioInp.style.display  = 'none';

  document.getElementById('profileEditBtn').style.display   = 'inline-flex';
  document.getElementById('profileSaveBtn').style.display   = 'none';
  document.getElementById('profileCancelBtn').style.display = 'none';
}

// ── 로고 업로드 ──────────────────────────────────

function resizeImageToDataUrl(file, maxPx, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 최대 300px, JPEG quality 0.82 — 대부분 20KB 이하
  const dataUrl = await resizeImageToDataUrl(file, 300, 0.82);

  // 즉시 화면 반영
  const avatarEl = document.getElementById('profileAvatarLarge');
  if (avatarEl) avatarEl.innerHTML = `<img src="${dataUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;

  // localStorage 저장
  if (_profileUser) {
    _profileUser.logoUrl = dataUrl;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));
  }

  // Supabase user_metadata 저장 (avatar_url)
  try {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (sb) await sb.auth.updateUser({ data: { avatar_url: dataUrl } });
  } catch (e) { console.warn('아바타 Supabase 저장 실패:', e); }

  // 파일 input 초기화 (같은 파일 재선택 허용)
  event.target.value = '';
}

// 대시보드 섹션 전환
function switchSection(sectionId) {
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.style.display = "none";
    section.classList.remove("active");
  });

  const targetSection = document.getElementById(`${sectionId}Section`);
  if (targetSection) {
    targetSection.style.display = "block";
    targetSection.classList.add("active");
  }

  // 내정보(settings) 진입 시: 수정 폼 채우기
  if (sectionId === 'settings') {
    loadSettingsForm();
  }

  // 프로필 섹션 진입 시: 프로필 로드
  if (sectionId === 'profile') {
    loadUserProfile();
  }

  // 추천이력 섹션 진입 시 렌더링
  if (sectionId === 'recommend') {
    loadRecommendHistory();
  }

  // 사이드바 메뉴 활성 상태 업데이트
  document
    .querySelectorAll(".category-sidebar .filter-item")
    .forEach((item) => {
      item.classList.remove("active");
      const onclick = item.getAttribute("onclick");
      if (onclick && onclick.includes(`'${sectionId}'`)) {
        item.classList.add("active");
      }
    });

  renderDashboard();
}

function renderDashboard() {
  const bookmarks = BookmarkMgr.getBookmarks();

  renderBookmarkedInvestors(bookmarks.investors);
  renderBookmarkedFunds(bookmarks.funds);
  renderBookmarkedStartups(bookmarks.startups);
}

function renderBookmarkedInvestors(ids) {
  const container = document.getElementById("bookmarkedInvestors");
  const filtered = investorsData.filter((inv) => ids.includes(inv.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-user-tie" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 투자자가 없습니다.</p>
                <a href="investors.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">투자자 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (investor) => `
        <div class="u-card" onclick="location.href='investors.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${investor.name}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${investor.company}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">총 투자건수</span>
                    <span style="font-weight: 700;">${investor.investments}건</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">매칭 성공률</span>
                    <span style="font-weight: 700; color: var(--success-color);">${investor.successRate}%</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">투자자</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('investors', ${investor.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderBookmarkedFunds(ids) {
  const container = document.getElementById("bookmarkedFunds");
  const filtered = fundsData.filter((fund) => ids.includes(fund.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-coins" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 투자펀드가 없습니다.</p>
                <a href="fund.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">투자펀드 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (fund) => `
        <div class="u-card" onclick="location.href='fund.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-coins"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${fund.fundName}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${fund.companyName}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">등록일자</span>
                    <span style="font-weight: 700;">${fund.registeredAt}</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">결성총액</span>
                    <span style="font-weight: 700; color: var(--accent-color);">${formatAmount(fund.totalAmount)}</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">${fund.fundType}</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('funds', ${fund.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

function renderBookmarkedStartups(ids) {
  const container = document.getElementById("bookmarkedStartups");
  const filtered = startupsData.filter((s) => ids.includes(s.id));

  if (filtered.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; background: var(--glass-bg); border-radius: 20px;">
                <i class="fa-solid fa-rocket" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="color: var(--text-secondary);">즐겨찾는 스타트업이 없습니다.</p>
                <a href="startups.html" style="color: var(--accent-color); text-decoration: none; margin-top: 1rem; font-weight: 700; display: inline-block;">스타트업 탐색하러 가기 &rarr;</a>
            </div>`;
    return;
  }

  container.innerHTML = filtered
    .map((startup) => {
      const foundedYear = new Date(startup.foundedDate).getFullYear();
      const yearDiff = new Date().getFullYear() - foundedYear + 1;

      return `
        <div class="u-card" onclick="location.href='startups.html'">
            <div class="card-header">
                <div class="avatar">
                    <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="investor-info">
                    <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${startup.name}</h3>
                    <div class="company" style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700;">${startup.industryLabel}</div>
                </div>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">업력</span>
                    <span style="font-weight: 700;">${yearDiff}년차</span>
                </div>
                <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                    <span style="color: var(--text-secondary);">소재지</span>
                    <span style="font-weight: 700;">${startup.location}</span>
                </div>
            </div>

            <div class="investor-tags" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <span class="tag">스타트업</span>
                <span class="tag tag-special">즐겨찾기</span>
            </div>

            <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
                <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
                <button class="btn-bookmark active" onclick="event.stopPropagation(); handleBookmarkUpdate('startups', ${startup.id}, this); setTimeout(renderDashboard, 100);">
                    <i class="fa-solid fa-star"></i>
                </button>
            </div>
        </div>
    `;
    })
    .join("");
}

function formatAmount(amount) {
  if (amount >= 100000000) {
    return (amount / 100000000).toLocaleString() + " 억원";
  }
  return amount.toLocaleString() + " 원";
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

// ─── 추천 이력 ─────────────────────────────────────────────────
function loadRecommendHistory() {
  const list = JSON.parse(localStorage.getItem("vcroute_recommend_history") || "[]");
  const container = document.getElementById("recommendList");
  const empty = document.getElementById("recommendEmpty");
  if (!container) return;

  if (!list.length) {
    if (empty) empty.style.display = "block";
    // remove any previously rendered cards
    container.querySelectorAll(".recommend-card").forEach(c => c.remove());
    return;
  }
  if (empty) empty.style.display = "none";
  container.querySelectorAll(".recommend-card").forEach(c => c.remove());

  list.slice().reverse().forEach(item => {
    const card = document.createElement("div");
    card.className = "recommend-card";
    card.style.cssText = "background:white;border:1px solid #e2e8f0;border-radius:14px;padding:1.2rem 1.5rem;margin-bottom:1rem;";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.8rem;">
        <span style="font-size:0.78rem;color:#94a3b8;">${item.date}</span>
        <span style="background:${item.matchScore >= 70 ? '#dcfce7' : '#fef9c3'};color:${item.matchScore >= 70 ? '#166534' : '#854d0e'};padding:0.15rem 0.55rem;border-radius:20px;font-size:0.75rem;font-weight:700;">매칭 ${item.matchScore}%</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div style="background:#eff6ff;border-radius:10px;padding:0.9rem 1rem;">
          <div style="font-size:0.72rem;color:#3b82f6;font-weight:700;margin-bottom:0.4rem;"><i class="fa-solid fa-building-columns"></i> 추천 펀드</div>
          <div style="font-weight:700;color:#1e293b;font-size:0.9rem;margin-bottom:0.2rem;">${item.fundName}</div>
          <div style="font-size:0.8rem;color:#64748b;">${item.companyName}</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;">${item.industry}</div>
        </div>
        <div style="background:#f5f3ff;border-radius:10px;padding:0.9rem 1rem;">
          <div style="font-size:0.72rem;color:#7c3aed;font-weight:700;margin-bottom:0.4rem;"><i class="fa-solid fa-user-tie"></i> 매칭 투자자</div>
          <div style="font-weight:700;color:#1e293b;font-size:0.9rem;margin-bottom:0.2rem;">${item.gpName} 심사역</div>
          <div style="font-size:0.8rem;color:#64748b;">${item.gpCompany}</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:0.3rem;">${item.gpEmail}</div>
        </div>
      </div>`;
    container.appendChild(card);
  });
}

function clearRecommendHistory() {
  if (!confirm("추천 이력을 모두 삭제하시겠습니까?")) return;
  localStorage.removeItem("vcroute_recommend_history");
  loadRecommendHistory();
}

// 연락한 투자자 내역 그룹 토글
function toggleContactGroup(group) {
  const el = document.getElementById('group-contact-' + group);
  const btn = document.getElementById('btn-contact-' + group);
  if (!el || !btn) return;
  const hidden = el.style.display === 'none';
  el.style.display = hidden ? '' : 'none';
  btn.style.opacity = hidden ? '1' : '0.45';
}

// ─── 자료보관함 (localStorage 기반) ───────────────────────────────
const VCROUTE_FILES_KEY = "vcroute_stored_files";

const SEED_FILES = [
  { id:"seed1", name:"2025_Series_A_IR_Deck_v3.pdf",       category:"IR자료",    badge:"IR",     size:"4.2 MB", date:"2025.01.15", content:"" },
  { id:"seed2", name:"회사소개서_2025_최종.pptx",           category:"회사소개서", badge:"IR",     size:"12.8 MB",date:"2025.01.10", content:"" },
  { id:"seed3", name:"Investment_Memorandum_Q4.docx",       category:"기타",      badge:"IM",     size:"2.1 MB", date:"2025.01.05", content:"" },
  { id:"seed4", name:"재무제표_2024_감사완료.pdf",           category:"재무제표",  badge:"IM",     size:"1.5 MB", date:"2024.12.28", content:"" },
  { id:"seed5", name:"Pitch_Deck_Demo_Day.pptx",            category:"IR자료",    badge:"IR",     size:"8.7 MB", date:"2024.12.20", content:"" },
  { id:"seed6", name:"특허등록증_제10-2024-0123456호.pdf",   category:"기타",      badge:"인증서류",size:"0.8 MB", date:"2024.09.15", content:"" },
  { id:"seed7", name:"벤처기업확인서_주식회사벤처플랫폼_2025.pdf", category:"기타", badge:"인증서류",size:"0.5 MB",date:"2025.01.20", content:"" },
  { id:"seed8", name:"투자확인서_스마트벤처캠퍼스_2025.pdf", category:"기타",      badge:"인증서류",size:"0.3 MB", date:"2025.02.10", content:"" },
];

function initStoredFiles() {
  if (!localStorage.getItem(VCROUTE_FILES_KEY)) {
    localStorage.setItem(VCROUTE_FILES_KEY, JSON.stringify(SEED_FILES));
  }
  renderStoredFiles();
}

function renderStoredFiles() {
  const list = document.getElementById("imirFilesList");
  if (!list) return;
  const files = JSON.parse(localStorage.getItem(VCROUTE_FILES_KEY) || "[]");
  if (!files.length) {
    list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:#94a3b8;"><i class="fa-solid fa-folder-open" style="font-size:2rem;margin-bottom:0.8rem;display:block;"></i>저장된 파일이 없습니다.</div>`;
    return;
  }
  list.innerHTML = files.map(f => {
    const ext = (f.name || "").split(".").pop().toLowerCase();
    const iconCls = ext === "pdf" ? "pdf" : (ext === "pptx" || ext === "ppt") ? "ppt" : (ext === "docx" || ext === "doc") ? "doc" : f.badge === "인증서류" ? "cert" : "pdf";
    const iconTag = ext === "pdf" ? "fa-file-pdf" : (ext === "pptx" || ext === "ppt") ? "fa-file-powerpoint" : (ext === "docx" || ext === "doc") ? "fa-file-word" : "fa-file";
    const badgeCls = f.badge === "IR" ? "ir" : f.badge === "IM" ? "im" : f.badge === "인증서류" ? "cert" : "ir";
    const hasContent = f.content && f.content.trim().length > 0;
    return `
      <div class="imir-file-item">
        <div class="file-icon ${iconCls}"><i class="fa-solid ${iconTag}"></i></div>
        <div class="file-info">
          <h4>${f.name}${hasContent ? ' <span style="color:#22c55e;font-size:0.72rem;font-weight:700;background:#f0fdf4;padding:0.1rem 0.35rem;border-radius:4px;">내용 있음</span>' : ''}</h4>
          <div class="file-meta">
            <span><i class="fa-regular fa-calendar"></i> ${f.date}</span>
            <span><i class="fa-regular fa-file"></i> ${f.size}</span>
            <span style="color:#64748b;">${f.category}</span>
          </div>
        </div>
        <span class="file-badge ${badgeCls}">${f.badge}</span>
        <div class="file-actions">
          <button class="file-action-btn delete" title="삭제" onclick="deleteStoredFile('${f.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");

  // 통계 업데이트
  const ir   = files.filter(f => f.badge === "IR").length;
  const im   = files.filter(f => f.badge === "IM").length;
  const cert = files.filter(f => f.badge === "인증서류").length;
  const statEls = document.querySelectorAll(".imir-stat-card .stat-value");
  if (statEls[0]) statEls[0].textContent = ir;
  if (statEls[1]) statEls[1].textContent = im;
  if (statEls[2]) statEls[2].textContent = cert;
  if (statEls[3]) statEls[3].textContent = files.length;
}

function deleteStoredFile(id) {
  const files = JSON.parse(localStorage.getItem(VCROUTE_FILES_KEY) || "[]");
  localStorage.setItem(VCROUTE_FILES_KEY, JSON.stringify(files.filter(f => f.id !== id)));
  renderStoredFiles();
}

// 업로드 모달
let _pendingStorageFile = null;

function openStorageUploadModal() {
  _pendingStorageFile = null;
  const modal = document.getElementById("storageUploadModal");
  if (modal) { modal.style.display = "flex"; }
  document.getElementById("storageSelectedName").textContent = "";
  document.getElementById("storageSaveBtn").disabled = true;
}

function closeStorageUploadModal() {
  const modal = document.getElementById("storageUploadModal");
  if (modal) modal.style.display = "none";
  _pendingStorageFile = null;
}

function onStorageFileChosen(input) {
  const file = input.files[0];
  if (!file) return;
  _pendingStorageFile = file;
  document.getElementById("storageSelectedName").textContent = `✅ ${file.name}`;
  document.getElementById("storageSaveBtn").disabled = false;
}

function handleStorageDrop(e) {
  e.preventDefault();
  document.getElementById("storageDropZone").style.borderColor = "#cbd5e1";
  const file = e.dataTransfer.files[0];
  if (!file) return;
  _pendingStorageFile = file;
  document.getElementById("storageSelectedName").textContent = `✅ ${file.name}`;
  document.getElementById("storageSaveBtn").disabled = false;
}

function saveStorageFile() {
  if (!_pendingStorageFile) return;
  const file     = _pendingStorageFile;
  const category = document.getElementById("storageCategorySelect").value;
  const badge    = category === "IR자료" || category === "회사소개서" ? "IR"
                 : category === "재무제표" ? "IM" : "기타";
  const sizeMB   = (file.size / 1024 / 1024).toFixed(1) + " MB";
  const now      = new Date();
  const date     = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;

  const btn = document.getElementById("storageSaveBtn");
  btn.textContent = "읽는 중...";
  btn.disabled = true;

  const reader = new FileReader();
  reader.onload = e => {
    const files = JSON.parse(localStorage.getItem(VCROUTE_FILES_KEY) || "[]");
    files.unshift({ id: Date.now().toString(), name: file.name, category, badge, size: sizeMB, date, content: e.target.result });
    localStorage.setItem(VCROUTE_FILES_KEY, JSON.stringify(files));
    renderStoredFiles();
    closeStorageUploadModal();
    btn.textContent = "저장";
    btn.disabled = false;
  };
  reader.readAsText(file, "utf-8");
}

// ── 내정보 수정 폼 ──────────────────────────────────

let _peKeywords = [];

function loadSettingsForm() {
  const user = _profileUser;
  if (!user) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  // 유형별 섹션 표시
  const invSec  = document.getElementById('peInvestorSection');
  const suPSec  = document.getElementById('peStartupPersonSection');
  const suCSec  = document.getElementById('peStartupCompanySection');
  if (invSec)  invSec.style.display  = isInvestor ? '' : 'none';
  if (suPSec)  suPSec.style.display  = isStartup  ? '' : 'none';
  if (suCSec)  suCSec.style.display  = isStartup  ? '' : 'none';

  // 공통
  setVal('pe_name',    user.name    || user.su_name || '');
  setVal('pe_company', user.company || user.co_name || '');
  setVal('pe_phone',   user.phone   || '');

  if (isInvestor) {
    setVal('pe_inv_type',     user.inv_type     || '');
    setVal('pe_inv_role',     user.inv_role     || '');
    setVal('pe_inv_homepage', user.inv_homepage || user.portfolio || '');
    setVal('pe_inv_sns',      user.inv_sns      || '');
    setVal('pe_inv_bio',      user.bio || user.inv_bio || '');
  }

  if (isStartup) {
    setVal('pe_nationality',        user.su_nationality || '');
    setVal('pe_age',                user.su_age         || '');
    setVal('pe_gender',             user.su_gender || user.gender || '');
    setVal('pe_job',                user.su_job         || '');
    setVal('pe_su_sns',             user.su_sns         || '');
    setVal('pe_referral',           user.su_referral    || '');
    setVal('pe_su_bio',             user.su_bio || user.bio || '');

    setVal('pe_co_name',            user.co_name        || user.company || '');
    setVal('pe_co_founded',         user.co_founded     || '');
    setVal('pe_co_homepage',        user.co_homepage || user.portfolio || '');
    setVal('pe_co_biz_type',        user.co_biz_type    || '');
    setVal('pe_co_address',         user.co_address     || '');
    setVal('pe_co_stage',           user.co_stage       || '');
    setVal('pe_co_cofounder',       user.co_cofounder   || '');
    setVal('pe_cur_invest_stage',   user.co_cur_invest_stage  || '');
    setVal('pe_cur_invest_amt',     user.co_cur_invest_amt    || '');
    setVal('pe_hope_invest_stage',  user.co_hope_invest_stage || '');
    setVal('pe_hope_invest_amt',    user.co_hope_invest_amt   || '');

    // 키워드 뱃지 초기화
    _peKeywords = user.co_keywords ? user.co_keywords.split(',').filter(Boolean) : [];
    renderPeKeywords();
    initPeKeywordInput();
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function initPeKeywordInput() {
  const inp = document.getElementById('pe_kw_input');
  if (!inp || inp._peInited) return;
  inp._peInited = true;
  inp.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const v = this.value.trim();
      if (v && _peKeywords.length < 3 && !_peKeywords.includes(v)) {
        _peKeywords.push(v);
        renderPeKeywords();
      }
      this.value = '';
    } else if (e.key === 'Backspace' && !this.value && _peKeywords.length > 0) {
      _peKeywords.pop();
      renderPeKeywords();
    }
  });
  // 클릭 시 input 포커스
  const wrap = document.getElementById('pe_kw_wrap');
  if (wrap) wrap.addEventListener('click', () => inp.focus());
}

function renderPeKeywords() {
  const badges = document.getElementById('pe_kw_badges');
  const hidden = document.getElementById('pe_co_keywords');
  if (!badges) return;
  badges.innerHTML = _peKeywords.map((kw, i) =>
    `<span class="pef-kw-badge">${kw}<button type="button" class="pef-kw-remove" onclick="removePeKeyword(${i})">×</button></span>`
  ).join('');
  if (hidden) hidden.value = _peKeywords.join(',');
  const inp = document.getElementById('pe_kw_input');
  if (inp) inp.disabled = _peKeywords.length >= 3;
}

function removePeKeyword(idx) {
  _peKeywords.splice(idx, 1);
  renderPeKeywords();
}

async function saveProfileInfo() {
  const user = _profileUser;
  if (!user) return;

  const isInvestor = user.userType === 'investor';
  const isStartup  = user.userType === 'startup';

  const name    = document.getElementById('pe_name')?.value.trim()    || '';
  const company = document.getElementById('pe_company')?.value.trim() || '';
  const phone   = document.getElementById('pe_phone')?.value.trim()   || '';

  const updates = { name, company, phone };

  if (isInvestor) {
    updates.inv_type     = document.getElementById('pe_inv_type')?.value     || '';
    updates.inv_role     = document.getElementById('pe_inv_role')?.value.trim() || '';
    updates.inv_homepage = document.getElementById('pe_inv_homepage')?.value.trim() || '';
    updates.inv_sns      = document.getElementById('pe_inv_sns')?.value.trim() || '';
    updates.bio          = document.getElementById('pe_inv_bio')?.value.trim()   || '';
    updates.portfolio    = updates.inv_homepage;
  }

  if (isStartup) {
    updates.su_nationality       = document.getElementById('pe_nationality')?.value.trim()       || '';
    updates.su_age               = document.getElementById('pe_age')?.value                      || '';
    updates.su_gender            = document.getElementById('pe_gender')?.value                   || '';
    updates.gender               = updates.su_gender;
    updates.su_job               = document.getElementById('pe_job')?.value.trim()               || '';
    updates.su_sns               = document.getElementById('pe_su_sns')?.value.trim()            || '';
    updates.su_referral          = document.getElementById('pe_referral')?.value                 || '';
    updates.su_bio               = document.getElementById('pe_su_bio')?.value.trim()            || '';
    updates.bio                  = updates.su_bio;
    updates.co_name              = document.getElementById('pe_co_name')?.value.trim()           || '';
    updates.co_founded           = document.getElementById('pe_co_founded')?.value               || '';
    updates.co_homepage          = document.getElementById('pe_co_homepage')?.value.trim()       || '';
    updates.co_biz_type          = document.getElementById('pe_co_biz_type')?.value              || '';
    updates.co_address           = document.getElementById('pe_co_address')?.value.trim()        || '';
    updates.co_stage             = document.getElementById('pe_co_stage')?.value                 || '';
    updates.co_keywords          = _peKeywords.join(',');
    updates.co_cofounder         = document.getElementById('pe_co_cofounder')?.value             || '';
    updates.co_cur_invest_stage  = document.getElementById('pe_cur_invest_stage')?.value         || '';
    updates.co_cur_invest_amt    = document.getElementById('pe_cur_invest_amt')?.value           || '';
    updates.co_hope_invest_stage = document.getElementById('pe_hope_invest_stage')?.value        || '';
    updates.co_hope_invest_amt   = document.getElementById('pe_hope_invest_amt')?.value          || '';
    updates.portfolio            = updates.co_homepage;
  }

  const btn = document.getElementById('peSubmitBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 저장 중...'; }

  // Supabase 업데이트
  try {
    const sb = typeof getSupabase === 'function' ? getSupabase() : null;
    if (sb) await sb.auth.updateUser({ data: updates });
  } catch(e) { console.warn('Supabase 저장 실패:', e); }

  // 백엔드 업데이트
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    await fetch(API_CONFIG.BASE_URL + '/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(updates),
    });
  } catch(e) { /* 무시 */ }

  // localStorage 반영
  _profileUser = Object.assign({}, _profileUser, updates);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(_profileUser));

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 저장'; }

  alert('저장되었습니다!');
  switchSection('profile');
}
