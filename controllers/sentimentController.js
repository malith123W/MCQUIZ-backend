const Feedback = require('../models/feedbackModel');
const User = require('../models/model');
const path = require('path');
const fs = require('fs');

// Load the pickle model (we'll use a Python script for this)
const pythonScriptPath = path.join(__dirname, '../scripts/sentiment_analysis.py');

// Function to run Python script for sentiment analysis
const runSentimentAnalysis = async (text) => {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', [pythonScriptPath, text]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${error}`));
        return;
      }
      
      try {
        const prediction = JSON.parse(result.trim());
        resolve(prediction);
      } catch (parseError) {
        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
};

// Submit feedback with sentiment analysis
const submitFeedback = async (req, res) => {
  try {
    const { feedback } = req.body;
    const userId = req.user.userId;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Run sentiment analysis
    let sentimentResult;
    try {
      sentimentResult = await runSentimentAnalysis(feedback.trim());
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      // Fallback: use a simple rule-based approach
      sentimentResult = {
        sentiment: feedback.toLowerCase().includes('good') || 
                  feedback.toLowerCase().includes('great') || 
                  feedback.toLowerCase().includes('excellent') || 
                  feedback.toLowerCase().includes('love') || 
                  feedback.toLowerCase().includes('amazing') ? 'positive' : 'negative',
        confidence: 0.6
      };
    }

    // Create feedback record
    const newFeedback = new Feedback({
      user: userId,
      feedback: feedback.trim(),
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence || 0.6
    });

    await newFeedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: newFeedback._id,
        text: newFeedback.feedback,
        sentiment: newFeedback.sentiment,
        confidence: newFeedback.confidence,
        createdAt: newFeedback.createdAt
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Get all feedback (admin only)
const getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      Feedback.find({ isActive: true })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments({ isActive: true })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      feedback,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Get feedback statistics
const getFeedbackStats = async (req, res) => {
  try {
    const [positiveCount, negativeCount, totalCount] = await Promise.all([
      Feedback.countDocuments({ sentiment: 'positive', isActive: true }),
      Feedback.countDocuments({ sentiment: 'negative', isActive: true }),
      Feedback.countDocuments({ isActive: true })
    ]);

    // Calculate percentages
    const positivePercentage = totalCount > 0 ? ((positiveCount / totalCount) * 100).toFixed(1) : 0;
    const negativePercentage = totalCount > 0 ? ((negativeCount / totalCount) * 100).toFixed(1) : 0;

    // Get recent feedback trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStats = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentPositive = recentStats.find(s => s._id === 'positive')?.count || 0;
    const recentNegative = recentStats.find(s => s._id === 'negative')?.count || 0;

    res.status(200).json({
      overall: {
        positive: positiveCount,
        negative: negativeCount,
        total: totalCount,
        positivePercentage: parseFloat(positivePercentage),
        negativePercentage: parseFloat(negativePercentage)
      },
      recent: {
        positive: recentPositive,
        negative: recentNegative,
        total: recentPositive + recentNegative
      }
    });

  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Get user's own feedback
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      Feedback.find({ user: userId, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Feedback.countDocuments({ user: userId, isActive: true })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      feedback,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Delete feedback (admin or owner)
const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Only admin or feedback owner can delete
    if (userRole !== 'admin' && feedback.user.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    feedback.isActive = false;
    await feedback.save();

    res.status(200).json({ message: 'Feedback deleted successfully' });

  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = {
  submitFeedback,
  getAllFeedback,
  getFeedbackStats,
  getUserFeedback,
  deleteFeedback
};
