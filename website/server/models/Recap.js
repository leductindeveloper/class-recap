const mongoose = require('mongoose');

const recapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: 'https://images.unsplash.com/photo-1523580494112-071dcb85144d?w=800&q=80' },
  tags: [String],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Recap', recapSchema);
