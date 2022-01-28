const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'user',
      required: [true, 'No author provided for comment. Please try again!'],
    },
    postId: {
      type: mongoose.Schema.ObjectId,
      ref: 'post',
      required: [true, 'Please provide the postId'],
    },
    commentType: {
      type: String,
      enum: ['new', 'reply'],
      required: [true, 'Please provide the comment type (new/ reply).'],
    },
    text: {
      type: String,
      required: [true, 'Please provide some text for the comment.'],
    },
    replies: {
      type: [mongoose.Schema.ObjectId],
      ref: 'comment',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('comment', CommentSchema);
