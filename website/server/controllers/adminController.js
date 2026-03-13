const Recap = require('../models/Recap');
const Album = require('../models/Album');
const Comment = require('../models/Comment');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.getLogin = (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  // Chỉnh layout false vì trang login có CSS và Layout riêng
  res.render('admin/login', { layout: false, error: null });
};

exports.postLogin = (req, res) => {
  const { username, password } = req.body;
  // Xoá khoảng trắng vô tình có trong file .env bằng .trim()
  const adminUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPass = (process.env.ADMIN_PASSWORD || 'admin').trim();
  
  if (username === adminUser && password === adminPass) {
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
  try {
    const recapCount = await Recap.countDocuments();
    const commentCount = await Comment.countDocuments();
    const albumCount = await Album.countDocuments();
    const totalViewsObj = await Recap.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]);
    const totalViews = totalViewsObj.length > 0 ? totalViewsObj[0].totalViews : 0;
    
    res.render('admin/dashboard', { path: '/admin', recapCount, commentCount, albumCount, totalViews });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Có lỗi xảy ra khi tải Dashboard.");
  }
};

// Recap Control
exports.getRecaps = async (req, res) => {
  try {
    const recaps = await Recap.find().sort({ createdAt: -1 });
    res.render('admin/recaps/index', { path: '/admin/recaps', recaps });
  } catch (error) {
    console.error("Get Recaps error:", error);
    res.status(500).send("Có lỗi xảy ra khi lấy danh sách bài viết.");
  }
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
    let coverImage = 'https://images.unsplash.com/photo-1523580494112-071dcb85144d?w=800&q=80';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
coverImage = result.secure_url;
    }
    const slug = slugify(title) + '-' + Date.now();
    
    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];
    await Recap.create({ title, slug, author, content, coverImage, tags: tagsArray });
    res.redirect('/admin/recaps');
  } catch (error) {
    console.error("Create Recap error:", error);
    res.status(500).send('Có lỗi xảy ra khi tạo bài viết: ' + error.message);
  }
};

// Edit a recap
exports.getEditRecap = async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id);
    if (!recap) return res.redirect('/admin/recaps');
    res.render('admin/recaps/create', { path: '/admin/recaps', recap });
  } catch (err) {
    console.error("Get Edit Recap error:", err);
    res.redirect('/admin/recaps');
  }
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
      // remove old cover if custom
      if (recap && recap.coverImage && !recap.coverImage.startsWith('http')) {
        const oldPath = path.join(__dirname, '../../public', recap.coverImage);
        fs.unlink(oldPath, () => {});
      }
      updateObj.coverImage = if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path);
  coverImage = result.secure_url;
};
    }
    await Recap.findByIdAndUpdate(req.params.id, updateObj);
    res.redirect('/admin/recaps');
  } catch (error) {
    console.error("Post Edit Recap error:", error);
    res.status(500).send('Có lỗi xảy ra khi cập nhật: ' + error.message);
  }
};

// Delete recap
exports.deleteRecap = async (req, res) => {
  try {
    const recap = await Recap.findById(req.params.id);
    if (recap && recap.coverImage && !recap.coverImage.startsWith('http')) {
      const filePath = path.join(__dirname, '../../public', recap.coverImage);
      fs.unlink(filePath, () => {});
    }
    await Recap.findByIdAndDelete(req.params.id);
    res.redirect('/admin/recaps');
  } catch (err) {
    console.error("Delete Recap error:", err);
    res.status(500).send('Có lỗi xảy ra khi xoá bài viết: ' + err.message);
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
    console.error("Toggle Featured error:", err);
    res.status(500).send('Có lỗi xảy ra: ' + err.message);
  }
};

// Gallery helpers
exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (album) {
      // Xoá toàn bộ ảnh trong máy chủ
      album.images.forEach(img => {
        if (img.url && !img.url.startsWith('http')) {
          const filePath = path.join(__dirname, '../../public', img.url);
          fs.unlink(filePath, () => {});
        }
      });
      await Album.findByIdAndDelete(req.params.id);
    }
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error("Delete Album error:", err);
    res.status(500).send('Có lỗi xảy ra khi xoá Album: ' + err.message);
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { albumId, imageId } = req.params;
    const album = await Album.findById(albumId);
    if (album) {
      const img = album.images.id(imageId);
      if (img) {
        if (img.url && !img.url.startsWith('http')) {
          const filePath = path.join(__dirname, '../../public', img.url);
          fs.unlink(filePath, () => {}); // Xóa ảnh vật lý khỏi server
        }
        // Xóa bản ghi trong DB an toàn hơn bằng pull() thay vì remove() gây crash ứng dụng.
        album.images.pull({ _id: imageId });
      }
      await album.save();
    }
    res.redirect('/admin/gallery');
  } catch (err) {
    console.error("Delete Image error:", err);
    res.status(500).send('Có lỗi xảy ra khi xoá hình ảnh: ' + err.message);
  }
};

// Gallery Control
exports.getGallery = async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.render('admin/gallery/index', { path: '/admin/gallery', albums });
  } catch (error) {
    console.error("Get Gallery error:", error);
    res.status(500).send("Có lỗi xảy ra khi lấy danh sách Thư viện ảnh.");
  }
};

exports.postCreateAlbum = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    await Album.create({ name, description, category });
    res.redirect('/admin/gallery');
  } catch(error) {
    console.error("Create Album error:", error);
    res.status(500).send('Có lỗi xảy ra khi tạo Album: ' + error.message);
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
    console.error("Upload Images error:", error);
    res.status(500).send('Có lỗi xảy ra khi tải ảnh lên: ' + error.message);
  }
};

// Comment Control
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ isApproved: false }).populate('recapId', 'title').sort({ createdAt: -1 });
    res.render('admin/comments/index', { path: '/admin/comments', comments });
  } catch (error) {
    console.error("Get Comments error:", error);
    res.status(500).send("Có lỗi xảy ra khi lấy danh sách Bình luận.");
  }
};

exports.approveComment = async (req, res) => {
  try {
    await Comment.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.redirect('/admin/comments');
  } catch (error) {
    console.error("Approve Comment error:", error);
    res.status(500).send("Có lỗi xảy ra khi duyệt bình luận.");
  }
};

exports.deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.redirect('/admin/comments');
  } catch (error) {
    console.error("Delete Comment error:", error);
    res.status(500).send("Có lỗi xảy ra khi xoá bình luận.");
  }
};
