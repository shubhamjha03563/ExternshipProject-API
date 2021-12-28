const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: [
      true,
      'The provided username is not available. Please choose another name.',
    ],
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
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

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
UserSchema.methods.getJwtToken = async function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// indexes
UserSchema.index({
  username: 'text',
});

module.exports = mongoose.model('user', UserSchema);
