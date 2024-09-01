const mongoose = require("mongoose");

const PaperSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  duration: {
    hours: {
      type: Number,
      required: true,
    },
    minutes: {
      type: Number,
      required: true,
    },
  },
  marks: {
    type: Number,
    required: true,
  },
  testType: {
    type: String,
    required: true,
  },
  teacherId: {
    type: String,
    required: true,
  },
  questionIds: {
    type: String, // Store question IDs as a comma-separated string
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Paper", PaperSchema);
