module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'vc-route-default-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@vcroute.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123!@#'
};
