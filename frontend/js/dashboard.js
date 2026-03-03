// 샘플 프로필 데이터 (데모용 - 주식회사 벤처플랫폼)
const SAMPLE_USER = {
  name: "박준호",
  userId: "venture_platform",
  email: "venture@ventureplatform.co.kr",
  phone: "050219234562",
  company: "주식회사 벤처플랫폼",
  userType: "startup",
  createdAt: "2024-06-01",
  portfolio: "https://ventureplatform.biz/",
  bio: "스타트업과 투자자를 연결하는 VC 라우트 플랫폼 운영사입니다. AI 기반 매칭 시스템으로 최적의 투자 파트너를 찾아드립니다.",
  verified: true,
  investTarget: "5억 ~ 20억원",
  ceoAge: 35,
  gender: "남성",
  logoUrl: "image/favicon.png",
};

document.addEventListener("DOMContentLoaded", () => {
  checkDashboardAuth();
  renderDashboard();
});

// 대시보드 접근 권한 확인 및 프로필 로드
function checkDashboardAuth() {
  if (!isLoggedIn()) {
    // 비로그인 상태에서도 샘플 프로필 표시 (데모용)
    renderUserProfile(SAMPLE_USER);
    return;
  }
  loadUserProfile();
}

// 서버에서 최신 회원 정보 가져오기
async function loadUserProfile() {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  let user = getUserInfo();

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
    renderUserProfile(user);
  }
}

// 프로필 데이터를 UI에 렌더링
function renderUserProfile(user) {
  const typeLabel = user.userType === 'startup' ? '스타트업' :
                    user.userType === 'investor' ? '투자자' : '회원';
  const initial = (user.company || user.name || user.userId || user.email || '?')[0].toUpperCase();

  // 사이드바 프로필 미니카드
  const sidebar = document.getElementById('sidebarProfile');
  if (sidebar) {
    sidebar.style.display = 'block';
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) {
      if (user.logoUrl) {
        avatarEl.innerHTML = `<img src="${user.logoUrl}" style="width:100%; height:100%; object-fit:contain; border-radius:50%; background:#fff; padding:4px;">`;
      } else {
        avatarEl.innerHTML = initial;
      }
    }
    setText('sidebarName', user.company || user.name || user.userId || '-');
    setText('sidebarType', typeLabel);
    const typeEl = document.getElementById('sidebarType');
    if (typeEl && user.userType === 'investor') {
      typeEl.style.background = 'rgba(245,158,11,0.1)';
      typeEl.style.color = '#f59e0b';
    }
    setText('sidebarEmail', user.email || '-');
  }

  // 프로필 섹션 상세
  const loginRequired = document.getElementById('profileLoginRequired');
  const profileContent = document.getElementById('profileContent');
  if (loginRequired) loginRequired.style.display = 'none';
  if (profileContent) profileContent.style.display = 'block';

  const avatarLarge = document.getElementById('profileAvatarLarge');
  if (avatarLarge) {
    if (user.logoUrl) {
      avatarLarge.innerHTML = `<img src="${user.logoUrl}" style="width:100%; height:100%; object-fit:contain; background:#fff; padding:6px; border-radius:50%;">`;
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
  setText('pUserId', user.userId || '-');
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
  setText('pInvestTarget', user.investTarget || '-');

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
  // 클릭 횟수·자료요청: user 필드 또는 기본값
  setText('pClickCount', user.clickCount !== undefined ? user.clickCount : 247);
  setText('pDocRequest', user.docRequest !== undefined ? user.docRequest : 18);

  const portfolioWrap = document.getElementById('pPortfolioWrap');
  const portfolioEl = document.getElementById('pPortfolio');
  if (portfolioWrap && user.portfolio) {
    portfolioWrap.style.display = 'block';
    portfolioEl.textContent = user.portfolio;
    portfolioEl.href = user.portfolio;
  }

  const bioWrap = document.getElementById('pBioWrap');
  const bioEl = document.getElementById('pBio');
  if (bioWrap && user.bio) {
    bioWrap.style.display = 'block';
    bioEl.textContent = user.bio;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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

  // 프로필 섹션 진입 시: 비로그인이면 샘플 프로필 표시
  if (sectionId === 'profile') {
    if (!isLoggedIn()) {
      renderUserProfile(SAMPLE_USER);
    }
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
