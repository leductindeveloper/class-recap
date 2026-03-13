const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

function isAdmin(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  next();
}

// LOGIN
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// DASHBOARD
router.get('/', isAdmin, adminController.getDashboard);

// RECAPS
router.get('/recaps', isAdmin, adminController.getRecaps);
router.get('/recaps/create', isAdmin, adminController.getCreateRecap);
router.post('/recaps/create', isAdmin, upload.single('coverImage'), adminController.postCreateRecap);

router.get('/recaps/edit/:id', isAdmin, adminController.getEditRecap);
router.post('/recaps/edit/:id', isAdmin, upload.single('coverImage'), adminController.postEditRecap);

router.post('/recaps/delete/:id', isAdmin, adminController.deleteRecap);
router.post('/recaps/featured/:id', isAdmin, adminController.toggleFeatured);

// GALLERY
router.post('/gallery/upload/:albumId', isAdmin, upload.array('images', 10), adminController.postUploadImages);

router.post('/gallery/delete-album/:id', isAdmin, adminController.deleteAlbum);
router.post('/gallery/delete-image/:albumId/:imageId', isAdmin, adminController.deleteImage);

// COMMENTS
router.get('/comments', isAdmin, adminController.getComments);
router.post('/comments/approve/:id', isAdmin, adminController.approveComment);
router.post('/comments/delete/:id', isAdmin, adminController.deleteComment);

module.exports = router;
