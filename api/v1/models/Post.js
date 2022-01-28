const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'No author provided for post. Please try again!'],
    },
    likes: Number,
    imageUrl: { fileId: String, publicUrl: String },
    text: String,
    comments: {
      type: [mongoose.Schema.ObjectId],
      ref: 'comment',
    },
    userTags: {
      type: [mongoose.Schema.ObjectId],
      ref: 'user',
    },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('post', PostSchema);
