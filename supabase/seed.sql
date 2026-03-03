-- VC Route Seed Data

-- Users (비밀번호는 bcrypt 해시)
INSERT INTO users (id, email, password, name, role, created_at) VALUES
(1, 'admin@vcroute.com', '$2a$10$LqHuJ5zKWzqWzqWzqWzqWO8J5zKWzqWzqWzqWzqWzqWzqWzqWzqW', '관리자', 'admin', '2026-01-01');

INSERT INTO users (id, user_id, email, password, name, role, user_type, phone, company, portfolio, bio, marketing_agree, created_at) VALUES
(2, 'ADMIN', 'tempadmin@vcroute.com', '$2a$10$.KWzd6gdbIA/HJ.BrkbGy.S75zqZJwpABsrXDIi.62T3MggMFyRsS', 'ADMIN', 'admin', 'startup', '', '', '', '', FALSE, '2026-02-07');

SELECT setval('users_id_seq', 2);

-- Investors
INSERT INTO investors (id, name, company, position, investments, success_rate, portfolio, focus_area, min_investment, max_investment, stage, bio, contact) VALUES
(1, '김태현', '블루포인트파트너스', '파트너', 47, 89, ARRAY['카카오','토스','당근마켓'], ARRAY['AI/ML','핀테크','SaaS'], 100000000, 5000000000, ARRAY['시드','시리즈A'], '10년 이상의 벤처 투자 경험을 보유한 전문 투자자입니다.', 'taehyun@bluepoint.vc'),
(2, '이수진', '소프트뱅크벤처스', '시니어 파트너', 62, 92, ARRAY['쿠팡','야놀자','무신사'], ARRAY['이커머스','플랫폼','모빌리티'], 500000000, 20000000000, ARRAY['시리즈A','시리즈B'], '글로벌 네트워크를 활용한 스타트업 성장 지원 전문가입니다.', 'sujin@softbank.vc'),
(3, '박준호', '스파크랩', '공동창업자', 156, 78, ARRAY['센드버드','미소','마이리얼트립'], ARRAY['B2B SaaS','딥테크','헬스케어'], 50000000, 1000000000, ARRAY['프리시드','시드'], '초기 스타트업 전문 액셀러레이터로 150개 이상 스타트업 투자 경험.', 'junho@sparklab.co'),
(4, '정민서', '카카오벤처스', '이사', 38, 85, ARRAY['직방','오늘의집','클래스101'], ARRAY['프롭테크','에듀테크','콘텐츠'], 200000000, 3000000000, ARRAY['시드','시리즈A'], '카카오 생태계와 연결된 전략적 투자를 진행합니다.', 'minseo@kakaoventures.com'),
(5, '최영훈', '알토스벤처스', '매니징 파트너', 89, 94, ARRAY['우아한형제들','비바리퍼블리카','크래프톤'], ARRAY['플랫폼','게임','핀테크'], 1000000000, 50000000000, ARRAY['시리즈A','시리즈B','시리즈C'], '한국 최대 규모 VC 중 하나로 유니콘 기업 다수 배출.', 'younghoon@altosventures.com');

SELECT setval('investors_id_seq', 5);

-- Startups
INSERT INTO startups (id, name, industry, industry_label, founded_date, location, employees, funding_stage, funding_amount, description, ceo, website) VALUES
(1, '테크노바', 'ai', 'AI/ML', '2023-03-15', '서울 강남구', 12, '시드', 500000000, '자연어 처리 기반 기업용 AI 어시스턴트 개발', '김민준', 'https://technova.ai'),
(2, '그린에너지텍', 'energy', '에너지/환경', '2022-07-20', '대전 유성구', 28, '시리즈A', 3000000000, '차세대 태양광 패널 및 에너지 저장 시스템 개발', '이서연', 'https://greenenergy.tech'),
(3, '헬스커넥트', 'healthcare', '헬스케어', '2021-11-10', '서울 서초구', 45, '시리즈B', 15000000000, 'AI 기반 원격 의료 진단 플랫폼', '박지훈', 'https://healthconnect.kr'),
(4, '핀플로우', 'fintech', '핀테크', '2024-01-05', '서울 영등포구', 8, '프리시드', 100000000, '소상공인을 위한 간편 금융 서비스 플랫폼', '최유진', 'https://finflow.io'),
(5, '에듀브릿지', 'edutech', '에듀테크', '2022-09-01', '경기 성남시', 35, '시리즈A', 5000000000, '메타버스 기반 실시간 협업 교육 플랫폼', '정하늘', 'https://edubridge.co.kr');

SELECT setval('startups_id_seq', 5);

-- Funds
INSERT INTO funds (id, fund_type, company_name, fund_name, registered_at, expired_at, settlement_month, manager, support, purpose, industry, base_rate, total_amount) VALUES
(1, '투자조합', '벤처캐피탈 A', '제1호 혁신성장 투자조합', '2025-01-10', '2032-01-10', 12, '홍길동', '모태펀드', '초기 창업기업 선제적 투자 및 육성', 'AI, ICT, 빅데이터', 8.0, 12000000000),
(2, '개인투자조합', '스타트업 인베스트', '스타트업 엔젤 매칭펀드', '2024-05-15', '2030-05-15', 3, '이수진', '자체결성', '시드 단계 스타트업 발굴', '핀테크, 커머스', 5.0, 2500000000),
(3, '투자조합', '퓨처벤처스', '퓨처 헬스케어 펀드', '2024-11-20', '2031-11-20', 12, '박준호', '성장금융', '디지털 헬스케어 기반 기술 투자', '바이오, 헬스케어', 7.5, 45000000000),
(4, 'PEF', '그로스 파트너스', '그로스 제1호 사모투자합자회사', '2023-08-05', '2033-08-05', 6, '최민서', '연기금', '중견기업 사업재편 및 스케일업 지원', '소부장, 제조테크', 10.0, 150000000000),
(5, '투자조합', '모빌리티 벤처스', '스마트 모빌리티 펀드', '2025-02-01', '2032-02-01', 12, '정우성', '지자체 매칭', '자율주행 및 미래 모빌리티 인프라', '모빌리티, 이차전지', 6.0, 30000000000);

SELECT setval('funds_id_seq', 5);

-- Notices
INSERT INTO notices (id, category, tag, title, summary, author, author_role, date, content) VALUES
(1, 'notice', '# 공지', 'VC route 서비스 정식 런칭 및 기능 안내', '대한민국 스타트업 투자 생태계를 혁신할 VC route가 정식으로 런칭되었습니다.', '관리자', 'VC route Team', '2026-01-25', 'VC route 서비스 정식 런칭을 알려드립니다...');

SELECT setval('notices_id_seq', 1);
