-- VC Route Database Schema

-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  user_type VARCHAR(20),
  phone VARCHAR(20),
  company VARCHAR(200),
  portfolio TEXT,
  bio TEXT,
  marketing_agree BOOLEAN DEFAULT FALSE,
  created_at DATE DEFAULT CURRENT_DATE
);

-- Investors 테이블
CREATE TABLE IF NOT EXISTS investors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(200) NOT NULL,
  position VARCHAR(100) DEFAULT '',
  investments INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  portfolio TEXT[] DEFAULT '{}',
  focus_area TEXT[] DEFAULT '{}',
  min_investment BIGINT DEFAULT 0,
  max_investment BIGINT DEFAULT 0,
  stage TEXT[] DEFAULT '{}',
  bio TEXT DEFAULT '',
  contact VARCHAR(200) DEFAULT ''
);

-- Startups 테이블
CREATE TABLE IF NOT EXISTS startups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  industry_label VARCHAR(100),
  founded_date DATE,
  location VARCHAR(200) DEFAULT '',
  employees INTEGER DEFAULT 0,
  funding_stage VARCHAR(50) DEFAULT '',
  funding_amount BIGINT DEFAULT 0,
  description TEXT DEFAULT '',
  ceo VARCHAR(100) DEFAULT '',
  website VARCHAR(300) DEFAULT ''
);

-- Funds 테이블
CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  fund_type VARCHAR(50) DEFAULT '',
  company_name VARCHAR(200) NOT NULL,
  fund_name VARCHAR(300) NOT NULL,
  registered_at DATE,
  expired_at DATE,
  settlement_month INTEGER DEFAULT 12,
  manager VARCHAR(100) DEFAULT '',
  support VARCHAR(200) DEFAULT '',
  purpose TEXT DEFAULT '',
  industry VARCHAR(300) DEFAULT '',
  base_rate NUMERIC(5,2) DEFAULT 0,
  total_amount BIGINT DEFAULT 0
);

-- Bookmarks 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- Notices 테이블
CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) DEFAULT 'notice',
  tag VARCHAR(50) DEFAULT '# 공지',
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  author VARCHAR(100),
  author_role VARCHAR(100),
  date DATE DEFAULT CURRENT_DATE,
  content TEXT
);

-- Verification Codes 테이블
CREATE TABLE IF NOT EXISTS verification_codes (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  target VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_target ON verification_codes(type, target);
