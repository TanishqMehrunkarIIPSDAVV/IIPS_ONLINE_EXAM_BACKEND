const Student = require('../models/Student');
const {
    ReadyPaper,
    ReadyQuestion,
  } = require("../models/Ready_paper_&_question");

exports.getStudentDetailsByStudentId = async(req,res)=>
{
    try
    {
        const {studentId} = req.body;
        const student=await Student.find({_id: studentId});
        if(!student)
        {
            return res.status(404).json({message: "No student found for this id!!!"});
        }
        res.status(200).json({student,message:"Found Student Details"});
    }
    catch(error)
    {
        console.error(error);
        res.status(500).send("Server Error");
    }
}
exports.getQuestionById = async (req, res) => {
    try {
      const questionId =  req.body.questionId;
      if (!questionId) {
        return res.status(400).json({ message: "Question ID is required!" });
      }
  
      const question = await ReadyQuestion.findById(questionId);
  
      if (!question) {
        return res.status(404).json({ message: "No question found for this ID!" });
      }
  
      res.status(200).json({ question, message: "Found Question Details" });
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).send("Server Error");
    }
  };
  
  

  exports.getFirstQuestionByPaperId = async (req, res) => {
    try {
      const { paperId } = req.body; // Ensure you are extracting the paperId from req.body
      
      const firstQuestion = await ReadyQuestion.findOne({
        paperId: paperId, // Use the paperId field, not _id
        previousQuestionId: null // Ensure this condition matches the first question
      });
      console.log("check", firstQuestion);
  
      if (!firstQuestion) {
        return res.status(404).json({ message: "No questions found for this paper or the first question is not defined!" });
      }
  
      res.status(200).json({ question: firstQuestion, message: "Found First Question" });
    } catch (error) {
      console.error("Error fetching first question:", error);
      res.status(500).send("Server Error");
    }
  };
  
  

// Get Previous or Next Question Id
exports.getQuestionNavigation = async (req, res) => {
    try {
      const { questionId, direction } = req.body; 
      
      const currentQuestion = await ReadyQuestion.findById(questionId);
      if (!currentQuestion) {
        return res.status(404).json({ message: "Current question not found!" });
      }
  
      let nextQuestion = null;
  
      if (direction === 'next') {
        if (!currentQuestion.nextQuestionId) {
          return res.status(404).json({ message: "No next question available!" });
        }
        nextQuestion = await ReadyQuestion.findById(currentQuestion.nextQuestionId);
      } else if (direction === 'previous') {
        if (!currentQuestion.previousQuestionId) {
          return res.status(404).json({ message: "No previous question available!" });
        }
        nextQuestion = await ReadyQuestion.findById(currentQuestion.previousQuestionId);
      } else {
        return res.status(400).json({ message: "Invalid direction! Use 'previous' or 'next'." });
      }
  
      if (!nextQuestion) {
        return res.status(404).json({ message: "No question found for the requested navigation!" });
      }
  
      res.status(200).json({ question: nextQuestion, message: "Found Navigated Question" });
    } catch (error) {
      console.error("Error fetching navigated question:", error);
      res.status(500).send("Server Error");
    }
  };




