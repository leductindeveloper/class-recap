const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Homepage
router.get('/', publicController.getHomepage);

// About
router.get('/about', publicController.getAboutPage);

// Placeholder cho Recap và Gallery router. Đưa vào chung cho dễ quản lý
const Recap = require('../models/Recap');
const Comment = require('../models/Comment');
const Album = require('../models/Album');

// Route Recap with optional search/filter
router.get('/recap', async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    if (category && category !== 'Tất cả') {
      // assume categories correspond to tags
      filter.tags = category;
    }
    const recaps = await Recap.find(filter).sort({ createdAt: -1 });
    res.render('recap/index', { title: 'Tất Cả Bài Viết', path: '/recap', recaps, q, category });
  } catch (error) {
    res.status(500).send('Error');
  }
});

router.get('/recap/:slug', async (req, res) => {
  try {
    const recap = await Recap.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true });
    if (!recap) return res.status(404).render('404');
    
    const comments = await Comment.find({ recapId: recap._id, isApproved: true }).sort({ createdAt: -1 });
    const related = await Recap.find({ _id: { $ne: recap._id } }).sort({ createdAt: -1 }).limit(3);

    res.render('recap/single', { title: recap.title, path: '/recap', recap, comments, related });
  } catch (error) {
    res.status(500).send('Error');
  }
});

// Route comment
router.post('/recap/:id/comment', async (req, res) => {
  try {
    const { author, content } = req.body;
    await Comment.create({ recapId: req.params.id, author, content });
    res.redirect('back');
  } catch (error) {
    res.status(500).send('Error');
  }
});

// Like a recap (simple counter)
router.post('/recap/:id/like', async (req, res) => {
  try {
    await Recap.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Route gallery with optional category filter
router.get('/gallery', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'Tất cả') {
      filter.category = category;
    }
    const albums = await Album.find(filter).sort({ createdAt: -1 });
    res.render('gallery/index', { title: 'Thư Viện Ảnh', path: '/gallery', albums, category });
  } catch (error) {
    res.status(500).send('Error');
  }
});

module.exports = router;
