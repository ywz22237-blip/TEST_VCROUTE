const express = require('express');
const router = express.Router();
const { getCredits, useCredit } = require('../controllers/credits.controller');

router.get('/', getCredits);
router.post('/use', useCredit);

module.exports = router;
