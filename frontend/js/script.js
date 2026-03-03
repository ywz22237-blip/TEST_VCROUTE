// Header scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  if (window.scrollY > 50) {
    header.style.background = "rgba(255, 255, 255, 0.95)";
  } else {
    header.style.background = "rgba(255, 255, 255, 0.9)";
  }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe feature cards and process steps
document.querySelectorAll(".feature-card, .process-step").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(el);
});

// Add loading animation completion
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

// 즐겨찾기 유틸리티
const BookmarkMgr = {
  getBookmarks: function () {
    const data = localStorage.getItem("vc_bookmarks");
    return data ? JSON.parse(data) : { funds: [], startups: [], investors: [] };
  },
  saveBookmarks: function (bookmarks) {
    localStorage.setItem("vc_bookmarks", JSON.stringify(bookmarks));
  },
  toggle: function (type, id) {
    const bookmarks = this.getBookmarks();
    const index = bookmarks[type].indexOf(id);
    let added = false;
    if (index === -1) {
      bookmarks[type].push(id);
      added = true;
    } else {
      bookmarks[type].splice(index, 1);
      added = false;
    }
    this.saveBookmarks(bookmarks);
    return added;
  },
  isBookmarked: function (type, id) {
    const bookmarks = this.getBookmarks();
    return bookmarks[type].includes(id);
  },
};

function handleBookmarkUpdate(type, id, btn) {
  const added = BookmarkMgr.toggle(type, id);
  const icon = btn.querySelector("i");
  if (added) {
    btn.classList.add("active");
    icon.classList.remove("fa-regular");
    icon.classList.add("fa-solid");
  } else {
    btn.classList.remove("active");
    icon.classList.remove("fa-solid");
    icon.classList.add("fa-regular");
  }
}

// Language Toggle 기능
function toggleLangDropdown() {
  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.classList.toggle("open");
  }
}

function selectLang(langCode, langName) {
  // 버튼 텍스트 업데이트
  const currentLangEl = document.getElementById("currentLang");
  if (currentLangEl) {
    currentLangEl.textContent = langName;
  }

  // 드롭다운 아이템 active 상태 업데이트
  document.querySelectorAll(".lang-dropdown-item").forEach((item) => {
    item.classList.remove("active");
    if (item.textContent === langName) {
      item.classList.add("active");
    }
  });

  // localStorage에 저장
  localStorage.setItem("selectedLanguage", langCode);
  localStorage.setItem("selectedLanguageName", langName);

  // 드롭다운 닫기
  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.classList.remove("open");
  }
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener("click", function (e) {
  const toggle = document.getElementById("langToggle");
  if (toggle && !toggle.contains(e.target)) {
    toggle.classList.remove("open");
  }
});

// 페이지 로드 시 저장된 언어 설정 적용
document.addEventListener("DOMContentLoaded", function () {
  const savedLangName = localStorage.getItem("selectedLanguageName") || "Language";

  // 버튼 텍스트 업데이트
  const currentLangEl = document.getElementById("currentLang");
  if (currentLangEl) {
    currentLangEl.textContent = savedLangName;
  }

  // 드롭다운 아이템 active 상태 업데이트
  document.querySelectorAll(".lang-dropdown-item").forEach((item) => {
    item.classList.remove("active");
    if (item.textContent === savedLangName) {
      item.classList.add("active");
    }
  });
});
