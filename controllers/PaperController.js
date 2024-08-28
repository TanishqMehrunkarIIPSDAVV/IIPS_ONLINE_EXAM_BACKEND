const Paper = require('../models/Paper');
const Question = require('../models/Question');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// Create a new paper
exports.createPaper = async (req, res) => {
    const {
      className,
      semester,
      subject,
      subjectCode,
      date,
      time,
      duration,
      marks,
      testType,
      teacherId,
      questionIds,
    } = req.body;
  
    try {
      const newPaper = new Paper({
        className,
        semester,
        subject,
        subjectCode,
        date,
        time,
        duration,
        marks,
        testType,
        teacherId,
        questionIds: questionIds || '', // Initialize with an empty string if not provided
      });
  
      await newPaper.save();
  
      // Send the paper details including the _id
      res.status(201).json({
        success: true,
        paperId: newPaper._id,  // Include the _id in the response
        message: "Paper created successfully",
        paper: newPaper,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  };
  

// Upload an image for a question
exports.uploadQuestionImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file.path, {
      folder: 'question',
    });

    // Delete the temporary file
    fs.unlinkSync(file.path);

    res.json({ url: uploadResponse.url });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to upload image');
  }
};

// Add a new question to a paper
exports.addQuestion = async (req, res) => {
    const { paperId, questionheading, questionDescription, compilerReq, marks, image } = req.body;
  
    try {
      const question = new Question({
        paperId,
        questionheading,
        questionDescription,
        compilerReq,
        marks,
        image,
      });
  
      await question.save();
  
      const paper = await Paper.findById(paperId);
      if (paper) {
        paper.questionIds = paper.questionIds ? `${paper.questionIds},${question._id}` : `${question._id}`;
        await paper.save();
      }
  
      res.status(201).json(question);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  };
exports.getQuestionsByPaperId = async (req, res) => {
    try {
      const { paperId } = req.body; // Get paperId from the request body
  
      const questions = await Question.find({ paperId });
  
      if (!questions.length) {
        return res.status(404).json({ msg: 'No questions found for this paper' });
      }
  
      res.status(200).json(questions);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  };

// Get papers by teacher ID
exports.getPapersByTeacherId = async (req, res) => {
    try {
      const { teacherId } = req.body; // Get teacherId from the request body
  
      const papers = await Paper.find({ teacherId });
  
      if (!papers.length) {
        return res.status(404).json({ msg: 'No papers found for this teacher' });
      }
  
      res.status(200).json(papers);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  };