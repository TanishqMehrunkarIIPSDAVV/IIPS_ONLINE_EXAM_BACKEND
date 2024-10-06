const mongoose = require("mongoose");
const CompletedPaperSchema = new mongoose.Schema({
  className: String,
  semester: String,
  subject: String,
  subjectCode: String,
  date: Date,
  time: String,
  duration: {
    hours: Number,
    minutes: Number,
  },
  marks: Number,
  testType: String,
  teacherId: String,
  questionIds: String, // Comma-separated question IDs
  startTime: Date,
  endTime: Date,
  studentIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Student",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CompletedQuestionSchema = new mongoose.Schema({
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompletedPaper",
    required: true,
  },
  questionheading: String,
  questionDescription: String,
  compilerReq: String,
  marks: Number,
  image: String,
  previousQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompletedQuestion",
  },
  nextQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompletedQuestion",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CompletedPaper = mongoose.model("CompletedPaper", CompletedPaperSchema);
const CompletedQuestion = mongoose.model("CompletedQuestion", CompletedQuestionSchema);

module.exports = { CompletedPaper, CompletedQuestion };
