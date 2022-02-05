const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, 'Please provide a username.'],
    },
    email: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Invalid email provided! Please enter a valid email.',
      },
      required: [true, 'Please provide an email.'],
    },

    // password
    hash: {
      type: String,
      select: false,
      trim: true,
      required: [true, 'Please provide a password.'],
    },
    emailVerified: false,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailToken: String,
    city: String,
    friends: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    friendRequests: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    friendRequestsSent: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    friendSuggestions: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    followers: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    following: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    blocked: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    blockedBy: [{ type: mongoose.Schema.ObjectId, ref: 'user' }],
    profilePic: { fileId: String, publicUrl: String },
    lastLoggedIn: Date,
    likedTags: [String],
    usersTagged: {
      type: [mongoose.Schema.ObjectId],
      ref: 'user',
    },
    postTags: [String],
    savedPosts: [{ type: mongoose.Schema.ObjectId, ref: 'post' }],
    likedPosts: [{ type: mongoose.Schema.ObjectId, ref: 'post' }],
    emailNotifications: { type: Boolean, default: true },
    appNotification: { type: Boolean, default: true },
    friendsVisibility: { type: Boolean, default: true },
    privateProfile: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// hash password before saving
UserSchema.pre('save', async function (next) {
  this.runValidators = true;

  if (this.isModified('hash')) {
    this.hash = await bcrypt.hash(this.hash, await bcrypt.genSalt(10));
  }
  next();
});

// run validators before update
UserSchema.pre('findOneAndUpdate', async function (next) {
  this.options.runValidators = true;
  next();
});

// match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.hash);
};

// ger jsonwebtoken for a user
UserSchema.methods.getJwtToken = function (expire) {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: expire,
  });
};

UserSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and save it in db
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

  return resetToken;
};

// indexes
UserSchema.index({
  username: 'text',
  email: 'text',
});

module.exports = mongoose.model('user', UserSchema);
