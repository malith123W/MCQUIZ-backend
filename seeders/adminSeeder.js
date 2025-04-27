const mongoose = require('mongoose');
const Admin = require('../models/adminModel');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://mcquizproject:MCQUIZ1234@cluster0.mwf2w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const createAdmin = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('Admin already exists. No need to create a new one.');
      mongoose.disconnect();
      return;
    }
    
    const admin = new Admin({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    
    await admin.save();
    console.log('Admin created successfully!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
  }
};

createAdmin();