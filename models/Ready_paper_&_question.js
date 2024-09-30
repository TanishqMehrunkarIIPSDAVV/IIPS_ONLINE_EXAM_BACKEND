const mongoose = require("mongoose");

const ReadyPaperSchema = new mongoose.Schema({
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
  questionIds: String, // Store question IDs as a comma-separated string

  // Add these fields to handle the full start and end time of the paper
  startTime: Date, // The full start time as a Date object
  endTime: Date,   // The full end time as a Date object

  studentIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Student",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const ReadyQuestionSchema = new mongoose.Schema({
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReadyPaper",
    required: true,
  },
  questionheading: String,
  questionDescription: String,
  compilerReq: String,
  marks: Number,
  image: String,
  previousQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReadyQuestion",
  },
  nextQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReadyQuestion",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ReadyPaper = mongoose.model("ReadyPaper", ReadyPaperSchema);
const ReadyQuestion = mongoose.model("ReadyQuestion", ReadyQuestionSchema);

module.exports = { ReadyPaper, ReadyQuestion };
