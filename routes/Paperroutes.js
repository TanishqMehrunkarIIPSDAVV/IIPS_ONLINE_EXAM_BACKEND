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

// Upload an image for a question
router.post("/upload", upload.single("file"), uploadQuestionImage);

// Add a new question to a paper
router.post("/add-question", addQuestion);

// Get questions by paper ID (from the request body)
router.post("/questionsbyid", getQuestionsByPaperId);

// Get papers by teacher ID (from the request body)
router.post("/getPapersByTeacherId", getPapersByTeacherId);

module.exports = router;
