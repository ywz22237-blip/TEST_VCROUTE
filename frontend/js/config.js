// Supabase Configuration
const SUPABASE_URL = "https://kdfsselcksrnntarumdx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZnNzZWxja3Nybm50YXJ1bWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTI3ODksImV4cCI6MjA4ODk4ODc4OX0._22yAjCX96B62tr2fy7EriktaKPbtDyUgsZ7BPqGMUM";

// API Configuration (레거시 호환)
const API_CONFIG = {
  BASE_URL: "",
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
  module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY, API_CONFIG, STORAGE_KEYS };
}
