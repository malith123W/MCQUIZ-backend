// const Quiz = require('../models/quizModel');
// const Subject = require('../models/subjectModel');

// // Create a new quiz (minimal implementation to update subject.quizCount)
// const createQuiz = async (req, res) => {
//   try {
//     const { title, subjectId, description } = req.body;
    
//     // Validate required fields
//     if (!title || !subjectId) {
//       return res.status(400).json({ message: 'Quiz title and subject ID are required' });
//     }
    
//     // Check if subject exists
//     const subject = await Subject.findById(subjectId);
//     if (!subject) {
//       return res.status(404).json({ message: 'Subject not found' });
//     }
    
//     // Create new quiz
//     const quiz = new Quiz({
//       title,
//       subject: subjectId,
//       description: description || '',
//       createdBy: req.user.userId
//     });
    
//     await quiz.save();
    
//     // Update quiz count in subject
//     subject.quizCount += 1;
//     await subject.save();
    
//     res.status(201).json({
//       message: 'Quiz created successfully',
//       quiz
//     });
//   } catch (error) {
//     console.error('Create quiz error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete quiz (minimal implementation to update subject.quizCount)
// const deleteQuiz = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const quiz = await Quiz.findById(id);
    
//     if (!quiz) {
//       return res.status(404).json({ message: 'Quiz not found' });
//     }
    
//     // Get the subject to update quizCount
//     const subject = await Subject.findById(quiz.subject);
    
//     if (subject) {
//       // Decrement quiz count in subject
//       subject.quizCount = Math.max(0, subject.quizCount - 1);
//       await subject.save();
//     }
    
//     await Quiz.findByIdAndDelete(id);
    
//     res.status(200).json({ message: 'Quiz deleted successfully' });
//   } catch (error) {
//     console.error('Delete quiz error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get quizzes by subject
// const getQuizzesBySubject = async (req, res) => {
//   try {
//     const { subjectId } = req.params;
    
//     const quizzes = await Quiz.find({ subject: subjectId }).sort({ createdAt: -1 });
    
//     res.status(200).json({ quizzes });
//   } catch (error) {
//     console.error('Get quizzes by subject error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = {
//   createQuiz,
//   deleteQuiz,
//   getQuizzesBySubject
// };




// const Quiz = require('../models/quizModel');
// const Subject = require('../models/subjectModel');

// // Create a new quiz with questions
// const createQuiz = async (req, res) => {
//   try {
//     const { 
//       title, 
//       subjectId, 
//       description, 
//       level,
//       questions
//     } = req.body;
    
//     // Validate required fields
//     if (!title || !subjectId || !level || !questions || !Array.isArray(questions) || questions.length === 0) {
//       return res.status(400).json({ 
//         message: 'Quiz title, subject ID, level, and at least one question are required' 
//       });
//     }
    
//     // Check if subject exists
//     const subject = await Subject.findById(subjectId);
//     if (!subject) {
//       return res.status(404).json({ message: 'Subject not found' });
//     }
    
//     // Validate level matches subject level
//     if (level !== subject.level) {
//       return res.status(400).json({ 
//         message: `Quiz level must match subject level (${subject.level})` 
//       });
//     }
    
//     // Validate each question
//     for (const question of questions) {
//       if (!question.questionText || !question.choices || !Array.isArray(question.choices) || 
//           question.choices.length < 2 || question.choices.length > 10 || 
//           !question.correctAnswer || !question.choices.includes(question.correctAnswer)) {
//         return res.status(400).json({ 
//           message: 'Each question must have question text, 2-10 choices, and a correct answer from those choices'
//         });
//       }
      
//       // Ensure timeLimit and marks have default values if not provided
//       if (!question.timeLimit) question.timeLimit = 60;
//       if (!question.marks) question.marks = 1;
//     }
    
//     // Create new quiz
//     const quiz = new Quiz({
//       title,
//       subject: subjectId,
//       level,
//       description: description || '',
//       questions,
//       totalQuestions: questions.length,
//       totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
//       createdBy: req.user.userId
//     });
    
//     await quiz.save();
    
//     // Update quiz count in subject
//     subject.quizCount += 1;
//     await subject.save();
    
//     res.status(201).json({
//       message: 'Quiz created successfully',
//       quiz: {
//         _id: quiz._id,
//         title: quiz.title,
//         subject: quiz.subject,
//         level: quiz.level,
//         description: quiz.description,
//         totalQuestions: quiz.totalQuestions,
//         totalMarks: quiz.totalMarks,
//         createdAt: quiz.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Create quiz error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get quiz by ID with all details
// const getQuizById = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const quiz = await Quiz.findById(id).populate('subject', 'name level');
    
//     if (!quiz) {
//       return res.status(404).json({ message: 'Quiz not found' });
//     }
    
//     res.status(200).json({ quiz });
//   } catch (error) {
//     console.error('Get quiz by ID error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Update quiz
// const updateQuiz = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { 
//       title, 
//       description, 
//       questions,
//       isActive
//     } = req.body;
    
//     // Find quiz
//     const quiz = await Quiz.findById(id);
    
//     if (!quiz) {
//       return res.status(404).json({ message: 'Quiz not found' });
//     }
    
//     // Check if user is authorized (creator or admin)
//     if (quiz.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Not authorized to update this quiz' });
//     }
    
//     // Update basic fields
//     if (title) quiz.title = title;
//     if (description !== undefined) quiz.description = description;
//     if (isActive !== undefined) quiz.isActive = isActive;
    
//     // Update questions if provided
//     if (questions && Array.isArray(questions) && questions.length > 0) {
//       // Validate each question
//       for (const question of questions) {
//         if (!question.questionText || !question.choices || !Array.isArray(question.choices) || 
//             question.choices.length < 2 || question.choices.length > 10 || 
//             !question.correctAnswer || !question.choices.includes(question.correctAnswer)) {
//           return res.status(400).json({ 
//             message: 'Each question must have question text, 2-10 choices, and a correct answer from those choices'
//           });
//         }
//       }
      
//       quiz.questions = questions;
//       quiz.totalQuestions = questions.length;
//       quiz.totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
//     }
    
//     await quiz.save();
    
//     res.status(200).json({
//       message: 'Quiz updated successfully',
//       quiz: {
//         _id: quiz._id,
//         title: quiz.title,
//         description: quiz.description,
//         totalQuestions: quiz.totalQuestions,
//         totalMarks: quiz.totalMarks,
//         isActive: quiz.isActive,
//         updatedAt: quiz.updatedAt
//       }
//     });
//   } catch (error) {
//     console.error('Update quiz error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Delete quiz
// const deleteQuiz = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     const quiz = await Quiz.findById(id);
    
//     if (!quiz) {
//       return res.status(404).json({ message: 'Quiz not found' });
//     }
    
//     // Get the subject to update quizCount
//     const subject = await Subject.findById(quiz.subject);
    
//     if (subject) {
//       // Decrement quiz count in subject
//       subject.quizCount = Math.max(0, subject.quizCount - 1);
//       await subject.save();
//     }
    
//     await Quiz.findByIdAndDelete(id);
    
//     res.status(200).json({ message: 'Quiz deleted successfully' });
//   } catch (error) {
//     console.error('Delete quiz error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get quizzes by subject
// const getQuizzesBySubject = async (req, res) => {
//   try {
//     const { subjectId } = req.params;
    
//     const quizzes = await Quiz.find({ subject: subjectId })
//       .select('title level totalQuestions totalMarks isActive createdAt')
//       .sort({ createdAt: -1 });
    
//     res.status(200).json({ quizzes });
//   } catch (error) {
//     console.error('Get quizzes by subject error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// // Get quizzes by level
// const getQuizzesByLevel = async (req, res) => {
//   try {
//     const { level } = req.params;
    
//     // Validate level
//     const validLevels = ['School Pro', 'O/L Pro', 'A/L'];
//     if (!validLevels.includes(level)) {
//       return res.status(400).json({ message: 'Invalid level. Must be School Pro, O/L Pro, or A/L' });
//     }
    
//     const quizzes = await Quiz.find({ level })
//       .select('title subject totalQuestions totalMarks isActive createdAt')
//       .populate('subject', 'name')
//       .sort({ createdAt: -1 });
    
//     res.status(200).json({ quizzes });
//   } catch (error) {
//     console.error('Get quizzes by level error:', error);
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = {
//   createQuiz,
//   getQuizById,
//   updateQuiz,
//   deleteQuiz,
//   getQuizzesBySubject,
//   getQuizzesByLevel
// };







const Quiz = require('../models/quizModel');
const Subject = require('../models/subjectModel');
const mongoose = require('mongoose');

const createQuiz = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, subject, timeLimit, questions, difficulty, passingScore } = req.body;
    
    if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        message: 'Quiz title, subject ID, and at least one question are required' 
      });
    }
    
    const subjectExists = await Subject.findById(subject);
    if (!subjectExists) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    if (!['School Pro', 'O/L Pro', 'A/L'].includes(subjectExists.level)) {
      return res.status(400).json({ message: 'Subject has an invalid level' });
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2 || 
          q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({
          message: `Question ${i + 1} is invalid. Each question must have text, at least 2 options, and a valid correct answer index.`
        });
      }
    }
    
    const quiz = new Quiz({
      title,
      description: description || '',
      subject,
      timeLimit: timeLimit || 0,
      questions,
      difficulty: difficulty || 'Medium',
      passingScore: passingScore !== undefined ? passingScore : 60,
      createdBy: req.user.userId
    });
    
    await quiz.save({ session });
    
    await Subject.findByIdAndUpdate(
      subject,
      { $inc: { quizCount: 1 } },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        questionsCount: quiz.questions.length
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllQuizzes = async (req, res) => {
  try {
    const { subject, search, difficulty, active, sort, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (subject) {
      query.subject = mongoose.Types.ObjectId.isValid(subject) ? subject : null;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
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
    
    const quizzes = await Quiz.find(query)
      .populate('subject', 'name level')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Quiz.countDocuments(query);
    
    const transformedQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      questionsCount: quiz.questions ? quiz.questions.length : 0,
      timeLimit: quiz.timeLimit,
      difficulty: quiz.difficulty,
      isActive: quiz.isActive,
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
};

const getQuizzesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }
    
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    const quizzes = await Quiz.find({ subject: subjectId })
      .select('title description difficulty timeLimit isActive createdAt')
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
};

const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    const quiz = await Quiz.findById(id)
      .populate('subject', 'name level');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateQuiz = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    const { title, description, subject, timeLimit, questions, difficulty, passingScore, isActive } = req.body;
    
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    let oldSubjectId = null;
    if (subject && String(quiz.subject) !== String(subject)) {
      if (!mongoose.Types.ObjectId.isValid(subject)) {
        return res.status(400).json({ message: 'Invalid subject ID format' });
      }
      
      const newSubject = await Subject.findById(subject);
      if (!newSubject) {
        return res.status(404).json({ message: 'New subject not found' });
      }
      
      oldSubjectId = quiz.subject;
      quiz.subject = subject;
    }
    
    if (title) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (timeLimit !== undefined) quiz.timeLimit = parseInt(timeLimit);
    if (difficulty) quiz.difficulty = difficulty;
    if (passingScore !== undefined) quiz.passingScore = parseInt(passingScore);
    if (isActive !== undefined) quiz.isActive = isActive;
    
    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length < 2 || 
            q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return res.status(400).json({
            message: `Question ${i + 1} is invalid. Each question must have text, at least 2 options, and a valid correct answer index.`
          });
        }
      }
      
      quiz.questions = questions;
    }
    
    await quiz.save({ session });
    
    if (oldSubjectId) {
      await Subject.findByIdAndUpdate(
        oldSubjectId,
        { $inc: { quizCount: -1 } },
        { session }
      );
      
      await Subject.findByIdAndUpdate(
        subject,
        { $inc: { quizCount: 1 } },
        { session }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      message: 'Quiz updated successfully',
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        questionsCount: quiz.questions.length,
        isActive: quiz.isActive
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    const quiz = await Quiz.findById(id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const subjectId = quiz.subject;
    
    await Quiz.findByIdAndDelete(id, { session });
    
    await Subject.findByIdAndUpdate(
      subjectId,
      { $inc: { quizCount: -1 } },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getQuizStats = async (req, res) => {
  try {
    const totalQuizzes = await Quiz.countDocuments();
    
    const difficultyStats = await Quiz.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    const subjectStats = await Quiz.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const subjectIds = subjectStats.map(stat => stat._id);
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    
    const subjectMap = {};
    subjects.forEach(subject => {
      subjectMap[subject._id] = {
        name: subject.name,
        level: subject.level
      };
    });
    
    const formattedSubjectStats = subjectStats.map(stat => ({
      subjectId: stat._id,
      subjectName: subjectMap[stat._id]?.name || 'Unknown',
      level: subjectMap[stat._id]?.level || 'Unknown',
      quizCount: stat.count
    }));
    
    res.status(200).json({
      totalQuizzes,
      byDifficulty: difficultyStats.map(stat => ({
        difficulty: stat._id,
        count: stat.count
      })),
      bySubject: formattedSubjectStats
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizzesBySubject,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  getQuizStats
};