const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const User = require('./models/model');
const router = require('./routes/router');
const adminRouter = require('./routes/adminRouter');
const paymentRouter = require('./routes/paymentRouter');
const subjectRouter = require('./routes/subjectRoutes');
const userSubjectRouter = require('./routes/userSubjectRoutes');
const userQuizRouter = require('./routes/userQuizRoutes');
const userAttemptRouter = require('./routes/userAttemptRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;
const host = process.env.HOST || 'localhost';

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: process.env.JWT_SECRET || 'mcquiz-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

const uri = process.env.MONGODB_URI;
const connect = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
connect();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

passport.use(
  new GoogleStrategy(
    {
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      callbackURL: `http://${host}:${port}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            user.firstName = profile.name.givenName;
            user.lastName = profile.name.familyName;
            await user.save();
          }
        } else {
          user = new User({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            role: 'user'
          });
          await user.save();
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(FRONTEND_URL);
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

// Routes
app.use('/api', router);
app.use('/api/admin', adminRouter);
app.use('/api/admin/subjects', subjectRouter);
app.use('/api/subjects', userSubjectRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/user-quizzes', userQuizRouter);
app.use('/api/user-attempts', userAttemptRouter);

// Test endpoint to check database
app.get('/api/test/database', async (req, res) => {
  try {
    const Subject = require('./models/subjectModel');
    const Quiz = require('./models/quizModel');
    
    const subjects = await Subject.find({ isActive: true });
    const quizzes = await Quiz.find({ isActive: true });
    
    res.json({
      message: 'Database test successful',
      subjects: {
        count: subjects.length,
        data: subjects.map(s => ({ id: s._id, name: s.name, level: s.level }))
      },
      quizzes: {
        count: quizzes.length,
        data: quizzes.map(q => ({ id: q._id, title: q.title, subject: q.subject }))
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database test failed', error: error.message });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

const server = app.listen(port, host, () => {
  console.log(`Node server is listening on http://${host}:${server.address().port}`);
});

module.exports = app;