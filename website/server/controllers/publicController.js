const Recap = require('../models/Recap');
const Album = require('../models/Album');

exports.getHomepage = async (req, res) => {
  try {
    const latestRecaps = await Recap.find().sort({ createdAt: -1 }).limit(6);
    const featuredRecaps = await Recap.find({ isFeatured: true }).limit(3);
    const galleryPreview = await Album.find().sort({ createdAt: -1 }).limit(4);

    res.render('homepage/index', {
      title: 'Class Recap - Trang Chủ',
      path: '/',
      latestRecaps: latestRecaps || [],
      featuredRecaps: featuredRecaps || [],
      galleryPreview: galleryPreview || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.getAboutPage = (req, res) => {
  res.render('about/index', { title: 'Giới Thiệu Lớp', path: '/about' });
};
