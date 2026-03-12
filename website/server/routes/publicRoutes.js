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

// Route Recap with optional search/filter + pagination
const RECAPS_PER_PAGE = 9;
router.get('/recap', async (req, res) => {
  try {
    const { q, category, page = 1 } = req.query;
    const filter = {};
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    if (category && category !== 'Tất cả') {
      filter.tags = category;
    }
    const currentPage = Math.max(1, parseInt(page, 10));
    const totalRecaps = await Recap.countDocuments(filter);
    const totalPages = Math.ceil(totalRecaps / RECAPS_PER_PAGE) || 1;
    const recaps = await Recap.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * RECAPS_PER_PAGE)
      .limit(RECAPS_PER_PAGE);
    res.render('recap/index', {
      title: 'Tất Cả Bài Viết',
      path: '/recap',
      recaps,
      q,
      category,
      currentPage,
      totalPages,
      totalRecaps
    });
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
    res.redirect(req.get('referer') || '/recap/' + req.params.id);
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
