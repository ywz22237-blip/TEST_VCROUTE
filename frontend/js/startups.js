// 스타트업 더미 데이터
const startupsData = [
  {
    id: 1,
    name: "(주)넥스트AI",
    description:
      "차세대 생성형 AI 솔루션을 개발하여 기업의 업무 효율을 극대화합니다.",
    industry: "ai",
    industryLabel: "AI/빅데이터",
    foundedDate: "2025-01-15", // 설립일
    location: "서울",
    ceoName: "김철수", // 상세에서는 숨김
    ceoAge: 32,
    ceoGender: "male",
    certifications: ["venture"],
    website: "https://nextai.example.com",
    email: "contact@nextai.example.com",
    imFile: "im_file.pdf",
    irFile: "ir_file.pdf",
  },
  {
    id: 2,
    name: "(주)그린바이오",
    description: "친환경 신소재를 활용한 바이오 패키징 솔루션을 제공합니다.",
    industry: "bio",
    industryLabel: "바이오/헬스케어",
    foundedDate: "2020-05-20",
    location: "경기",
    ceoName: "이영희",
    ceoAge: 45,
    ceoGender: "female",
    certifications: ["innobiz"],
    website: "https://greenbio.example.com",
    email: "info@greenbio.example.com",
    imFile: null,
    irFile: null,
  },
  {
    id: 3,
    name: "(주)핀테크로드",
    description: "소상공인을 위한 간편 매출 정산 및 자금 관리 플랫폼입니다.",
    industry: "fintech",
    industryLabel: "핀테크",
    foundedDate: "2022-11-10",
    location: "부산",
    ceoName: "박준영",
    ceoAge: 28,
    ceoGender: "male",
    certifications: ["mainbiz", "venture"],
    website: "https://finroad.example.com",
    email: "support@finroad.example.com",
    imFile: "im_sample.pdf",
    irFile: null,
  },
];

let filteredStartups = [...startupsData];
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  renderStartups(filteredStartups);
  updateResultsCount(filteredStartups.length);
});

// 검색 기능
function handleSearch() {
  const input = document.getElementById("startupSearch");
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");
  const searchKeyword = document.getElementById("searchKeyword");

  searchQuery = input.value.trim();

  // Clear 버튼 표시/숨김
  if (searchQuery.length > 0) {
    clearBtn.classList.add("visible");
    searchStats.style.display = "flex";
    searchKeyword.textContent = searchQuery;
  } else {
    clearBtn.classList.remove("visible");
    searchStats.style.display = "none";
  }

  applyFilters();
}

// 검색 초기화
function clearSearch() {
  const input = document.getElementById("startupSearch");
  const clearBtn = document.getElementById("searchClear");
  const searchStats = document.getElementById("searchStats");

  input.value = "";
  searchQuery = "";
  clearBtn.classList.remove("visible");
  searchStats.style.display = "none";

  applyFilters();
}

// 스타트업 렌더링 함수
function renderStartups(data) {
  const grid = document.getElementById("dataGrid");
  const noResults = document.getElementById("noResults");

  grid.innerHTML = "";

  if (data.length === 0) {
    grid.style.display = "none";
    noResults.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  noResults.style.display = "none";

  data.forEach((startup) => {
    // 뱃지 생성
    const badges = startup.certifications
      .map((cert) => {
        let label = "";
        if (cert === "venture") label = "벤처";
        if (cert === "innobiz") label = "이노비즈";
        if (cert === "mainbiz") label = "메인비즈";
        return `<span class="tag tag-special">${label}</span>`;
      })
      .join("");

    // 업년차 계산
    const foundedYear = new Date(startup.foundedDate).getFullYear();
    const yearDiff = new Date().getFullYear() - foundedYear + 1;

    const card = document.createElement("div");
    card.className = "u-card";
    card.onclick = () => openModal(startup.id);

    card.innerHTML = `
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
        <div class="fund-info-item" style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
          <span style="color: var(--text-secondary);">소재지</span>
          <span style="font-weight: 700;">${startup.location}</span>
        </div>
        <div class="fund-info-item" style="display: flex; justify-content: space-between; font-size: 0.9rem;">
          <span style="color: var(--text-secondary);">창업 종류</span>
          <span style="font-weight: 700;">${formatAge(startup.ceoAge)}</span>
        </div>
      </div>

      <div class="investor-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        <span class="tag">${startup.location}</span>
        ${badges}
      </div>

      <div class="card-footer" style="margin-top: auto; display: flex; gap: 0.75rem; align-items: center;">
        <button class="btn-primary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">상세보기</button>
        <button class="btn-bookmark ${BookmarkMgr.isBookmarked("startups", startup.id) ? "active" : ""}"
                onclick="event.stopPropagation(); handleBookmarkUpdate('startups', ${startup.id}, this)">
          <i class="fa-${BookmarkMgr.isBookmarked("startups", startup.id) ? "solid" : "regular"} fa-star"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 특수 필터 토글
function toggleSpecialFilter(value) {
  const items = document.querySelectorAll(".special-tag");
  const clickedItem = document.querySelector(
    `.special-tag[data-special="${value}"]`,
  );

  if (value === "all") {
    items.forEach((item) => item.classList.remove("active"));
    clickedItem.classList.add("active");
  } else {
    clickedItem.classList.toggle("active");
    const specialItems = Array.from(items).filter(
      (item) => item.dataset.special !== "all",
    );
    const anyActive = specialItems.some((item) =>
      item.classList.contains("active"),
    );
    const allItem = document.querySelector('.special-tag[data-special="all"]');

    if (anyActive) {
      allItem.classList.remove("active");
    } else {
      allItem.classList.add("active");
    }
  }
  applyFilters();
}

// 필터링 적용 함수
function applyFilters() {
  const specialFilters = getCheckedValues("special");
  const industries = getCheckedValues("industry");
  const years = getCheckedValues("year");
  const locations = getCheckedValues("location");
  const ages = getCheckedValues("age");
  const genders = getCheckedValues("gender");
  const certifications = getCheckedValues("certification");

  filteredStartups = startupsData.filter((startup) => {
    // 검색어 필터
    let matchSearch = true;
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      matchSearch =
        startup.name.toLowerCase().includes(query) ||
        startup.description.toLowerCase().includes(query) ||
        startup.industryLabel.toLowerCase().includes(query) ||
        startup.location.toLowerCase().includes(query) ||
        startup.ceoName.toLowerCase().includes(query);
    }

    // 0. 특수 필터 (즐겨찾기 등)
    let matchSpecial = true;
    if (specialFilters.length > 0 && !specialFilters.includes("all")) {
      matchSpecial = specialFilters.every((filter) => {
        if (filter === "bookmarked")
          return BookmarkMgr.isBookmarked("startups", startup.id);
        return false;
      });
    }

    // 1. 업종
    const matchIndustry =
      industries.length === 0 ||
      industries.includes("all") ||
      industries.includes(startup.industry);

    // 2. 설립년도 (현재 2026년 기준)
    const currentYear = new Date().getFullYear();
    const foundedYear = new Date(startup.foundedDate).getFullYear();
    const period = currentYear - foundedYear; // 만 햇수 근사치

    let matchYear = false;
    if (years.length === 0) matchYear = true;
    else {
      if (years.includes("1y") && period < 1) matchYear = true;
      if (years.includes("1-3y") && period >= 1 && period < 3) matchYear = true;
      if (years.includes("3-7y") && period >= 3 && period < 7) matchYear = true;
      if (years.includes("7y+") && period >= 7) matchYear = true;
    }

    // 3. 소재지
    const matchLocation =
      locations.length === 0 || locations.includes(startup.location);

    // 4. 대표자 나이
    let matchAge = false;
    if (ages.length === 0) matchAge = true;
    else {
      if (ages.includes("under39") && startup.ceoAge < 39) matchAge = true;
      if (ages.includes("over39") && startup.ceoAge >= 39) matchAge = true;
    }

    // 5. 성별
    const matchGender =
      genders.length === 0 || genders.includes(startup.ceoGender);

    // 6. 인증현황
    let matchCert = true;
    if (certifications.length > 0) {
      matchCert = certifications.some((cert) =>
        startup.certifications.includes(cert),
      );
    }

    return (
      matchSearch &&
      matchIndustry &&
      matchYear &&
      matchLocation &&
      matchAge &&
      matchGender &&
      matchCert &&
      matchSpecial
    );
  });

  renderStartups(filteredStartups);
  updateResultsCount(filteredStartups.length);
}

// 헬퍼: 체크된 값 가져오기
function getCheckedValues(name) {
  if (name === "special") {
    const activeTags = document.querySelectorAll(".special-tag.active");
    return Array.from(activeTags).map((tag) => tag.dataset.special);
  }
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map((cb) => cb.value);
}

function updateResultsCount(count) {
  const element = document.getElementById("totalCount");
  if (element) {
    element.textContent = count;
  }
}

function resetFilters() {
  // 검색어 초기화
  clearSearch();

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.checked = cb.name === "industry" && cb.value === "all";
  });

  // 특수 필터 초기화
  document.querySelectorAll(".special-tag").forEach((tag) => {
    tag.classList.remove("active");
  });
  const allTag = document.querySelector('.special-tag[data-special="all"]');
  if (allTag) allTag.classList.add("active");

  applyFilters();
}

function sortData() {
  const sortValue = document.getElementById("sortSelect").value;

  if (sortValue === "recent") {
    filteredStartups.sort(
      (a, b) => new Date(b.foundedDate) - new Date(a.foundedDate),
    );
  } else if (sortValue === "name") {
    filteredStartups.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "founded") {
    filteredStartups.sort(
      (a, b) => new Date(a.foundedDate) - new Date(b.foundedDate),
    );
  }

  renderStartups(filteredStartups);
}

// 모달
function openModal(id) {
  const startup = startupsData.find((s) => s.id === id);
  if (!startup) return;

  const modal = document.getElementById("detailModal");
  const modalBody = document.getElementById("modalBody");

  const badges = startup.certifications
    .map((cert) => {
      let label = "";
      if (cert === "venture") label = "벤처기업";
      if (cert === "innobiz") label = "이노비즈";
      if (cert === "mainbiz") label = "메인비즈";
      return `<span class="tag tag-special">${label}</span>`;
    })
    .join("");

  const foundedYear = new Date(startup.foundedDate).getFullYear();

  modalBody.innerHTML = `
    <div class="modal-header">
      <div style="display: flex; align-items: center; gap: 2rem;">
        <div class="avatar avatar-lg" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
          <i class="fa-solid fa-rocket"></i>
        </div>
        <div>
          <h2 style="font-size: 2rem; margin-bottom: 0.5rem; letter-spacing: -0.01em;">${startup.name}</h2>
          <p style="color: #059669; font-weight: 700; font-size: 1.1rem; margin-bottom: 0.75rem;">${startup.industryLabel} · ${startup.location}</p>
          <div style="display: flex; gap: 0.5rem;">
            ${badges}
          </div>
        </div>
      </div>
    </div>

    <div class="modal-body">
      <div class="u-section">
        <h3>스타트업 프로필</h3>
        <div class="u-card" style="padding: 1.5rem; background: #f0fdf4; border: 1px solid #dcfce7; box-shadow: none;">
          <p style="color: #064e3b; line-height: 1.7; font-size: 1rem; font-weight: 500;">
            ${startup.description}
          </p>
        </div>
      </div>

      <div class="u-section">
        <h3>기업 및 대표자 정보</h3>
        <div class="u-grid-2">
          <div class="u-card" style="padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; box-shadow: none;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">설립일 (업력)</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #1e293b;">${startup.foundedDate} <span style="font-size: 0.9rem; color: #64748b;">(${new Date().getFullYear() - foundedYear + 1}년차)</span></div>
          </div>
          <div class="u-card" style="padding: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; box-shadow: none;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">대표자 정보</div>
            <div style="font-size: 1.3rem; font-weight: 800; color: #1e293b;">${startup.ceoAge}세 <span style="font-size: 0.9rem; color: #64748b;">(${startup.ceoGender === "male" ? "남성" : "여성"})</span></div>
          </div>
        </div>
      </div>

      <div class="u-section">
        <h3>연락처 및 투자 검토 자료</h3>
        <div class="u-card" style="padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: none;">
          <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-globe" style="color: #059669; width: 20px;"></i>
              <a href="${startup.website}" target="_blank" style="text-decoration: none; color: #1e293b; font-weight: 500;">${startup.website}</a>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fa-solid fa-envelope" style="color: #059669; width: 20px;"></i>
              <span style="color: #1e293b; font-weight: 500;">${startup.email}</span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button class="btn-calculate" onclick="alert('${startup.imFile ? "IM 다운로드" : "준비중"}')" style="margin-top: 0; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
              <i class="fa-solid fa-file-lines"></i> IM 열람
            </button>
            <button class="btn-calculate" onclick="alert('${startup.irFile ? "IR 다운로드" : "준비중"}')" style="margin-top: 0; background: #059669;">
              <i class="fa-solid fa-file-pdf"></i> IR 열람
            </button>
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <button class="btn-primary" style="width: 100%; padding: 1.1rem; font-size: 1.1rem; border-radius: 16px; background: #059669;">미팅 신청하기</button>
      </div>
    </div>
  `;

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("detailModal").style.display = "none";
}

window.onclick = function (event) {
  const modal = document.getElementById("detailModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

function formatAge(age) {
  return age < 39 ? "청년창업" : "일반창업";
}
