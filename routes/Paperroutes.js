const express = require("express");
const {
  createPaper,
  uploadQuestionImage,
  addQuestion,
  getQuestionsByPaperId,
  getPapersByTeacherId,
  editPaper,
  deletePaper,
  deleteQuestion,
  duplicatePaper,
  duplicateQuestion,
  getPaperdetailBypaperId,
  getReadyPaperDetailsByPaperId,
  Create_Ready_Paper,
  getReadyPapersByTeacherId,
  editQuestion,
  deleteReadyPaper,
  moveToDashBoard,
  getReadyQuestionPapersByTeacherId,
  editReadyQuestion,
} = require("../controllers/PaperController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Create a new paper
router.post("/create", createPaper);

// Editing a existing paper
router.post("/edit-paper",editPaper);

// Deleting a paper
router.post("/delete-paper",deletePaper);

// Deleting a question
router.post("/delete-question",deleteQuestion);

// Duplicating a paper
router.post("/duplicate-paper",duplicatePaper)

// Duplicating a question
router.post("/duplicate-question",duplicateQuestion)

router.post("/edit-question",editQuestion)

// Upload an image for a question
router.post("/upload", upload.single("file"), uploadQuestionImage);

// Add a new question to a paper
router.post("/add-question", addQuestion);

// Get questions by paper ID (from the request body)
router.post("/questionsbyid", getQuestionsByPaperId);

// Get papers by teacher ID (from the request body)
router.post("/getPapersByTeacherId", getPapersByTeacherId);

// Get paper details by paper ID (from the request body)
router.post("/getPapersdetails", getPaperdetailBypaperId);

router.post("/delete-ready-paper",deleteReadyPaper)

// move ready paper to dashboard
router.post("/move-to-dashboard", moveToDashBoard);

// Get ready paper details by paper ID
router.post("/getReadyPaperDetailsByPaperId",getReadyPaperDetailsByPaperId);
// move paper from dashboard to ready state
router.post("/submitpaper", Create_Ready_Paper);
// Get Ready papers by teacher ID (from the request body)
router.post("/getReadyPapersByTeacherId",getReadyPapersByTeacherId);
//Get Ready question papers by teacher ID
router.post("/getReadyQuestionPapersByTeacherId",getReadyQuestionPapersByTeacherId);

// Edit Ready Question
router.post("/edit-ready-question",editReadyQuestion);

module.exports = router;
