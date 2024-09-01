const express = require("express");
const {
  createPaper,
  uploadQuestionImage,
  addQuestion,
  getQuestionsByPaperId,
  getPapersByTeacherId,
} = require("../controllers/PaperController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Create a new paper
router.post("/create", createPaper);

// Upload an image for a question
router.post("/upload", upload.single("file"), uploadQuestionImage);

// Add a new question to a paper
router.post("/add-question", addQuestion);

// Get questions by paper ID (from the request body)
router.post("/questionsbyid", getQuestionsByPaperId);

// Get papers by teacher ID (from the request body)
router.post("/getPapersByTeacherId", getPapersByTeacherId);

module.exports = router;
