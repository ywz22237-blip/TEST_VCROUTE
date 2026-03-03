// API Configuration
const API_CONFIG = {
  BASE_URL: "", // 같은 도메인 사용 (Vercel 배포 시 상대경로)
  ENDPOINTS: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    USER_INFO: "/api/auth/user",
  },
};

// Local Storage Keys
const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "user_info",
};

// Export configuration
if (typeof module !== "undefined" && module.exports) {
  module.exports = { API_CONFIG, STORAGE_KEYS };
}
