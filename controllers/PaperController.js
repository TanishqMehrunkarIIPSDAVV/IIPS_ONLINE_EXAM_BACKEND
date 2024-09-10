const Paper = require("../models/Paper");
const Question = require("../models/Question");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const {
  ReadyPaper,
  ReadyQuestion,
} = require("../models/Ready_paper_&_question");

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
exports.editPaper = async (req, res) => {
  try {
    let edited_paper = await Paper.findOneAndUpdate(
      { _id: req.body._id },
      req.body
    );
    await edited_paper.save();

    res.status(201).json({
      success: true,
      paperId: edited_paper._id, // Include the _id in the response
      message: "Paper Edited successfully",
      paper: edited_paper,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
  // console.log(req.body);
};

exports.deletePaper = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Paper ID is required",
      });
    }

    // Find and delete the paper
    const result = await Paper.deleteOne({ _id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Paper not found",
      });
    }

    // Delete all questions of  the paper
    await Question.deleteMany({ paperId: _id });

    res.status(200).json({
      success: true,
      message: "Paper deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting paper:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Duplicate a Paper
exports.duplicatePaper = async (req, res) => {
  const keyToExclude = "_id";
  const filteredData = Object.keys(req.body)
    .filter((key) => key !== keyToExclude && key !== "__v")
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  try {
    const newPaper = new Paper(filteredData);

    await newPaper.save();

    const originalQuestions = await Question.find({ paperId: req.body._id });

    const newQuestionIds = [];
    for (const originalQuestion of originalQuestions) {
      const newQuestion = new Question({
        paperId: newPaper._id,
        questionheading: originalQuestion.questionheading,
        questionDescription: originalQuestion.questionDescription,
        compilerReq: originalQuestion.compilerReq,
        marks: originalQuestion.marks,
        image: originalQuestion.image,
      });

      await newQuestion.save();
      newQuestionIds.push(newQuestion._id);
    }

    newPaper.questionIds = newQuestionIds.join(",");
    await newPaper.save();

    res.status(201).json({
      success: true,
      paperId: newPaper._id,
      message: "Paper duplicated successfully",
      paper: newPaper,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

// Duplicating a question
exports.duplicateQuestion = async (req, res) => {
  const data = req.body;
  // Filter out unwanted keys (_id and __v) from the question object
  const filteredKeyData = Object.keys(data.question)
    .filter((key) => key !== "_id" && key !== "__v")
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

//Editing a question
exports.editQuestion = async (req, res) => {
  const { _id , paperId , questionheading, questionDescription, compilerReq, marks,image } =
    req.body;

  try {
    const result = await Question.findOneAndUpdate(
      { _id: _id, paperId: paperId },
      {questionheading, questionDescription, compilerReq, marks,image }
    );
    await result.save();
    res.status(200).json({
      success: true,
      message: "Question updated successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

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
exports.addQuestion = async (req, res) =>{
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
exports.getPaperdetailBypaperId = async (req, res) => {
  try {
    const { paperId } = req.body; // Get teacherId from the request body

    const paper = await Paper.find({ _id: paperId });

    if (!paper) {
      return res.status(404).json({ msg: "No papers found for this teacher" });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

exports.Create_Ready_Paper = async (req, res) => {
  const { paperId } = req.body;

  try {
   
    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: "Paper not found" });
    }

    // Calculate start and end times of the new paper
    const paperStartTime = new Date(paper.date);
    const [hours, minutes] = paper.time.split(":").map(Number);
    paperStartTime.setHours(hours);
    paperStartTime.setMinutes(minutes);

    // Calculate the paper's end time based on the duration
    const paperEndTime = new Date(paperStartTime);
    paperEndTime.setHours(paperEndTime.getHours() + paper.duration.hours);
    paperEndTime.setMinutes(paperEndTime.getMinutes() + paper.duration.minutes);

    // Check for overlapping papers in the ReadyPaper collection
    const overlappingPaper = await ReadyPaper.findOne({
      className: paper.className,
      semester: paper.semester,
      date: paper.date,
      $or: [
        {
          // Case : The new paper overlaps with an existing one
          startTime: { $lt: paperEndTime }, // New paper starts before the end of an existing paper
          endTime: { $gt: paperStartTime } // New paper ends after the start of an existing paper
        }
      ]
    });

    if (overlappingPaper) {
      const overlappingPaperStartTime = new Date(overlappingPaper.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const overlappingPaperEndTime = new Date(overlappingPaper.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      return res.status(400).json({
        success: false,
        message: `A paper is already scheduled for ${paper.className} ${paper.semester} on ${new Date(overlappingPaper.date).toDateString()} from ${overlappingPaperStartTime} to ${overlappingPaperEndTime} for subject ${overlappingPaper.subject}.`,
      });
    }

    // Fetch all associated questions
    const questions = await Question.find({ paperId: paperId });

   
    const readyPaper = new ReadyPaper({
      className: paper.className,
      semester: paper.semester,
      subject: paper.subject,
      subjectCode: paper.subjectCode,
      date: paper.date,
      time: paper.time,
      duration: paper.duration,
      marks: paper.marks,
      testType: paper.testType,
      teacherId: paper.teacherId,
      questionIds: paper.questionIds,
      startTime: paperStartTime,
      endTime: paperEndTime
    });

    await readyPaper.save();

    // Move each question to ReadyQuestion
    for (let question of questions) {
      const readyQuestion = new ReadyQuestion({
        paperId: readyPaper._id,
        questionheading: question.questionheading,
        questionDescription: question.questionDescription,
        compilerReq: question.compilerReq,
        marks: question.marks,
        image: question.image
      });

      await readyQuestion.save();
    }

    // Delete the original paper and questions
    await Paper.findByIdAndDelete(paperId);
    await Question.deleteMany({ paperId: paperId });

    res.status(200).json({
      success: true,
      message: "Paper and associated questions have been submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting paper:", error);
    res.status(500).send("Server Error");
  }
};

exports.deleteReadyPaper =async (req,res)=>{
  
  try
  {
    // console.log(req.body.paper._id);
    const paperId=req.body.paper._id;

    const readyPaper= await ReadyPaper.findById(paperId);
    if(!readyPaper){
      return res.status(404).json({msg:"Paper not found"});
    }
    await ReadyPaper.findByIdAndDelete(paperId);

    await ReadyQuestion.deleteMany({ paperId: paperId });

    res.status(200).json({msg:"Paper deleted successfully"});
  }
  catch(error){
    console.error("Error deleting paper:", error);
    res.status(500).send("Server Error");
  }
}


exports.moveToDashBoard = async (req, res) => {
  try {
      //Adding in Dash board

      const paperId=req.body._id;
      // console.log(req.body);
      const newPaper = new Paper(req.body);
      await newPaper.save();
      const question_id_list=await ReadyQuestion.find({"paperId":paperId});
      for(let question of question_id_list)
      {
        const {paperId,questionheading,questionDescription,compilerReq,marks,image}=question;
        const newQuestion = new Question({
          paperId,
          questionheading,
          questionDescription,
          compilerReq,
          marks,
          image
        });
        await newQuestion.save();
      }

      // Deleting Paper from ReadyPaper

      const readyPaper= await ReadyPaper.findById(paperId);
      if(!readyPaper){
        return res.status(404).json({msg:"Paper not found"});
      }
      await ReadyPaper.findByIdAndDelete(paperId);
  
      await ReadyQuestion.deleteMany({ paperId: paperId });
  
      res.status(200).json({msg:"Paper Moved to Dashboard successfully"});
  }
  catch(error)
  {
    console.log("The Error:",error);
    res.status(500).send("Error in moving paper to Dashboard");
  }
}

//get Ready papers by teacherId
exports.getReadyPapersByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.body; // Get teacherId from the request body

    const papers = await ReadyPaper.find({ teacherId });

    if (!papers.length) {
      return res.status(404).json({ msg: "No papers found for this teacher" });
    }

    res.status(200).json(papers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

exports.getReadyQuestionPapersByTeacherId = async(req,res) =>
{ 
  try {
    const { paperId } = req.body; // Get paperId from the request body

    const questions = await ReadyQuestion.find({ paperId });

    if (!questions.length) {
      return res.status(404).json({ msg: "No questions found for this paper" });
    }

    res.status(200).json(questions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
}

exports.getReadyPaperDetailsByPaperId = async(req,res)=>
{
  try
  {
      const {paperId} = req.body;

      const paper = await ReadyPaper.find({ _id: paperId });

    if (!paper) {
      return res.status(404).json({ msg: "No papers found for this teacher" });
    }

    res.status(200).json(paper);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
}