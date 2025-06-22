const express = require('express');
const userQuizRouter = express.Router();
const userQuizController = require('../controllers/userQuizController');
const { authenticate } = require('../middleware/authMiddleware');

userQuizRouter.get('/', async (req, res) => {
  try {
    const { subject, search, difficulty, sort, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    
    if (subject) {
      query.subject = require('mongoose').Types.ObjectId.isValid(subject) ? subject : null;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const Quiz = require('../models/quizModel');
    const quizzes = await Quiz.find(query)
      .populate('subject', 'name level')
      .select('-questions')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Quiz.countDocuments(query);
    
    const transformedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      timeLimit: quiz.timeLimit,
      difficulty: quiz.difficulty,
      createdAt: quiz.createdAt
    }));
    
    res.status(200).json({
      quizzes: transformedQuizzes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

userQuizRouter.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }
    
    const Subject = require('../models/subjectModel');
    const subject = await Subject.findOne({ _id: subjectId, isActive: true });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found or inactive' });
    }
    
    const Quiz = require('../models/quizModel');
    const quizzes = await Quiz.find({ subject: subjectId, isActive: true })
      .select('title description difficulty timeLimit createdAt')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      subject: {
        _id: subject._id,
        name: subject.name,
        level: subject.level
      },
      quizzes,
      count: quizzes.length
    });
  } catch (error) {
    console.error('Get quizzes by subject error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

userQuizRouter.use(authenticate);

userQuizRouter.get('/:id/attempt', userQuizController.getQuizForAttempt);

userQuizRouter.post('/submit', userQuizController.submitQuizAttempt);

userQuizRouter.get('/history', userQuizController.getUserQuizHistory);

userQuizRouter.get('/attempt/:attemptId', userQuizController.getAttemptDetails);

userQuizRouter.get('/stats', userQuizController.getUserStats);

module.exports = userQuizRouter;