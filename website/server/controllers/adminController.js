
const Recap = require('../models/Recap');
const Album = require('../models/Album');
const Comment = require('../models/Comment');
const path = require('path');
const fs = require('fs');

exports.getLogin = (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { layout: false, error: null });
};

exports.postLogin = (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', { layout: false, error: 'Sai tài khoản hoặc mật khẩu' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

exports.getDashboard = async (req, res) => {
  const recapCount = await Recap.countDocuments();
  const commentCount = await Comment.countDocuments();
  const albumCount = await Album.countDocuments();
  const totalViewsObj = await Recap.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]);
  const totalViews = totalViewsObj.length > 0 ? totalViewsObj[0].totalViews : 0;
  
  res.render('admin/dashboard', { path: '/admin', recapCount, commentCount, albumCount, totalViews });
};

// Recap Control
exports.getRecaps = async (req, res) => {
  const recaps = await Recap.find().sort({ createdAt: -1 });
  res.render('admin/recaps/index', { path: '/admin/recaps', recaps });
};

exports.getCreateRecap = (req, res) => {
  res.render('admin/recaps/create', { path: '/admin/recaps', recap: null });
};

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

exports.postCreateRecap = async (req, res) => {
  try {
    const { title, author, content, tags } = req.body;
    let coverImage = '/images/default-cover.jpg';
    if (req.file) {
      coverImage = '/uploads/' + req.file.filename;
    }
    const slug = slugify(title) + '-' + Date.now();
    
    await Recap.create({ title, slug, author, content, coverImage, tags: tags.split(',').map(t => t.trim()) });
    res.redirect('/admin/recaps');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};

// Edit a recap
exports.getEditRecap = async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id);
    if (!recap) return res.redirect('/admin/recaps');
    res.render('admin/recaps/create', { path: '/admin/recaps', recap });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/recaps');
  }
};

exports.postEditRecap = async (req, res) => {
  try {
    const { title, author, content, tags } = req.body;
    const recap = await Recap.findById(req.params.id);
    const updateObj = {
      title,
      author,
      content,
      tags: tags.split(',').map(t => t.trim())
    };
    if (req.file) {
      // remove old cover if custom
      if (recap && recap.coverImage && recap.coverImage !== '/images/default-cover.jpg') {
        const oldPath = path.join(__dirname, '../../public', recap.coverImage);
        fs.unlink(oldPath, () => {});
      }
      updateObj.coverImage = '/uploads/' + req.file.filename;
    }
    // optionally update slug if title changed
    // updateObj.slug = slugify(title) + '-' + Date.now();
    await Recap.findByIdAndUpdate(req.params.id, updateObj);
    res.redirect('/admin/recaps');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};

// Delete recap
exports.deleteRecap = async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id);
    if (recap && recap.coverImage && recap.coverImage !== '/images/default-cover.jpg') {
      const filePath = path.join(__dirname, '../../public', recap.coverImage);
      fs.unlink(filePath, () => {});
    }
    await Recap.findByIdAndDelete(req.params.id);
    res.redirect('/admin/recaps');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

// Toggle featured flag
exports.toggleFeatured = async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id);
    if (recap) {
      recap.isFeatured = !recap.isFeatured;
      await recap.save();
    }
    res.redirect('/admin/recaps');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

// Gallery helpers
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (album) {
      // remove physical files
      album.images.forEach(img => {
        const filePath = path.join(__dirname, '../../public', img.url);
        fs.unlink(filePath, () => {});
      });
      await album.remove();
    }
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { albumId, imageId } = req.params;
    const album = await Album.findById(albumId);
    if (album) {
      const img = album.images.id(imageId);
      if (img) {
        const filePath = path.join(__dirname, '../../public', img.url);
        fs.unlink(filePath, () => {});
        img.remove();
      }
      await album.save();
    }
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

// Gallery Control
exports.getGallery = async (req, res) => {
  const albums = await Album.find().sort({ createdAt: -1 });
  res.render('admin/gallery/index', { path: '/admin/gallery', albums });
};

exports.postCreateAlbum = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    await Album.create({ name, description, category });
    res.redirect('/admin/gallery');
  } catch(error) {
    res.status(500).send('Error');
  }
};

exports.postUploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.redirect('/admin/gallery');
    
    const album = await Album.findById(req.params.albumId);
    if (!album) return res.redirect('/admin/gallery');

    req.files.forEach(file => {
      album.images.push({ url: '/uploads/' + file.filename });
    });
    
    await album.save();
    res.redirect('/admin/gallery');
  } catch(error) {
    res.status(500).send('Error');
  }
};

// Comment Control
exports.getComments = async (req, res) => {
  const comments = await Comment.find({ isApproved: false }).populate('recapId', 'title').sort({ createdAt: -1 });
  res.render('admin/comments/index', { path: '/admin/comments', comments });
};

exports.approveComment = async (req, res) => {
  await Comment.findByIdAndUpdate(req.params.id, { isApproved: true });
  res.redirect('/admin/comments');
};

exports.deleteComment = async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.redirect('/admin/comments');
};
