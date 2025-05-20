const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
      googleId: { type: String, unique: true, sparse: true }, // For Google users
      firstName: { type: String, required: false }, // Required only for manual sign-up
      lastName: { type: String, required: false }, // Required only for manual sign-up
      email: { type: String, required: true, unique: true }, // Shared for both user types
      password: { type: String, required: false }, // Optional for Google users
    },
    { timestamps: true }
  );
  
  // Hash the password before saving (only for manual sign-up users)
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  const User = mongoose.model('User', userSchema);
  
  module.exports = User;
