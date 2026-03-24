let app;
try {
  app = require('../backend/src/app');
} catch (e) {
  app = (req, res) => {
    res.status(500).json({ error: e.message, stack: e.stack });
  };
}

module.exports = app;
