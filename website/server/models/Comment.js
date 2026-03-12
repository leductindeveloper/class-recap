const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  recapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recap', required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  isApproved: { type: Boolean, default: false }, // Cho module duyệt comment của Admin
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
