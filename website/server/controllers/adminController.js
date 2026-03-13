const Recap = require('../models/Recap');
const Comment = require('../models/Comment');
const Album = require('../models/Album');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// ================= LOGIN =================

exports.getLogin = (req, res) => {

  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }

  res.render('admin/login', {
    layout: false,
    error: null
  });

};

exports.postLogin = (req, res) => {

  const username = (req.body.username || '').trim();
  const password = (req.body.password || '').trim();

  const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPass = (process.env.ADMIN_PASSWORD || 'admin').trim();

  if (username === adminUser && password === adminPass) {

    req.session.isAdmin = true;

    return res.redirect('/admin');

  }

  res.render('admin/login', {
    layout: false,
    error: 'Sai tài khoản hoặc mật khẩu'
  });

};

exports.logout = (req, res) => {

  req.session.destroy(() => {
    res.redirect('/admin/login');
  });

};


// ================= DASHBOARD =================

exports.getDashboard = async (req, res) => {

  try {

    const recapCount = await Recap.countDocuments();
    const commentCount = await Comment.countDocuments();
    const albumCount = await Album.countDocuments();

    const totalViewsObj = await Recap.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const totalViews = totalViewsObj.length ? totalViewsObj[0].totalViews : 0;

    res.render('admin/dashboard', {
      path: '/admin',
      recapCount,
      commentCount,
      albumCount,
      totalViews
    });

  } catch (err) {

    console.log(err);
    res.redirect('/admin');

  }

};


// ================= SLUG =================

function slugify(text) {

  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

}


// ================= RECAP =================

exports.getRecaps = async (req, res) => {

  const recaps = await Recap.find().sort({ createdAt: -1 });

  res.render('admin/recaps/index', {
    path: '/admin/recaps',
    recaps
  });

};

exports.getCreateRecap = (req, res) => {

  res.render('admin/recaps/create', {
    path: '/admin/recaps',
    recap: null
  });

};

exports.postCreateRecap = async (req, res) => {

  try {

    const { title, author, content, tags } = req.body;

    let coverImage = 'https://images.unsplash.com/photo-1523580494112-071dcb85144d?w=800&q=80';

    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "class-recap"
      });

      coverImage = result.secure_url;

    }

    const slug = slugify(title) + '-' + Date.now();

    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];

    await Recap.create({
      title,
      slug,
      author,
      content,
      coverImage,
      tags: tagsArray
    });

    res.redirect('/admin/recaps');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/recaps');

  }

};


exports.getEditRecap = async (req, res) => {

  const recap = await Recap.findById(req.params.id);

  if (!recap) {
    return res.redirect('/admin/recaps');
  }

  res.render('admin/recaps/create', {
    path: '/admin/recaps',
    recap
  });

};

exports.postEditRecap = async (req, res) => {

  try {

    const { title, author, content, tags } = req.body;

    const recap = await Recap.findById(req.params.id);

    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];

    const updateObj = {
      title,
      author,
      content,
      tags: tagsArray
    };

    if (req.file) {

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "class-recap"
      });

      updateObj.coverImage = result.secure_url;

    }

    await Recap.findByIdAndUpdate(req.params.id, updateObj);

    res.redirect('/admin/recaps');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/recaps');

  }

};

exports.deleteRecap = async (req, res) => {

  try {

    await Recap.findByIdAndDelete(req.params.id);

    res.redirect('/admin/recaps');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/recaps');

  }

};

exports.toggleFeatured = async (req, res) => {

  const recap = await Recap.findById(req.params.id);

  recap.isFeatured = !recap.isFeatured;

  await recap.save();

  res.redirect('/admin/recaps');

};


// ================= GALLERY =================

exports.getGallery = async (req, res) => {

  const albums = await Album.find().sort({ createdAt: -1 });

  res.render('admin/gallery/index', {
    path: '/admin/gallery',
    albums
  });

};

exports.createAlbum = async (req, res) => {

  const { name, description, category } = req.body;

  await Album.create({
    name,
    description,
    category,
    images: []
  });

  res.redirect('/admin/gallery');

};

exports.postUploadImages = async (req, res) => {

  try {

    const { albumId } = req.params;

    const album = await Album.findById(albumId);

    if (!album) {
      return res.redirect('/admin/gallery');
    }

    const images = [];

    for (const file of req.files) {

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "class-recap"
      });

      images.push({
        url: result.secure_url
      });

    }

    album.images.push(...images);

    await album.save();

    res.redirect('/admin/gallery');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/gallery');

  }

};

exports.deleteAlbum = async (req, res) => {

  try {

    await Album.findByIdAndDelete(req.params.id);

    res.redirect('/admin/gallery');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/gallery');

  }

};

exports.deleteImage = async (req, res) => {

  try {

    const { albumId, imageId } = req.params;

    const album = await Album.findById(albumId);

    if (!album) {
      return res.redirect('/admin/gallery');
    }

    album.images = album.images.filter(
      img => img._id.toString() !== imageId
    );

    await album.save();

    res.redirect('/admin/gallery');

  } catch (err) {

    console.log(err);
    res.redirect('/admin/gallery');

  }

};


// ================= COMMENTS =================

exports.getComments = async (req, res) => {

  const comments = await Comment.find({ isApproved: false })
    .populate('recapId', 'title')
    .sort({ createdAt: -1 });

  res.render('admin/comments/index', {
    path: '/admin/comments',
    comments
  });

};

exports.approveComment = async (req, res) => {

  await Comment.findByIdAndUpdate(req.params.id, {
    isApproved: true
  });

  res.redirect('/admin/comments');

};

exports.deleteComment = async (req, res) => {

  await Comment.findByIdAndDelete(req.params.id);

  res.redirect('/admin/comments');

};
