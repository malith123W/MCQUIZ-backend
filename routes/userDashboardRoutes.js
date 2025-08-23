const express = require('express');
const userDashboardRouter = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const User = require('../models/model');
const Attempt = require('../models/quizAttemptModel');
const Quiz = require('../models/quizModel');
const Subject = require('../models/subjectModel');
const mongoose = require('mongoose');

// Get user profile
userDashboardRouter.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user dashboard stats
userDashboardRouter.get('/user/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get basic stats
    const totalAttempts = await Attempt.countDocuments({ user: userId });
    const passedAttempts = await Attempt.countDocuments({ user: userId, passed: true });
    
    // Get average score
    const scoreStats = await Attempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' }
        }
      }
    ]);

    // Get last active date
    const lastAttempt = await Attempt.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .select('createdAt');

    // Get monthly activity for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyActivity = await Attempt.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          quizzesTaken: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get subject performance
    const subjectPerformance = await Attempt.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quizData'
        }
      },
      { $unwind: '$quizData' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'quizData.subject',
          foreignField: '_id',
          as: 'subjectData'
        }
      },
      { $unwind: '$subjectData' },
      {
        $group: {
          _id: '$subjectData._id',
          name: { $first: '$subjectData.name' },
          averageScore: { $avg: '$score' },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { averageScore: -1 } }
    ]);

    // Calculate improvement (comparing last 10 attempts vs previous 10)
    const recentAttempts = await Attempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('score createdAt');

    let improvement = 0;
    if (recentAttempts.length >= 10) {
      const last10 = recentAttempts.slice(0, 10);
      const previous10 = recentAttempts.slice(10, 20);
      
      const last10Avg = last10.reduce((sum, attempt) => sum + attempt.score, 0) / last10.length;
      const previous10Avg = previous10.reduce((sum, attempt) => sum + attempt.score, 0) / previous10.length;
      
      improvement = last10Avg - previous10Avg;
    }

    // Generate daily message
    const dailyMessages = [
      "Ready to continue your learning journey?",
      "Keep up the great work!",
      "Time to challenge yourself with a new quiz!",
      "Your progress is looking amazing!",
      "Ready for today's learning session?"
    ];
    const dailyMessage = dailyMessages[Math.floor(Math.random() * dailyMessages.length)];

    const stats = {
      quizzesTaken: totalAttempts,
      averageScore: scoreStats.length > 0 ? Math.round(scoreStats[0].avgScore) : 0,
      improvement: Math.round(improvement * 10) / 10,
      lastActive: lastAttempt?.createdAt || null,
      passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      highestScore: scoreStats.length > 0 ? scoreStats[0].highestScore : 0,
      monthlyActivity: monthlyActivity.map(month => ({
        month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
        quizzesTaken: month.quizzesTaken
      })),
      subjectPerformance: subjectPerformance.map(subject => ({
        name: subject.name,
        averageScore: Math.round(subject.averageScore),
        attempts: subject.attempts
      })),
      dailyMessage
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent quiz attempts
userDashboardRouter.get('/user/recent-quizzes', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 5;

    const recentAttempts = await Attempt.find({ user: userId })
      .populate({
        path: 'quiz',
        populate: {
          path: 'subject',
          select: 'name level'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('score passed createdAt timeSpent');

    const attempts = recentAttempts.map(attempt => ({
      quizId: attempt.quiz._id,
      quizTitle: attempt.quiz.title,
      subjectName: attempt.quiz.subject.name,
      difficulty: attempt.quiz.difficulty,
      subscriptionLevel: attempt.quiz.subscriptionLevel,
      score: attempt.score,
      passed: attempt.passed,
      attemptDate: attempt.createdAt,
      timeSpent: attempt.timeSpent
    }));

    res.status(200).json({ attempts });
  } catch (error) {
    console.error('Get recent quizzes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommended subjects
userDashboardRouter.get('/user/recommendations', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's attempted subjects
    const userAttempts = await Attempt.find({ user: userId })
      .populate({
        path: 'quiz',
        populate: {
          path: 'subject',
          select: 'name level'
        }
      });

    const attemptedSubjectIds = [...new Set(userAttempts.map(attempt => attempt.quiz.subject._id.toString()))];

    // Get all active subjects
    const allSubjects = await Subject.find({ isActive: true });

    // Get quiz counts for each subject
    const subjectsWithQuizCounts = await Promise.all(
      allSubjects.map(async (subject) => {
        const quizCount = await Quiz.countDocuments({ 
          subject: subject._id, 
          isActive: true 
        });
        
        return {
          _id: subject._id,
          name: subject.name,
          level: subject.level,
          description: subject.description,
          quizCount,
          isAttempted: attemptedSubjectIds.includes(subject._id.toString())
        };
      })
    );

    // Filter out subjects with no quizzes and sort by recommendation score
    const validSubjects = subjectsWithQuizCounts
      .filter(subject => subject.quizCount > 0)
      .sort((a, b) => {
        // Prioritize unattempted subjects
        if (!a.isAttempted && b.isAttempted) return -1;
        if (a.isAttempted && !b.isAttempted) return 1;
        
        // Then sort by quiz count (more quizzes = better recommendation)
        return b.quizCount - a.quizCount;
      })
      .slice(0, 5); // Return top 5 recommendations

    res.status(200).json({ subjects: validSubjects });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test endpoint to check database and quiz attempts
userDashboardRouter.get('/test/data', async (req, res) => {
  try {
    const Subject = require('../models/subjectModel');
    const Quiz = require('../models/quizModel');
    const Attempt = require('../models/quizAttemptModel');
    
    const subjects = await Subject.find({ isActive: true });
    const quizzes = await Quiz.find({ isActive: true });
    const attempts = await Attempt.find().populate('user', 'firstName lastName email');
    
    res.json({
      message: 'Database test successful',
      subjects: {
        count: subjects.length,
        data: subjects.map(s => ({ id: s._id, name: s.name, level: s.level }))
      },
      quizzes: {
        count: quizzes.length,
        data: quizzes.map(q => ({ id: q._id, title: q.title, subject: q.subject }))
      },
      attempts: {
        count: attempts.length,
        data: attempts.map(a => ({ 
          id: a._id, 
          user: a.user?.firstName || 'Unknown', 
          score: a.score, 
          passed: a.passed,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database test failed', error: error.message });
  }
});

// Test endpoint to check user stats calculation (without authentication for testing)
userDashboardRouter.get('/test/stats', async (req, res) => {
  try {
    const Attempt = require('../models/quizAttemptModel');
    const mongoose = require('mongoose');
    
    // Get all attempts for testing
    const totalAttempts = await Attempt.countDocuments();
    const passedAttempts = await Attempt.countDocuments({ passed: true });
    
    // Get average score
    const scoreStats = await Attempt.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' }
        }
      }
    ]);

    // Get recent attempts for improvement calculation
    const recentAttempts = await Attempt.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('score createdAt');

    let improvement = 0;
    if (recentAttempts.length >= 10) {
      const last10 = recentAttempts.slice(0, 10);
      const previous10 = recentAttempts.slice(10, 20);
      
      const last10Avg = last10.reduce((sum, attempt) => sum + attempt.score, 0) / last10.length;
      const previous10Avg = previous10.reduce((sum, attempt) => sum + attempt.score, 0) / previous10.length;
      
      improvement = last10Avg - previous10Avg;
    }

    const stats = {
      quizzesTaken: totalAttempts,
      averageScore: scoreStats.length > 0 ? Math.round(scoreStats[0].avgScore) : 0,
      improvement: Math.round(improvement * 10) / 10,
      passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      highestScore: scoreStats.length > 0 ? scoreStats[0].highestScore : 0,
      message: 'Test stats calculated successfully'
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Test stats error:', error);
    res.status(500).json({ message: 'Test stats failed', error: error.message });
  }
});

// Test endpoint to check users and authentication
userDashboardRouter.get('/test/users', async (req, res) => {
  try {
    const User = require('../models/model');
    const users = await User.find().select('firstName lastName email role');
    
    res.json({
      message: 'Users found',
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('Test users error:', error);
    res.status(500).json({ message: 'Test users failed', error: error.message });
  }
});

// Endpoint to get user's enrolled courses (subjects they have access to)
userDashboardRouter.get('/enrolled-courses', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require('mongoose');
    const Subject = require('../models/subjectModel');
    const Attempt = require('../models/quizAttemptModel');
    const Subscription = require('../models/subscription');
    
    // Get user's active subscriptions
    const activeSubscriptions = await Subscription.find({
      userId: userId,
      status: 'success',
      endDate: { $gte: new Date() }
    });
    
    // Get subscription levels the user has access to
    const userSubscriptionLevels = activeSubscriptions.map(sub => sub.planType);
    
    // If no active subscriptions, give access to Basic level only
    const accessibleLevels = userSubscriptionLevels.length > 0 ? userSubscriptionLevels : ['Basic'];
    
    // Get subjects the user has access to based on subscription
    const accessibleSubjects = await Subject.find({
      level: { $in: accessibleLevels },
      isActive: true
    }).sort({ name: 1 });
    
    // Get subjects the user has actually attempted quizzes for
    const userAttempts = await Attempt.find({ user: userId })
      .populate({
        path: 'quiz',
        populate: {
          path: 'subject',
          select: 'name description level'
        }
      });
    
    const attemptedSubjectIds = [...new Set(userAttempts.map(attempt => 
      attempt.quiz?.subject?._id?.toString()
    ).filter(Boolean))];
    
    // Combine accessible subjects with attempted subjects
    const enrolledSubjects = accessibleSubjects.map(subject => ({
      _id: subject._id,
      name: subject.name,
      description: subject.description,
      level: subject.level,
      isEnrolled: attemptedSubjectIds.includes(subject._id.toString()),
      quizCount: 0 // This could be populated with actual quiz count if needed
    }));
    
    res.status(200).json({
      subjects: enrolledSubjects,
      message: 'Enrolled courses retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Failed to get enrolled courses', error: error.message });
  }
});

module.exports = userDashboardRouter;
