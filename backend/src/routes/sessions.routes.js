const express = require('express');
const router = express.Router();
const {
  registerSession,
  getSessions,
  revokeOthers,
  revokeSession,
} = require('../controllers/sessions.controller');

router.post('/register', registerSession);
router.get('/', getSessions);
router.delete('/others', revokeOthers);
router.delete('/:id', revokeSession);

module.exports = router;
