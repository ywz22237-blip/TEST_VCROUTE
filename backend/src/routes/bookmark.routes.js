const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { authenticate } = require('../middlewares/auth');

// All bookmark routes require authentication
router.use(authenticate);

router.get('/', bookmarkController.getMyBookmarks);
router.get('/details', bookmarkController.getBookmarksWithDetails);
router.post('/', bookmarkController.addBookmark);
router.post('/toggle', bookmarkController.toggleBookmark);
router.delete('/', bookmarkController.removeBookmark);

module.exports = router;
