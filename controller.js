const User = require("./model"); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');




const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists!' });
      }
  
  
      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password,
      });
      // Save the user to the database
      const savedUser = await newUser.save();

      // Generate JWT token
      const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email }, // Use savedUser here
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  
      res.status(201).json({
        message: 'Account created successfully!',
        token,
        user: { id: newUser._id, firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
};





exports.registerUser = registerUser;
