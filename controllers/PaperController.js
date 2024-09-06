const Paper = require("../models/Paper");
const Question = require("../models/Question");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const { default: mongoose } = require("mongoose");

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
      questionIds: questionIds || "", // Initialize with an empty string if not provided
    });

    await newPaper.save();

    // Send the paper details including the _id
    res.status(201).json({
      success: true,
      paperId: newPaper._id, // Include the _id in the response
      message: "Paper created successfully",
      paper: newPaper,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

//Editing the Paper
exports.editPaper=async (req,res)=>{

  try
  {
    let edited_paper=await Paper.findOneAndUpdate({_id:req.body._id},req.body);
    await edited_paper.save();

    res.status(201).json({
      success: true,
      paperId: edited_paper._id, // Include the _id in the response
      message: "Paper Edited successfully",
      paper: edited_paper,
    });

  }
  catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
  // console.log(req.body);

}

exports.deletePaper = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Paper ID is required",
      });
    }

    const result = await Paper.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Paper not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paper deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Duplicate a Paper
exports.duplicatePaper = async (req,res) =>
{

  const keyToExclude = "_id"; 
  const filteredData = Object.keys(req.body).filter(key => (key !== keyToExclude) && (key !== "__v"))
  .reduce((obj, key) => {
    obj[key] = req.body[key];
    return obj;
  }, {});


  try {
    const newPaper = new Paper(filteredData);

    await newPaper.save();

    // Send the paper details including the _id
    res.status(201).json({
      success: true,
      paperId: newPaper._id, // Include the _id in the response
      message: "Paper created successfully",
      paper: newPaper,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
}

// Duplicating a question
exports.duplicateQuestion = async (req, res) => {
  const data = req.body;
  // Filter out unwanted keys (_id and __v) from the question object
  const filteredKeyData = Object.keys(data.question)
    .filter(key => key !== "_id" && key !== "__v")
    .reduce((obj, key) => {
      obj[key] = data.question[key]; 
      return obj;
    }, {});

  console.log(filteredKeyData); 

  try {
    const question = new Question(filteredKeyData); 

    await question.save();

    const paper = await Paper.findById(question.paperId);
    if (paper) {
      paper.questionIds = paper.questionIds
        ? `${paper.questionIds},${question._id}`
        : `${question._id}`;
      await paper.save();
    }

    res.status(201).json(question);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

// Deleting a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const result = await Question.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// Upload an image for a question
exports.uploadQuestionImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file.path, {
      folder: "question",
    });

    // Delete the temporary file
    fs.unlinkSync(file.path);

    res.json({ url: uploadResponse.url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to upload image");
  }
};

// Add a new question to a paper
exports.addQuestion = async (req, res) => {
  const {
    paperId,
    questionheading,
    questionDescription,
    compilerReq,
    marks,
    image,
  } = req.body;

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
      paper.questionIds = paper.questionIds
        ? `${paper.questionIds},${question._id}`
        : `${question._id}`;
      await paper.save();
    }

    res.status(201).json(question);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};
exports.getQuestionsByPaperId = async (req, res) => {
  try {
    const { paperId } = req.body; // Get paperId from the request body

    const questions = await Question.find({ paperId });

    if (!questions.length) {
      return res.status(404).json({ msg: "No questions found for this paper" });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

// Get papers by teacher ID
exports.getPapersByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.body; // Get teacherId from the request body

    const papers = await Paper.find({ teacherId });

    if (!papers.length) {
      return res.status(404).json({ msg: "No papers found for this teacher" });
    }

    res.status(200).json(papers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};
