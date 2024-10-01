const mongoose = require("mongoose");

const CompletedPapersSchema = new mongoose.Schema({
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
  questionIds: String,

  startTime: Date, // Start time as Date object
  endTime: Date,   // End time as Date object
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CompletedPapers = mongoose.model("CompletedPaper", CompletedPapersSchema);
module.exports = CompletedPapers;