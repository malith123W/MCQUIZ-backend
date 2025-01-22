const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const router = require('./router'); // Existing routes
require('dotenv').config();

const app = express();
const port = 3001;
const host = 'localhost';

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: 'mcquiz-secret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
const uri =
  'mongodb+srv://mcquizproject:MCQUIZ1234@cluster0.mwf2w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connect = async () => {
  try {
    await mongoose.connect(uri); // Deprecated options removed
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};
connect();

// Google OAuth Configuration
const CLIENT_ID = process.env.CLIENT_ID || '160612889115-rlor38j7ah38u2rm1dn6g4em2uercgvf.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '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';
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = `http://localhost:3001`;

passport.use(
  new GoogleStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: 'http://localhost:3001/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Add logic to save or update the user in the database
        console.log('User authenticated:', profile);
        done(null, profile);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Routes
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful login
    res.redirect(FRONTEND_URL); // Redirect to frontend after successful login
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to log out.' });
    }
    res.redirect(FRONTEND_URL);
  });
});

app.get('/auth/user', (req, res) => {
  res.json(req.user || null);
});

// Custom Router
app.use('/api', router);

// Start the server
const server = app.listen(port, host, () => {
  console.log(`Node server is listening on http://${host}:${server.address().port}`);
});
