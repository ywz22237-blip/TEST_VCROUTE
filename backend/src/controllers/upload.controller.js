const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { investors, startups, funds, notices } = require('../models/data');
const { createError } = require('../utils/helpers');

// CSV 파일 파싱
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        fs.unlinkSync(filePath);
        resolve(results);
      })
      .on('error', (error) => reject(error));
  });
};

// 엑셀 파일 파싱
const parseExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  fs.unlinkSync(filePath);
  return data;
};

// 파일 확장자에 따라 파싱
const parseFile = async (filePath, mimetype) => {
  if (mimetype === 'text/csv' || filePath.endsWith('.csv')) {
    return await parseCSV(filePath);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel' ||
    filePath.endsWith('.xlsx') ||
    filePath.endsWith('.xls')
  ) {
    return parseExcel(filePath);
  }
  throw createError('지원하지 않는 파일 형식입니다. CSV 또는 엑셀 파일을 업로드해주세요.', 400);
};

// 투자자 일괄 업로드
const uploadInvestors = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('파일을 업로드해주세요.', 400);
    }

    const data = await parseFile(req.file.path, req.file.mimetype);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        if (!row.name || !row.company) {
          errors.push(`행 ${successCount + errorCount + 1}: 이름과 회사는 필수입니다.`);
          errorCount++;
          continue;
        }

        await investors.create({
          name: row.name,
          company: row.company,
          position: row.position || '',
          investments: parseInt(row.investments) || 0,
          successRate: parseFloat(row.successRate) || 0,
          portfolio: row.portfolio ? row.portfolio.split(',').map(s => s.trim()) : [],
          focusArea: row.focusArea ? row.focusArea.split(',').map(s => s.trim()) : [],
          minInvestment: parseInt(row.minInvestment) || 0,
          maxInvestment: parseInt(row.maxInvestment) || 0,
          stage: row.stage ? row.stage.split(',').map(s => s.trim()) : [],
          bio: row.bio || '',
          contact: row.contact || ''
        });
        successCount++;
      } catch (err) {
        errors.push(`행 ${successCount + errorCount + 1}: ${err.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `투자자 업로드 완료: ${successCount}건 성공, ${errorCount}건 실패`,
      data: { successCount, errorCount, errors: errors.slice(0, 10) }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// 스타트업 일괄 업로드
const uploadStartups = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('파일을 업로드해주세요.', 400);
    }

    const data = await parseFile(req.file.path, req.file.mimetype);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        if (!row.name) {
          errors.push(`행 ${successCount + errorCount + 1}: 회사명은 필수입니다.`);
          errorCount++;
          continue;
        }

        await startups.create({
          name: row.name,
          industry: row.industry || 'other',
          industryLabel: row.industryLabel || row.industry || '기타',
          foundedDate: row.foundedDate || '',
          location: row.location || '',
          employees: parseInt(row.employees) || 0,
          fundingStage: row.fundingStage || '',
          fundingAmount: parseInt(row.fundingAmount) || 0,
          description: row.description || '',
          ceo: row.ceo || '',
          website: row.website || ''
        });
        successCount++;
      } catch (err) {
        errors.push(`행 ${successCount + errorCount + 1}: ${err.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `스타트업 업로드 완료: ${successCount}건 성공, ${errorCount}건 실패`,
      data: { successCount, errorCount, errors: errors.slice(0, 10) }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// 펀드 일괄 업로드
const uploadFunds = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('파일을 업로드해주세요.', 400);
    }

    const data = await parseFile(req.file.path, req.file.mimetype);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        if (!row.fundName || !row.companyName) {
          errors.push(`행 ${successCount + errorCount + 1}: 펀드명과 운용사는 필수입니다.`);
          errorCount++;
          continue;
        }

        await funds.create({
          fundType: row.fundType || '투자조합',
          companyName: row.companyName,
          fundName: row.fundName,
          registeredAt: row.registeredAt || '',
          expiredAt: row.expiredAt || '',
          settlementMonth: parseInt(row.settlementMonth) || 12,
          manager: row.manager || '',
          support: row.support || '',
          purpose: row.purpose || '',
          industry: row.industry || '',
          baseRate: parseFloat(row.baseRate) || 0,
          totalAmount: parseInt(row.totalAmount) || 0
        });
        successCount++;
      } catch (err) {
        errors.push(`행 ${successCount + errorCount + 1}: ${err.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `펀드 업로드 완료: ${successCount}건 성공, ${errorCount}건 실패`,
      data: { successCount, errorCount, errors: errors.slice(0, 10) }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// 공지사항 일괄 업로드
const uploadNotices = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError('파일을 업로드해주세요.', 400);
    }

    const data = await parseFile(req.file.path, req.file.mimetype);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        if (!row.title) {
          errors.push(`행 ${successCount + errorCount + 1}: 제목은 필수입니다.`);
          errorCount++;
          continue;
        }

        await notices.create({
          category: row.category || 'notice',
          tag: row.tag || '# 공지',
          title: row.title,
          summary: row.summary || row.title,
          author: row.author || req.user.name,
          authorRole: row.authorRole || 'Admin',
          date: row.date || new Date().toISOString().split('T')[0],
          content: row.content || ''
        });
        successCount++;
      } catch (err) {
        errors.push(`행 ${successCount + errorCount + 1}: ${err.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `공지사항 업로드 완료: ${successCount}건 성공, ${errorCount}건 실패`,
      data: { successCount, errorCount, errors: errors.slice(0, 10) }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// 데이터 내보내기
const exportData = async (req, res, next) => {
  try {
    const { type } = req.params;

    let data;
    switch (type) {
      case 'investors': data = await investors.findAll(); break;
      case 'startups': data = await startups.findAll(); break;
      case 'funds': data = await funds.findAll(); break;
      case 'notices': data = await notices.findAll(); break;
      default:
        return res.status(400).json({ success: false, message: '잘못된 데이터 유형입니다.' });
    }

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadInvestors,
  uploadStartups,
  uploadFunds,
  uploadNotices,
  exportData
};
