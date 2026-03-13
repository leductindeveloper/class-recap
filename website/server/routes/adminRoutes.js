const upload = require("../middleware/upload")
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const upload = require('../middleware/upload');

// Admin Auth
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Admin Dashboard Area (Protected) - use admin layout
router.use(ensureAuthenticated, (req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});

router.get('/', adminController.getDashboard);

// Recap Management
router.get('/recaps', adminController.getRecaps);
router.get('/recaps/create', adminController.getCreateRecap);
router.post('/recaps/create', upload.single('coverImage'), adminController.postCreateRecap);
router.get('/recaps/edit/:id', adminController.getEditRecap);
router.post('/recaps/edit/:id', upload.single('coverImage'), adminController.postEditRecap);
router.post('/recaps/delete/:id', adminController.deleteRecap);
router.post('/recaps/toggle-featured/:id', adminController.toggleFeatured);

// Gallery Management
router.get('/gallery', adminController.getGallery);
router.post('/gallery/create-album', adminController.postCreateAlbum);
router.post('/gallery/upload/:albumId', upload.array('images', 10), adminController.postUploadImages);
router.post('/gallery/delete-album/:id', adminController.deleteAlbum);
router.post('/gallery/:albumId/image/delete/:imageId', adminController.deleteImage);

// Comment Management
router.get('/comments', adminController.getComments);
router.post('/comments/approve/:id', adminController.approveComment);
router.post('/comments/delete/:id', adminController.deleteComment);

module.exports = router;
