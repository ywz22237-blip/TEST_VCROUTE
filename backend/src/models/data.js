// Supabase 기반 데이터 접근 계층
const supabase = require('../config/supabase');

// --- Users ---
const users = {
  async findAll() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(toUserObj);
  },
  async findById(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toUserObj(data) : null;
  },
  async findByEmail(email) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toUserObj(data) : null;
  },
  async findByEmailOrUserId(value) {
    const { data, error } = await supabase.from('users').select('*').or(`email.eq.${value},user_id.eq.${value}`);
    if (error) throw error;
    return data && data.length > 0 ? toUserObj(data[0]) : null;
  },
  async findByUserId(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toUserObj(data) : null;
  },
  async create(user) {
    const dbUser = {
      user_id: user.userId || null,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role || 'user',
      user_type: user.userType || null,
      phone: user.phone || null,
      company: user.company || null,
      portfolio: user.portfolio || null,
      bio: user.bio || null,
      marketing_agree: !!user.marketingAgree,
      created_at: new Date().toISOString().split('T')[0]
    };
    const { data, error } = await supabase.from('users').insert(dbUser).select().single();
    if (error) throw error;
    return toUserObj(data);
  },
  async update(id, updates) {
    const dbUpdates = {};
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.portfolio !== undefined) dbUpdates.portfolio = updates.portfolio;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return toUserObj(data);
  },
  async delete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },
  async count() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  }
};

function toUserObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    userType: row.user_type,
    phone: row.phone,
    company: row.company,
    portfolio: row.portfolio,
    bio: row.bio,
    marketingAgree: row.marketing_agree,
    createdAt: row.created_at
  };
}

// --- Investors ---
const investors = {
  async findAll(filters = {}) {
    let query = supabase.from('investors').select('*');
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }
    if (filters.focusArea) {
      query = query.contains('focus_area', [filters.focusArea]);
    }
    if (filters.stage) {
      query = query.contains('stage', [filters.stage]);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toInvestorObj);
  },
  async findById(id) {
    const { data, error } = await supabase.from('investors').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toInvestorObj(data) : null;
  },
  async create(investor) {
    const dbInvestor = {
      name: investor.name,
      company: investor.company,
      position: investor.position || '',
      investments: investor.investments || 0,
      success_rate: investor.successRate || 0,
      portfolio: investor.portfolio || [],
      focus_area: investor.focusArea || [],
      min_investment: investor.minInvestment || 0,
      max_investment: investor.maxInvestment || 0,
      stage: investor.stage || [],
      bio: investor.bio || '',
      contact: investor.contact || ''
    };
    const { data, error } = await supabase.from('investors').insert(dbInvestor).select().single();
    if (error) throw error;
    return toInvestorObj(data);
  },
  async update(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.position !== undefined) dbUpdates.position = updates.position;
    if (updates.investments !== undefined) dbUpdates.investments = updates.investments;
    if (updates.successRate !== undefined) dbUpdates.success_rate = updates.successRate;
    if (updates.portfolio !== undefined) dbUpdates.portfolio = updates.portfolio;
    if (updates.focusArea !== undefined) dbUpdates.focus_area = updates.focusArea;
    if (updates.minInvestment !== undefined) dbUpdates.min_investment = updates.minInvestment;
    if (updates.maxInvestment !== undefined) dbUpdates.max_investment = updates.maxInvestment;
    if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    const { data, error } = await supabase.from('investors').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return toInvestorObj(data);
  },
  async delete(id) {
    const { error } = await supabase.from('investors').delete().eq('id', id);
    if (error) throw error;
  },
  async count() {
    const { count, error } = await supabase.from('investors').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  },
  async bulkCreate(items) {
    const dbItems = items.map(inv => ({
      name: inv.name,
      company: inv.company,
      position: inv.position || '',
      investments: parseInt(inv.investments) || 0,
      success_rate: parseFloat(inv.successRate) || 0,
      portfolio: inv.portfolio || [],
      focus_area: inv.focusArea || [],
      min_investment: parseInt(inv.minInvestment) || 0,
      max_investment: parseInt(inv.maxInvestment) || 0,
      stage: inv.stage || [],
      bio: inv.bio || '',
      contact: inv.contact || ''
    }));
    const { data, error } = await supabase.from('investors').insert(dbItems).select();
    if (error) throw error;
    return (data || []).map(toInvestorObj);
  }
};

function toInvestorObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    position: row.position,
    investments: row.investments,
    successRate: row.success_rate,
    portfolio: row.portfolio,
    focusArea: row.focus_area,
    minInvestment: row.min_investment,
    maxInvestment: row.max_investment,
    stage: row.stage,
    bio: row.bio,
    contact: row.contact
  };
}

// --- Startups ---
const startups = {
  async findAll(filters = {}) {
    let query = supabase.from('startups').select('*');
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }
    if (filters.stage) {
      query = query.eq('funding_stage', filters.stage);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toStartupObj);
  },
  async findById(id) {
    const { data, error } = await supabase.from('startups').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toStartupObj(data) : null;
  },
  async create(startup) {
    const dbStartup = {
      name: startup.name,
      industry: startup.industry,
      industry_label: startup.industryLabel || startup.industry,
      founded_date: startup.foundedDate || null,
      location: startup.location || '',
      employees: startup.employees || 0,
      funding_stage: startup.fundingStage || '',
      funding_amount: startup.fundingAmount || 0,
      description: startup.description || '',
      ceo: startup.ceo || '',
      website: startup.website || ''
    };
    const { data, error } = await supabase.from('startups').insert(dbStartup).select().single();
    if (error) throw error;
    return toStartupObj(data);
  },
  async update(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
    if (updates.industryLabel !== undefined) dbUpdates.industry_label = updates.industryLabel;
    if (updates.foundedDate !== undefined) dbUpdates.founded_date = updates.foundedDate;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.employees !== undefined) dbUpdates.employees = updates.employees;
    if (updates.fundingStage !== undefined) dbUpdates.funding_stage = updates.fundingStage;
    if (updates.fundingAmount !== undefined) dbUpdates.funding_amount = updates.fundingAmount;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.ceo !== undefined) dbUpdates.ceo = updates.ceo;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    const { data, error } = await supabase.from('startups').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return toStartupObj(data);
  },
  async delete(id) {
    const { error } = await supabase.from('startups').delete().eq('id', id);
    if (error) throw error;
  },
  async count() {
    const { count, error } = await supabase.from('startups').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  },
  async bulkCreate(items) {
    const dbItems = items.map(s => ({
      name: s.name,
      industry: s.industry || 'other',
      industry_label: s.industryLabel || s.industry || '기타',
      founded_date: s.foundedDate || null,
      location: s.location || '',
      employees: parseInt(s.employees) || 0,
      funding_stage: s.fundingStage || '',
      funding_amount: parseInt(s.fundingAmount) || 0,
      description: s.description || '',
      ceo: s.ceo || '',
      website: s.website || ''
    }));
    const { data, error } = await supabase.from('startups').insert(dbItems).select();
    if (error) throw error;
    return (data || []).map(toStartupObj);
  }
};

function toStartupObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    industryLabel: row.industry_label,
    foundedDate: row.founded_date,
    location: row.location,
    employees: row.employees,
    fundingStage: row.funding_stage,
    fundingAmount: row.funding_amount,
    description: row.description,
    ceo: row.ceo,
    website: row.website
  };
}

// --- Funds ---
const funds = {
  async findAll(filters = {}) {
    let query = supabase.from('funds').select('*');
    if (filters.search) {
      query = query.or(`fund_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
    }
    if (filters.fundType && filters.fundType !== 'all') {
      query = query.eq('fund_type', filters.fundType);
    }
    if (filters.sort) {
      switch (filters.sort) {
        case 'name': query = query.order('fund_name', { ascending: true }); break;
        case 'regDate': query = query.order('registered_at', { ascending: false }); break;
        case 'amount': query = query.order('total_amount', { ascending: false }); break;
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toFundObj);
  },
  async findById(id) {
    const { data, error } = await supabase.from('funds').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toFundObj(data) : null;
  },
  async create(fund) {
    const dbFund = {
      fund_type: fund.fundType || '투자조합',
      company_name: fund.companyName,
      fund_name: fund.fundName,
      registered_at: fund.registeredAt || null,
      expired_at: fund.expiredAt || null,
      settlement_month: fund.settlementMonth || 12,
      manager: fund.manager || '',
      support: fund.support || '',
      purpose: fund.purpose || '',
      industry: fund.industry || '',
      base_rate: fund.baseRate || 0,
      total_amount: fund.totalAmount || 0
    };
    const { data, error } = await supabase.from('funds').insert(dbFund).select().single();
    if (error) throw error;
    return toFundObj(data);
  },
  async update(id, updates) {
    const dbUpdates = {};
    if (updates.fundType !== undefined) dbUpdates.fund_type = updates.fundType;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.fundName !== undefined) dbUpdates.fund_name = updates.fundName;
    if (updates.registeredAt !== undefined) dbUpdates.registered_at = updates.registeredAt;
    if (updates.expiredAt !== undefined) dbUpdates.expired_at = updates.expiredAt;
    if (updates.settlementMonth !== undefined) dbUpdates.settlement_month = updates.settlementMonth;
    if (updates.manager !== undefined) dbUpdates.manager = updates.manager;
    if (updates.support !== undefined) dbUpdates.support = updates.support;
    if (updates.purpose !== undefined) dbUpdates.purpose = updates.purpose;
    if (updates.industry !== undefined) dbUpdates.industry = updates.industry;
    if (updates.baseRate !== undefined) dbUpdates.base_rate = updates.baseRate;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    const { data, error } = await supabase.from('funds').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return toFundObj(data);
  },
  async delete(id) {
    const { error } = await supabase.from('funds').delete().eq('id', id);
    if (error) throw error;
  },
  async count() {
    const { count, error } = await supabase.from('funds').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  },
  async bulkCreate(items) {
    const dbItems = items.map(f => ({
      fund_type: f.fundType || '투자조합',
      company_name: f.companyName,
      fund_name: f.fundName,
      registered_at: f.registeredAt || null,
      expired_at: f.expiredAt || null,
      settlement_month: parseInt(f.settlementMonth) || 12,
      manager: f.manager || '',
      support: f.support || '',
      purpose: f.purpose || '',
      industry: f.industry || '',
      base_rate: parseFloat(f.baseRate) || 0,
      total_amount: parseInt(f.totalAmount) || 0
    }));
    const { data, error } = await supabase.from('funds').insert(dbItems).select();
    if (error) throw error;
    return (data || []).map(toFundObj);
  }
};

function toFundObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    fundType: row.fund_type,
    companyName: row.company_name,
    fundName: row.fund_name,
    registeredAt: row.registered_at,
    expiredAt: row.expired_at,
    settlementMonth: row.settlement_month,
    manager: row.manager,
    support: row.support,
    purpose: row.purpose,
    industry: row.industry,
    baseRate: row.base_rate,
    totalAmount: row.total_amount
  };
}

// --- Bookmarks ---
const bookmarks = {
  async getByUserId(userId) {
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
    if (error) throw error;
    const result = { investors: [], startups: [], funds: [] };
    (data || []).forEach(b => {
      if (result[b.target_type]) {
        result[b.target_type].push(b.target_id);
      }
    });
    return result;
  },
  async add(userId, targetType, targetId) {
    const { error } = await supabase.from('bookmarks').insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId
    });
    if (error) throw error;
  },
  async remove(userId, targetType, targetId) {
    const { error } = await supabase.from('bookmarks').delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    if (error) throw error;
  },
  async exists(userId, targetType, targetId) {
    const { data, error } = await supabase.from('bookmarks').select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    if (error) throw error;
    return data && data.length > 0;
  },
  async deleteByUserId(userId) {
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId);
    if (error) throw error;
  }
};

// --- Notices ---
const notices = {
  async findAll(filters = {}) {
    let query = supabase.from('notices').select('*');
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toNoticeObj);
  },
  async findById(id) {
    const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toNoticeObj(data) : null;
  },
  async create(notice) {
    const dbNotice = {
      category: notice.category || 'notice',
      tag: notice.tag || '# 공지',
      title: notice.title,
      summary: notice.summary || notice.title,
      author: notice.author || '',
      author_role: notice.authorRole || 'Admin',
      date: notice.date || new Date().toISOString().split('T')[0],
      content: notice.content || ''
    };
    const { data, error } = await supabase.from('notices').insert(dbNotice).select().single();
    if (error) throw error;
    return toNoticeObj(data);
  },
  async update(id, updates) {
    const dbUpdates = {};
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
    if (updates.author !== undefined) dbUpdates.author = updates.author;
    if (updates.authorRole !== undefined) dbUpdates.author_role = updates.authorRole;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    const { data, error } = await supabase.from('notices').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return toNoticeObj(data);
  },
  async delete(id) {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) throw error;
  },
  async count() {
    const { count, error } = await supabase.from('notices').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count;
  },
  async bulkCreate(items) {
    const dbItems = items.map(n => ({
      category: n.category || 'notice',
      tag: n.tag || '# 공지',
      title: n.title,
      summary: n.summary || n.title,
      author: n.author || '',
      author_role: n.authorRole || 'Admin',
      date: n.date || new Date().toISOString().split('T')[0],
      content: n.content || ''
    }));
    const { data, error } = await supabase.from('notices').insert(dbItems).select();
    if (error) throw error;
    return (data || []).map(toNoticeObj);
  }
};

function toNoticeObj(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    tag: row.tag,
    title: row.title,
    summary: row.summary,
    author: row.author,
    authorRole: row.author_role,
    date: row.date,
    content: row.content
  };
}

// --- Verification Codes ---
const verificationCodes = {
  async set(type, target, code, expiresAt) {
    await supabase.from('verification_codes').delete().eq('type', type).eq('target', target);
    const { error } = await supabase.from('verification_codes').insert({
      type, target, code, expires_at: new Date(expiresAt).toISOString()
    });
    if (error) throw error;
  },
  async get(type, target) {
    const { data, error } = await supabase.from('verification_codes').select('*')
      .eq('type', type).eq('target', target).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return { code: data.code, expiresAt: new Date(data.expires_at).getTime() };
  },
  async delete(type, target) {
    const { error } = await supabase.from('verification_codes').delete().eq('type', type).eq('target', target);
    if (error) throw error;
  }
};

module.exports = {
  users,
  investors,
  startups,
  funds,
  bookmarks,
  notices,
  verificationCodes,
  toUserObj
};
