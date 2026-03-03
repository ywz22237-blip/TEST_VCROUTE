// API Configuration
const API_BASE_URL = "http://localhost:3000";

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem("auth_token");
}

// API Helper function
async function apiRequest(endpoint, method = "GET", data = null) {
  const token = getAuthToken();
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "API 요청 실패");
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Data stores (loaded from API)
let adminInvestorsData = [];
let adminStartupsData = [];
let adminFundsData = [];
let adminNoticesData = [];

// Load data from API
async function loadInvestors() {
  try {
    const result = await apiRequest("/api/investors");
    adminInvestorsData = result.data || result;
    return adminInvestorsData;
  } catch (error) {
    console.error("투자자 데이터 로드 실패:", error);
    return [];
  }
}

async function loadStartups() {
  try {
    const result = await apiRequest("/api/startups");
    adminStartupsData = result.data || result;
    return adminStartupsData;
  } catch (error) {
    console.error("스타트업 데이터 로드 실패:", error);
    return [];
  }
}

async function loadFunds() {
  try {
    const result = await apiRequest("/api/funds");
    adminFundsData = result.data || result;
    return adminFundsData;
  } catch (error) {
    console.error("펀드 데이터 로드 실패:", error);
    return [];
  }
}

async function loadNotices() {
  try {
    const result = await apiRequest("/api/admin/notices");
    adminNoticesData = result.data || result;
    return adminNoticesData;
  } catch (error) {
    console.error("공지사항 데이터 로드 실패:", error);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const pageTitle = document.getElementById("pageTitle");
  const mainContent = document.getElementById("mainContent");
  const homeContent = mainContent.innerHTML;

  // Modal elements
  const investorModal = document.getElementById("investorUploadModal");
  const investorForm = document.getElementById("investorUploadForm");
  const startupModal = document.getElementById("startupUploadModal");
  const startupForm = document.getElementById("startupUploadForm");
  const fundModal = document.getElementById("fundUploadModal");
  const fundForm = document.getElementById("fundUploadForm");
  const noticeModal = document.getElementById("noticeUploadModal");
  const noticeForm = document.getElementById("noticeUploadForm");

  // Navigation handling
  navItems.forEach((item) => {
    item.addEventListener("click", async (e) => {
      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      const menuName = item.querySelector("span").textContent;
      const menuId = item.dataset.menu;
      pageTitle.textContent = menuName;

      if (menuId === "home") {
        mainContent.innerHTML = homeContent;
      } else if (menuId === "funds") {
        await loadFunds();
        renderFundManagement();
      } else if (menuId === "investors") {
        await loadInvestors();
        renderInvestorManagement();
      } else if (menuId === "startups") {
        await loadStartups();
        renderStartupManagement();
      } else if (menuId === "notice") {
        await loadNotices();
        renderNoticeManagement();
      } else {
        mainContent.innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <h3>${menuName} 준비 중</h3>
            <p style="color: #64748b;">현재 개발 중인 기능입니다.</p>
          </div>
        `;
      }
    });
  });

  // Event delegation for main content
  mainContent.addEventListener("click", async (e) => {
    // Investor buttons
    if (e.target.closest("#btnUploadInvestor")) {
      openInvestorModal();
      return;
    }
    if (e.target.closest(".delete-btn")) {
      const id = parseInt(e.target.closest(".delete-btn").dataset.id);
      if (confirm("정말 이 투자자를 삭제하시겠습니까?")) {
        await deleteInvestor(id);
      }
      return;
    }
    if (e.target.closest(".edit-btn")) {
      const id = parseInt(e.target.closest(".edit-btn").dataset.id);
      const investor = adminInvestorsData.find((inv) => inv.id === id);
      if (investor) openInvestorModal(investor);
      return;
    }

    // Startup buttons
    if (e.target.closest("#btnUploadStartup")) {
      openStartupModal();
      return;
    }
    if (e.target.closest(".delete-startup-btn")) {
      const id = parseInt(e.target.closest(".delete-startup-btn").dataset.id);
      if (confirm("정말 이 스타트업을 삭제하시겠습니까?")) {
        await deleteStartup(id);
      }
      return;
    }
    if (e.target.closest(".edit-startup-btn")) {
      const id = parseInt(e.target.closest(".edit-startup-btn").dataset.id);
      const startup = adminStartupsData.find((s) => s.id === id);
      if (startup) openStartupModal(startup);
      return;
    }

    // Fund buttons
    if (e.target.closest("#btnUploadFund")) {
      openFundModal();
      return;
    }
    if (e.target.closest(".delete-fund-btn")) {
      const id = parseInt(e.target.closest(".delete-fund-btn").dataset.id);
      if (confirm("정말 이 펀드를 삭제하시겠습니까?")) {
        await deleteFund(id);
      }
      return;
    }
    if (e.target.closest(".edit-fund-btn")) {
      const id = parseInt(e.target.closest(".edit-fund-btn").dataset.id);
      const fund = adminFundsData.find((f) => f.id === id);
      if (fund) openFundModal(fund);
      return;
    }

    // Notice buttons
    if (e.target.closest("#btnUploadNotice")) {
      openNoticeModal();
      return;
    }
    if (e.target.closest(".delete-notice-btn")) {
      const id = parseInt(e.target.closest(".delete-notice-btn").dataset.id);
      if (confirm("정말 이 공지사항을 삭제하시겠습니까?")) {
        await deleteNotice(id);
      }
      return;
    }
    if (e.target.closest(".edit-notice-btn")) {
      const id = parseInt(e.target.closest(".edit-notice-btn").dataset.id);
      const notice = adminNoticesData.find((n) => n.id === id);
      if (notice) openNoticeModal(notice);
      return;
    }
  });

  // =========== INVESTOR FUNCTIONS ===========
  function openInvestorModal(investor = null) {
    if (!investorModal) return;
    investorModal.style.display = "block";
    const idInput = document.getElementById("investorId");

    if (investor) {
      document.querySelector("#investorUploadModal h3").textContent = "투자자 수정";
      idInput.value = investor.id;
      investorForm.name.value = investor.name || "";
      investorForm.type.value = investor.type || "";
      investorForm.email.value = investor.email || investor.contact || "";
      investorForm.exitCount.value = investor.exitCount || 0;
    } else {
      document.querySelector("#investorUploadModal h3").textContent = "투자자 등록";
      investorForm.reset();
      idInput.value = "Auto-generated";
    }
  }

  function closeInvestorModal() {
    if (investorModal) {
      investorModal.style.display = "none";
      investorForm.reset();
    }
  }

  async function deleteInvestor(id) {
    try {
      await apiRequest(`/api/investors/${id}`, "DELETE");
      alert("투자자 삭제 완료");
      await loadInvestors();
      renderInvestorManagement();
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  }

  // =========== STARTUP FUNCTIONS ===========
  function openStartupModal(startup = null) {
    if (!startupModal) return;
    startupModal.style.display = "block";
    const idInput = document.getElementById("startupId");

    if (startup) {
      document.querySelector("#startupUploadModal h3").textContent = "스타트업 수정";
      idInput.value = startup.id;
      startupForm.name.value = startup.name || "";
      startupForm.industry.value = startup.industry || startup.industryLabel || "";
      startupForm.foundedDate.value = startup.foundedDate || "";
      startupForm.location.value = startup.location || "";
      startupForm.website.value = startup.website || "";
      startupForm.email.value = startup.email || "";
      startupForm.contact.value = startup.contact || "";
      startupForm.ceoAge.value = startup.ceoAge || "";
      startupForm.ceoGender.value = startup.ceoGender || "male";
      startupForm.certification.value = startup.certification || "";
      startupForm.description.value = startup.description || "";
    } else {
      document.querySelector("#startupUploadModal h3").textContent = "스타트업 등록";
      startupForm.reset();
      idInput.value = "Auto-generated";
    }
  }

  function closeStartupModal() {
    if (startupModal) {
      startupModal.style.display = "none";
      startupForm.reset();
    }
  }

  async function deleteStartup(id) {
    try {
      await apiRequest(`/api/startups/${id}`, "DELETE");
      alert("스타트업 삭제 완료");
      await loadStartups();
      renderStartupManagement();
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  }

  // =========== FUND FUNCTIONS ===========
  function openFundModal(fund = null) {
    if (!fundModal) return;
    fundModal.style.display = "block";
    const idInput = document.getElementById("fundId");

    if (fund) {
      document.getElementById("fundModalTitle").textContent = "투자펀드 수정";
      idInput.value = fund.id;
      fundForm.companyName.value = fund.companyName || "";
      fundForm.type.value = fund.fundType || fund.type || "";
      fundForm.fundName.value = fund.fundName || "";
      fundForm.registeredAt.value = fund.registeredAt || "";
      fundForm.expiredAt.value = fund.expiredAt || "";
      fundForm.settlementMonth.value = fund.settlementMonth || "";
      fundForm.manager.value = fund.manager || "";
      fundForm.support.value = fund.support || "";
      fundForm.purpose.value = fund.purpose || "";
      fundForm.industry.value = fund.industry || "";
      fundForm.baseRate.value = fund.baseRate || "";
      fundForm.totalAmount.value = fund.totalAmount || "";
    } else {
      document.getElementById("fundModalTitle").textContent = "투자펀드 등록";
      fundForm.reset();
      idInput.value = "";
    }
  }

  function closeFundModal() {
    if (fundModal) {
      fundModal.style.display = "none";
      fundForm.reset();
    }
  }

  async function deleteFund(id) {
    try {
      await apiRequest(`/api/funds/${id}`, "DELETE");
      alert("펀드 삭제 완료");
      await loadFunds();
      renderFundManagement();
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  }

  // =========== NOTICE FUNCTIONS ===========
  function openNoticeModal(notice = null) {
    if (!noticeModal) return;
    noticeModal.style.display = "block";
    const idInput = document.getElementById("noticeId");

    if (notice) {
      document.getElementById("noticeModalTitle").textContent = "공지사항 수정";
      idInput.value = notice.id;
      noticeForm.category.value = notice.category || "notice";
      noticeForm.tag.value = notice.tag || "";
      noticeForm.title.value = notice.title || "";
      noticeForm.summary.value = notice.summary || "";
      noticeForm.author.value = notice.author || "";
      noticeForm.authorRole.value = notice.authorRole || "";
      noticeForm.content.value = notice.content || "";
    } else {
      document.getElementById("noticeModalTitle").textContent = "공지사항 등록";
      noticeForm.reset();
      idInput.value = "";
    }
  }

  function closeNoticeModal() {
    if (noticeModal) {
      noticeModal.style.display = "none";
      noticeForm.reset();
    }
  }

  async function deleteNotice(id) {
    try {
      await apiRequest(`/api/admin/notices/${id}`, "DELETE");
      alert("공지사항 삭제 완료");
      await loadNotices();
      renderNoticeManagement();
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  }

  // =========== MODAL CLOSE EVENTS ===========
  // Investor modal
  const closeInvBtn = document.querySelector(".close-modal");
  const cancelInvBtn = document.querySelector(".close-modal-btn");
  if (closeInvBtn) closeInvBtn.addEventListener("click", closeInvestorModal);
  if (cancelInvBtn) cancelInvBtn.addEventListener("click", closeInvestorModal);

  // Startup modal
  const closeStpBtn = document.querySelector(".close-startup-modal");
  const cancelStpBtn = document.querySelector(".close-startup-btn");
  if (closeStpBtn) closeStpBtn.addEventListener("click", closeStartupModal);
  if (cancelStpBtn) cancelStpBtn.addEventListener("click", closeStartupModal);

  // Fund modal
  const closeFundBtn = document.querySelector(".close-fund-modal");
  const cancelFundBtn = document.querySelector(".close-fund-btn");
  if (closeFundBtn) closeFundBtn.addEventListener("click", closeFundModal);
  if (cancelFundBtn) cancelFundBtn.addEventListener("click", closeFundModal);

  // Notice modal
  const closeNoticeBtn = document.querySelector(".close-notice-modal");
  const cancelNoticeBtn = document.querySelector(".close-notice-btn");
  if (closeNoticeBtn) closeNoticeBtn.addEventListener("click", closeNoticeModal);
  if (cancelNoticeBtn) cancelNoticeBtn.addEventListener("click", closeNoticeModal);

  // Outside click close
  window.addEventListener("click", (e) => {
    if (e.target === investorModal) closeInvestorModal();
    if (e.target === startupModal) closeStartupModal();
    if (e.target === fundModal) closeFundModal();
    if (e.target === noticeModal) closeNoticeModal();
  });

  // =========== FORM SUBMISSIONS ===========
  // Investor form
  if (investorForm) {
    investorForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("investorId");
      const isEdit = idInput.value && idInput.value !== "Auto-generated";
      const formData = new FormData(investorForm);

      const data = {
        name: formData.get("name"),
        type: formData.get("type"),
        email: formData.get("email"),
        contact: formData.get("email"),
        exitCount: parseInt(formData.get("exitCount")) || 0,
      };

      try {
        if (isEdit) {
          await apiRequest(`/api/investors/${idInput.value}`, "PUT", data);
          alert("투자자 수정 완료");
        } else {
          await apiRequest("/api/investors", "POST", data);
          alert("투자자 등록 완료");
        }
        closeInvestorModal();
        await loadInvestors();
        renderInvestorManagement();
      } catch (error) {
        alert("저장 실패: " + error.message);
      }
    });
  }

  // Startup form
  if (startupForm) {
    startupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("startupId");
      const isEdit = idInput.value && idInput.value !== "Auto-generated";
      const formData = new FormData(startupForm);

      const data = {
        name: formData.get("name"),
        industry: formData.get("industry"),
        industryLabel: formData.get("industry"),
        foundedDate: formData.get("foundedDate"),
        location: formData.get("location"),
        website: formData.get("website"),
        email: formData.get("email"),
        contact: formData.get("contact"),
        ceoAge: parseInt(formData.get("ceoAge")) || null,
        ceoGender: formData.get("ceoGender"),
        certification: formData.get("certification"),
        description: formData.get("description"),
      };

      try {
        if (isEdit) {
          await apiRequest(`/api/startups/${idInput.value}`, "PUT", data);
          alert("스타트업 수정 완료");
        } else {
          await apiRequest("/api/startups", "POST", data);
          alert("스타트업 등록 완료");
        }
        closeStartupModal();
        await loadStartups();
        renderStartupManagement();
      } catch (error) {
        alert("저장 실패: " + error.message);
      }
    });
  }

  // Fund form
  if (fundForm) {
    fundForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("fundId");
      const isEdit = idInput.value && idInput.value !== "";
      const formData = new FormData(fundForm);

      const data = {
        companyName: formData.get("companyName"),
        fundType: formData.get("type"),
        fundName: formData.get("fundName"),
        registeredAt: formData.get("registeredAt"),
        expiredAt: formData.get("expiredAt"),
        settlementMonth: parseInt(formData.get("settlementMonth")),
        manager: formData.get("manager"),
        support: formData.get("support"),
        purpose: formData.get("purpose"),
        industry: formData.get("industry"),
        baseRate: parseFloat(formData.get("baseRate")),
        totalAmount: parseInt(formData.get("totalAmount")),
      };

      try {
        if (isEdit) {
          await apiRequest(`/api/funds/${idInput.value}`, "PUT", data);
          alert("투자펀드 수정 완료");
        } else {
          await apiRequest("/api/funds", "POST", data);
          alert("투자펀드 등록 완료");
        }
        closeFundModal();
        await loadFunds();
        renderFundManagement();
      } catch (error) {
        alert("저장 실패: " + error.message);
      }
    });
  }

  // Notice form
  if (noticeForm) {
    noticeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("noticeId");
      const isEdit = idInput.value && idInput.value !== "";
      const formData = new FormData(noticeForm);

      const data = {
        category: formData.get("category"),
        tag: formData.get("tag"),
        title: formData.get("title"),
        summary: formData.get("summary"),
        author: formData.get("author"),
        authorRole: formData.get("authorRole"),
        content: formData.get("content"),
        date: new Date().toISOString().split("T")[0],
      };

      try {
        if (isEdit) {
          await apiRequest(`/api/admin/notices/${idInput.value}`, "PUT", data);
          alert("공지사항 수정 완료");
        } else {
          await apiRequest("/api/admin/notices", "POST", data);
          alert("공지사항 등록 완료");
        }
        closeNoticeModal();
        await loadNotices();
        renderNoticeManagement();
      } catch (error) {
        alert("저장 실패: " + error.message);
      }
    });
  }

  // =========== RENDER FUNCTIONS ===========
  function renderInvestorManagement() {
    mainContent.innerHTML = `
      <div class="content-header-row">
        <h3>투자자 목록 (${adminInvestorsData.length})</h3>
        <button id="btnUploadInvestor" class="btn-primary">
          <i class="fa-solid fa-plus"></i> 투자자 업로드
        </button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이름 (회사명)</th>
              <th>유형</th>
              <th>이메일</th>
              <th>졸업 횟수</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${adminInvestorsData.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:#64748b;">등록된 투자자가 없습니다.</td></tr>
            ` : adminInvestorsData.map((investor) => `
              <tr>
                <td>${investor.id}</td>
                <td>${investor.name}${investor.company ? ` (${investor.company})` : ""}</td>
                <td>${formatType(investor.type)}</td>
                <td>${investor.email || investor.contact || "-"}</td>
                <td>${investor.exitCount || 0}</td>
                <td>
                  <button class="btn-sm edit-btn" data-id="${investor.id}">수정</button>
                  <button class="btn-sm delete-btn" data-id="${investor.id}">삭제</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderStartupManagement() {
    mainContent.innerHTML = `
      <div class="content-header-row">
        <h3>스타트업 목록 (${adminStartupsData.length})</h3>
        <button id="btnUploadStartup" class="btn-primary">
          <i class="fa-solid fa-plus"></i> 스타트업 업로드
        </button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>회사명</th>
              <th>업종</th>
              <th>설립일</th>
              <th>소재지</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${adminStartupsData.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:#64748b;">등록된 스타트업이 없습니다.</td></tr>
            ` : adminStartupsData.map((startup) => `
              <tr>
                <td>${startup.id}</td>
                <td>${startup.name}</td>
                <td>${startup.industryLabel || startup.industry}</td>
                <td>${startup.foundedDate || "-"}</td>
                <td>${startup.location || "-"}</td>
                <td>
                  <button class="btn-sm edit-startup-btn" data-id="${startup.id}">수정</button>
                  <button class="btn-sm delete-startup-btn" data-id="${startup.id}">삭제</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderFundManagement() {
    mainContent.innerHTML = `
      <div class="content-header-row">
        <h3>투자펀드 목록 (${adminFundsData.length})</h3>
        <button id="btnUploadFund" class="btn-primary">
          <i class="fa-solid fa-plus"></i> 펀드 업로드
        </button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>투자자</th>
              <th>조합명</th>
              <th>유형</th>
              <th>대표매니저</th>
              <th>약정총액</th>
              <th>만기일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${adminFundsData.length === 0 ? `
              <tr><td colspan="8" style="text-align:center; padding:2rem; color:#64748b;">등록된 펀드가 없습니다.</td></tr>
            ` : adminFundsData.map((fund) => `
              <tr>
                <td>${fund.id}</td>
                <td title="${fund.companyName}">${fund.companyName}</td>
                <td title="${fund.fundName}">${fund.fundName}</td>
                <td>${fund.fundType || fund.type}</td>
                <td>${fund.manager}</td>
                <td>${formatAmount(fund.totalAmount)}</td>
                <td>${fund.expiredAt}</td>
                <td>
                  <button class="btn-sm edit-fund-btn" data-id="${fund.id}">수정</button>
                  <button class="btn-sm delete-fund-btn" data-id="${fund.id}">삭제</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderNoticeManagement() {
    mainContent.innerHTML = `
      <div class="content-header-row">
        <h3>공지사항 목록 (${adminNoticesData.length})</h3>
        <button id="btnUploadNotice" class="btn-primary">
          <i class="fa-solid fa-plus"></i> 공지사항 등록
        </button>
      </div>

      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>카테고리</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${adminNoticesData.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:2rem; color:#64748b;">등록된 공지사항이 없습니다.</td></tr>
            ` : adminNoticesData.map((notice) => `
              <tr>
                <td>${notice.id}</td>
                <td><span class="category-badge ${notice.category}">${formatCategory(notice.category)}</span></td>
                <td>${notice.title}</td>
                <td>${notice.author}</td>
                <td>${notice.date}</td>
                <td>
                  <button class="btn-sm edit-notice-btn" data-id="${notice.id}">수정</button>
                  <button class="btn-sm delete-notice-btn" data-id="${notice.id}">삭제</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // =========== HELPER FUNCTIONS ===========
  function formatAmount(amount) {
    if (!amount) return "-";
    if (amount >= 100000000) {
      return (amount / 100000000).toLocaleString() + " 억원";
    }
    return amount.toLocaleString() + " 원";
  }

  function formatType(type) {
    const typeMap = {
      vc: "VC",
      llc: "LLC",
      "tech-finance": "신기술금융",
      cvc: "CVC",
      accelerator: "AC",
      angel: "엔젤",
      "angel-club": "엔젤클럽",
      public: "공공",
      overseas: "해외",
    };
    return typeMap[type] || type || "-";
  }

  function formatCategory(category) {
    const categoryMap = {
      notice: "공지",
      update: "업데이트",
      event: "이벤트",
      demoday: "데모데이",
    };
    return categoryMap[category] || category;
  }

  // Logout
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
        window.location.href = "../index.html";
      }
    });
  }

  // =========== BULK UPLOAD FUNCTIONS ===========
  const bulkModal = document.getElementById("bulkUploadModal");
  const bulkForm = document.getElementById("bulkUploadForm");
  const fileDropArea = document.getElementById("fileDropArea");
  const bulkFileInput = document.getElementById("bulkFile");
  const selectedFileName = document.getElementById("selectedFileName");

  function openBulkUploadModal() {
    if (bulkModal) {
      bulkModal.style.display = "block";
      bulkForm.reset();
      selectedFileName.textContent = "CSV 또는 엑셀 파일";
      document.getElementById("uploadResult").style.display = "none";
    }
  }

  function closeBulkUploadModal() {
    if (bulkModal) {
      bulkModal.style.display = "none";
      bulkForm.reset();
    }
  }

  // Bulk upload menu click
  navItems.forEach((item) => {
    if (item.dataset.menu === "bulk-upload") {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        renderBulkUploadPage();
      });
    }
  });

  function renderBulkUploadPage() {
    pageTitle.textContent = "일괄 업로드";
    mainContent.innerHTML = `
      <div class="content-header-row">
        <h3>CSV/엑셀 파일로 데이터 일괄 업로드</h3>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="stats-card" style="cursor: pointer;" onclick="openBulkModal('investors')">
          <div class="icon-box blue"><i class="fa-solid fa-user-tie"></i></div>
          <div class="stats-info">
            <h3>투자자 일괄 업로드</h3>
            <p style="color: #64748b; font-size: 0.85rem;">투자자 데이터를 CSV/엑셀로 등록</p>
          </div>
        </div>
        <div class="stats-card" style="cursor: pointer;" onclick="openBulkModal('startups')">
          <div class="icon-box orange"><i class="fa-solid fa-rocket"></i></div>
          <div class="stats-info">
            <h3>스타트업 일괄 업로드</h3>
            <p style="color: #64748b; font-size: 0.85rem;">스타트업 데이터를 CSV/엑셀로 등록</p>
          </div>
        </div>
        <div class="stats-card" style="cursor: pointer;" onclick="openBulkModal('funds')">
          <div class="icon-box purple"><i class="fa-solid fa-coins"></i></div>
          <div class="stats-info">
            <h3>투자펀드 일괄 업로드</h3>
            <p style="color: #64748b; font-size: 0.85rem;">펀드 데이터를 CSV/엑셀로 등록</p>
          </div>
        </div>
        <div class="stats-card" style="cursor: pointer;" onclick="openBulkModal('notices')">
          <div class="icon-box green"><i class="fa-solid fa-bullhorn"></i></div>
          <div class="stats-info">
            <h3>공지사항 일괄 업로드</h3>
            <p style="color: #64748b; font-size: 0.85rem;">공지사항을 CSV/엑셀로 등록</p>
          </div>
        </div>
      </div>

      <div class="recent-section">
        <h3>📋 엑셀 템플릿 다운로드</h3>
        <p style="color: #64748b; margin-bottom: 1rem;">아래 템플릿을 다운로드하여 데이터를 입력한 후 업로드하세요.</p>
        <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
          <button onclick="downloadTemplate('investors')" class="btn-primary" style="background: #3b82f6;">
            <i class="fa-solid fa-download"></i> 투자자 템플릿
          </button>
          <button onclick="downloadTemplate('startups')" class="btn-primary" style="background: #f97316;">
            <i class="fa-solid fa-download"></i> 스타트업 템플릿
          </button>
          <button onclick="downloadTemplate('funds')" class="btn-primary" style="background: #a855f7;">
            <i class="fa-solid fa-download"></i> 펀드 템플릿
          </button>
          <button onclick="downloadTemplate('notices')" class="btn-primary" style="background: #22c55e;">
            <i class="fa-solid fa-download"></i> 공지사항 템플릿
          </button>
        </div>
      </div>

      <div class="recent-section" style="margin-top: 1.5rem;">
        <h3>🏦 공공 데이터 업로드</h3>
        <p style="color: #64748b; margin-bottom: 1rem;">한국벤처투자 모태펀드 자조합 데이터를 변환하여 바로 업로드할 수 있습니다.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <i class="fa-solid fa-file-csv" style="color: #22c55e; font-size: 1.5rem;"></i>
            <div>
              <div style="font-weight: 600; font-size: 0.95rem;">한국벤처투자_모태펀드 자조합 운용사정보 (1,411건)</div>
              <div style="color: #64748b; font-size: 0.8rem;">대표운영사, 운영사구분, 자조합 규모 → 펀드 형식으로 변환됨</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button onclick="downloadPublicDataTemplate()" class="btn-primary" style="background: #059669; font-size: 0.85rem; padding: 0.4rem 0.9rem;">
              <i class="fa-solid fa-download"></i> 변환 파일 다운로드
            </button>
            <button onclick="openBulkModal('funds')" class="btn-primary" style="background: #a855f7; font-size: 0.85rem; padding: 0.4rem 0.9rem;">
              <i class="fa-solid fa-upload"></i> 펀드로 업로드하기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Global functions for bulk upload
  window.openBulkModal = function(type) {
    openBulkUploadModal();
    document.getElementById("uploadType").value = type;
    document.getElementById("bulkUploadTitle").textContent = getBulkUploadTitle(type);
  };

  function getBulkUploadTitle(type) {
    const titles = {
      investors: "투자자 일괄 업로드",
      startups: "스타트업 일괄 업로드",
      funds: "투자펀드 일괄 업로드",
      notices: "공지사항 일괄 업로드"
    };
    return titles[type] || "CSV/엑셀 일괄 업로드";
  }

  // File drop area events
  if (fileDropArea) {
    fileDropArea.addEventListener("click", () => bulkFileInput.click());

    fileDropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      fileDropArea.style.borderColor = "#2563eb";
      fileDropArea.style.background = "#f1f5f9";
    });

    fileDropArea.addEventListener("dragleave", () => {
      fileDropArea.style.borderColor = "#e2e8f0";
      fileDropArea.style.background = "transparent";
    });

    fileDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      fileDropArea.style.borderColor = "#e2e8f0";
      fileDropArea.style.background = "transparent";

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        bulkFileInput.files = files;
        selectedFileName.textContent = files[0].name;
      }
    });
  }

  if (bulkFileInput) {
    bulkFileInput.addEventListener("change", () => {
      if (bulkFileInput.files.length > 0) {
        selectedFileName.textContent = bulkFileInput.files[0].name;
      }
    });
  }

  // Close bulk modal
  const closeBulkBtn = document.querySelector(".close-bulk-modal");
  const cancelBulkBtn = document.querySelector(".close-bulk-btn");
  if (closeBulkBtn) closeBulkBtn.addEventListener("click", closeBulkUploadModal);
  if (cancelBulkBtn) cancelBulkBtn.addEventListener("click", closeBulkUploadModal);

  window.addEventListener("click", (e) => {
    if (e.target === bulkModal) closeBulkUploadModal();
  });

  // Bulk upload form submit
  if (bulkForm) {
    bulkForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const uploadType = document.getElementById("uploadType").value;
      const file = bulkFileInput.files[0];
      const resultDiv = document.getElementById("uploadResult");
      const submitBtn = document.getElementById("uploadSubmitBtn");

      if (!uploadType) {
        alert("업로드 대상을 선택해주세요.");
        return;
      }

      if (!file) {
        alert("파일을 선택해주세요.");
        return;
      }

      // Show loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 업로드 중...';

      const formData = new FormData();
      formData.append("file", file);

      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/api/upload/${uploadType}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          resultDiv.style.display = "block";
          resultDiv.style.background = "#f0fdf4";
          resultDiv.style.border = "1px solid #22c55e";
          resultDiv.innerHTML = `
            <p style="color: #166534; font-weight: 600; margin: 0 0 0.5rem 0;">✅ ${result.message}</p>
            <p style="color: #15803d; font-size: 0.9rem; margin: 0;">성공: ${result.data.successCount}건 / 실패: ${result.data.errorCount}건</p>
            ${result.data.errors && result.data.errors.length > 0 ? `
              <details style="margin-top: 0.5rem;">
                <summary style="cursor: pointer; color: #dc2626; font-size: 0.85rem;">오류 상세 보기</summary>
                <ul style="margin: 0.5rem 0 0 1rem; font-size: 0.8rem; color: #991b1b;">
                  ${result.data.errors.map(err => `<li>${err}</li>`).join("")}
                </ul>
              </details>
            ` : ""}
          `;

          // Refresh data
          if (uploadType === "investors") await loadInvestors();
          if (uploadType === "startups") await loadStartups();
          if (uploadType === "funds") await loadFunds();
          if (uploadType === "notices") await loadNotices();

        } else {
          resultDiv.style.display = "block";
          resultDiv.style.background = "#fef2f2";
          resultDiv.style.border = "1px solid #ef4444";
          resultDiv.innerHTML = `<p style="color: #dc2626; margin: 0;">❌ ${result.message || "업로드 실패"}</p>`;
        }
      } catch (error) {
        resultDiv.style.display = "block";
        resultDiv.style.background = "#fef2f2";
        resultDiv.style.border = "1px solid #ef4444";
        resultDiv.innerHTML = `<p style="color: #dc2626; margin: 0;">❌ 오류: ${error.message}</p>`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-upload"></i> 업로드';
      }
    });
  }
});

// Template download function (global)
function downloadTemplate(type) {
  const templates = {
    investors: {
      filename: "investors_template.csv",
      headers: ["name", "company", "position", "investments", "successRate", "portfolio", "focusArea", "minInvestment", "maxInvestment", "stage", "bio", "contact"],
      example: ["김태현", "블루포인트", "파트너", "47", "89", "카카오,토스", "AI/ML,핀테크", "100000000", "5000000000", "시드,시리즈A", "10년 경력 투자자", "contact@example.com"]
    },
    startups: {
      filename: "startups_template.csv",
      headers: ["name", "industry", "industryLabel", "foundedDate", "location", "employees", "fundingStage", "fundingAmount", "description", "ceo", "website"],
      example: ["테크노바", "ai", "AI/ML", "2023-03-15", "서울 강남구", "12", "시드", "500000000", "AI 솔루션 개발", "김민준", "https://example.com"]
    },
    funds: {
      filename: "funds_template.csv",
      headers: ["fundType", "companyName", "fundName", "registeredAt", "expiredAt", "settlementMonth", "manager", "support", "purpose", "industry", "baseRate", "totalAmount"],
      example: ["투자조합", "벤처캐피탈A", "제1호 혁신성장 투자조합", "2025-01-10", "2032-01-10", "12", "홍길동", "모태펀드", "초기 창업기업 투자", "AI,ICT", "8.0", "12000000000"]
    },
    notices: {
      filename: "notices_template.csv",
      headers: ["category", "tag", "title", "summary", "author", "authorRole", "date", "content"],
      example: ["notice", "# 공지", "테스트 공지사항", "테스트 요약입니다", "관리자", "Admin", "2026-01-28", "공지사항 내용입니다"]
    }
  };

  const template = templates[type];
  if (!template) return;

  // BOM for UTF-8
  const BOM = "\uFEFF";
  const csvContent = BOM + template.headers.join(",") + "\n" + template.example.join(",");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = template.filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 한국벤처투자 모태펀드 자조합 데이터 다운로드 (global)
function downloadPublicDataTemplate() {
  const link = document.createElement("a");
  link.href = "./templates/funds_kvc_motefund.csv";
  link.download = "한국벤처투자_모태펀드_자조합_변환.csv";
  link.click();
}
