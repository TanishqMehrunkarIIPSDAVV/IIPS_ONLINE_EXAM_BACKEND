const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  paperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper',
    required: true,
  },
  questionheading: String,
  questionDescription: String,
  compilerReq: String,
  marks: Number,
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Question', QuestionSchema);
