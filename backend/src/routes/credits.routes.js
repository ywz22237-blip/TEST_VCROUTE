const express = require('express');
const router = express.Router();
const { getCredits } = require('../controllers/credits.controller');

router.get('/', getCredits);

module.exports = router;
