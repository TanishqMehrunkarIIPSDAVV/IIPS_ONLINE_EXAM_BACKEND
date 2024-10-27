const Paper = require("../models/Paper");
const Question = require("../models/Question");
const Response = require("../models/Reponse");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const upload = multer({ dest: "uploads/" });
const UTC_TIMEZONE = 'UTC';
const IST_TIMEZONE = 'Asia/Kolkata';
const fs = require("fs");
const {
  ReadyPaper,
  ReadyQuestion,
} = require("../models/Ready_paper_&_question");
const { CompletedPaper, CompletedQuestion } = require("../models/Completed_papers");
// const { utcToZonedTime, format } = require('date-fns-tz');
// const IST_TIMEZONE = 'Asia/Kolkata';
const moment = require('moment-timezone');
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

    // Validate and format date and time
    const paperDate = moment(paper.date, 'YYYY-MM-DD', true); // Explicit format
    const paperTime = moment(paper.time, 'HH:mm', true);

    if (!paperDate.isValid() || !paperTime.isValid()) {
      console.error("Date or Time Error:", { paperDate, paperTime });
      return res.status(400).json({ message: "Invalid date or time format." });
    }

    // Combine date and time in IST timezone, then convert to UTC
    const paperStartDateIST = moment.tz(`${paperDate.format('YYYY-MM-DD')} ${paperTime.format('HH:mm')}`, 'YYYY-MM-DD HH:mm', IST_TIMEZONE);
    const paperStartDateUTC = paperStartDateIST.clone().tz(UTC_TIMEZONE);

    // Calculate end time in UTC based on duration
    const durationHours = parseInt(paper.duration.hours, 10) || 0;
    const durationMinutes = parseInt(paper.duration.minutes, 10) || 0;
    const paperEndDateUTC = paperStartDateUTC.clone().add(durationHours, 'hours').add(durationMinutes, 'minutes');

    if (!paperEndDateUTC.isValid()) {
      return res.status(400).json({ message: "Invalid end date. Please check the duration values." });
    }

    // Check for overlapping papers in UTC
    const overlappingPaper = await ReadyPaper.findOne({
      className: paper.className,
      semester: paper.semester,
      date: paper.date,
      $or: [
        { startTime: { $lt: paperEndDateUTC.toDate() }, endTime: { $gt: paperStartDateUTC.toDate() } }
      ]
    });

    if (overlappingPaper) {
      const overlappingPaperStartTime = moment(overlappingPaper.startTime).tz(IST_TIMEZONE).format('hh:mm A');
      const overlappingPaperEndTime = moment(overlappingPaper.endTime).tz(IST_TIMEZONE).format('hh:mm A');

      return res.status(400).json({
        success: false,
        message: `A paper is already scheduled for ${paper.className} ${paper.semester} on ${moment(overlappingPaper.date).format('YYYY-MM-DD')} from ${overlappingPaperStartTime} to ${overlappingPaperEndTime} for subject ${overlappingPaper.subject}.`,
      });
    }

    let questions = await Question.find({ paperId: paperId }).sort({ marks: 1 });

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
      startTime: paperStartDateUTC.toDate(),
      endTime: paperEndDateUTC.toDate()
    });

    await readyPaper.save();

    // Link questions in a sorted order by marks to form a linked list
    let previousQuestionId = null;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const readyQuestion = new ReadyQuestion({
        paperId: readyPaper._id,
        questionheading: question.questionheading,
        questionDescription: question.questionDescription,
        compilerReq: question.compilerReq,
        marks: question.marks,
        image: question.image,
        previousQuestionId: previousQuestionId,
        nextQuestionId: null,
      });

      const savedQuestion = await readyQuestion.save();

      if (previousQuestionId) {
        await ReadyQuestion.findByIdAndUpdate(previousQuestionId, { nextQuestionId: savedQuestion._id });
      }

      previousQuestionId = savedQuestion._id;
    }

    // Delete original paper and questions in parallel after saving ready paper
    await Promise.all([
      Paper.findByIdAndDelete(paperId),
      Question.deleteMany({ paperId: paperId })
    ]);

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

//get Completed papers by teacherId
exports.getCompletedPapersByTeacherId = async (req, res) => {
  try {
    const { teacherId } = req.body; // Get teacherId from the request body

    const papers = await CompletedPaper.find({ teacherId });

    if (!papers.length) {
      return res.status(404).json({ msg: "No papers found for this teacher" });
    }else{
      res.status(200).json(papers);
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

exports.editReadyQuestion=async (req,res)=>{
  const { _id , paperId , questionheading, questionDescription, compilerReq, marks,image } =
    req.body;
  try {
    const result = await ReadyQuestion.findOneAndUpdate(
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

exports.getQuestionsDetailsByQuestionId= async(req,res)=>
{
    try
    {
        const {questionId} = req.body;
        const question = await Question.findOne({_id : questionId});

        if(!question) return res.status(404).json({msg: "No question found for this question id!!!"});
        res.status(200).json({question});
    }
    catch(error)
    {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
}

exports.getCompletedPaperByPaperId = async(req,res)=>
{
  try
  {
    const {paperId} = req.body;
    const paper = await CompletedPaper.findOne({_id: paperId});
    res.status(200).json({students: paper.studentIds ,paper});
  }
  catch(err)
    {
      return res.status(500).json({error: err});
    }
}

exports.getCompletedQuestionsDetailsByQuestionId= async(req,res)=>
  {
      try
      {
          const {questionId} = req.body;
          const question = await CompletedQuestion.findOne({_id : questionId});
        
          if(!question) return res.status(404).json({msg: "No question found for this question id!!!"});
          res.status(200).json({question});
      }
      catch(error)
      {
          console.error(error.message);
          res.status(500).send("Server Error");
      }
  }

    exports.evaluate=async (req, res) => {
    try {
      const { studentId, paperId } = req.body;
  
      // Find the response document for the provided studentId and paperId
      const response = await Response.findOne({ studentId, paperId }).populate('questions.questionId');
  
      if (!response) {
        return res.status(200).json({ status: 'Not Attempted' });
      }
  
      // Flags for marks checking
      let hasEvaluatedMarks = true;
      let hasNonNullMarks = false;
      let totalMarks = 0;
  
      // Iterate through each question to determine the evaluation status
      response.questions.forEach((question) => {
        if (question.marks === null) {
          hasEvaluatedMarks = false;
        } else {
          hasNonNullMarks = true;
          totalMarks += question.marks;
        }
      });
  
      // Determine response status based on flags
      if (!hasNonNullMarks) {
        return res.status(200).json({ status: 'Not Evaluated' });
      } else if (!hasEvaluatedMarks) {
        return res.status(200).json({ status: 'Evaluation in Progress' });
      } else {
        return res.status(200).json({ status: 'Evaluated', totalMarks });
      }
    } catch (error) {
      console.error('Error in evaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.evaluatePaper = async (req, res) => {
    try {
      const { paperId } = req.body;
  
      // Find the paper by paperId
      const paper = await CompletedPaper.findById(paperId);
  
      if (!paper) {
        return res.status(404).json({ error: 'Paper not found' });
      }
  
      const { studentIds } = paper; // Array of studentIds
  
      let paperEvaluated = true;
      let paperInProgress = false;
  
      // Iterate through each studentId to evaluate their responses
      for (let i = 0; i < studentIds.length; i++) {
        const studentId = studentIds[i];
  
        // Find the response document for this studentId and paperId
        const response = await Response.findOne({ studentId, paperId }).populate('questions.questionId');
  
        if (response) {
          let hasEvaluatedMarks = true;
          let hasNonNullMarks = false;
  
          // Check each question in the response to determine the evaluation status
          response.questions.forEach((question) => {
            if (question.marks === null) {
              hasEvaluatedMarks = false;
            } else {
              hasNonNullMarks = true;
            }
          });
  
          // If there are any non-null marks but not all questions are evaluated, mark paper in progress
          if (!hasEvaluatedMarks && hasNonNullMarks) {
            paperInProgress = true;
          }
  
          // If no questions have non-null marks, mark paper as not evaluated
          if (!hasNonNullMarks) {
            paperEvaluated = false;
          }
  
          // If any question is not fully evaluated, mark paper as in progress
          if (!hasEvaluatedMarks) {
            paperEvaluated = false;
          }
        } else {
          // If there's no response, mark the paper as not evaluated
          paperEvaluated = false;
        }
      }
  
      // Determine and update the paper evaluation status
      if (paperEvaluated) {
        paper.evaluationStatus = 'Evaluated';
      } else if (paperInProgress) {
        paper.evaluationStatus = 'Evaluation-in-Progress';
      } else {
        paper.evaluationStatus = 'Not-Evaluated';
      }
  
      // Save the updated paper document
      await paper.save();
  
      return res.status(200).json({
        status: paper.evaluationStatus,
        message: `Paper evaluation updated to: ${paper.evaluationStatus}`,
      });
    } catch (error) {
      console.error('Error in paper evaluation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  exports.getEmailSent = async (req,res)=>
  {
    try
    {
      const {paperId} = req.body;
      const paper = await CompletedPaper.findOne({_id: paperId});
      if(paper)
      {
        res.status(200).json({emailSent: paper.emailSent});
      }
    }
    catch(err)
    {
      return res.status(404).json({error: "Some error occurred"});
    }
  }