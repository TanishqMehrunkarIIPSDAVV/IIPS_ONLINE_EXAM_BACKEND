const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const outputschema = new Schema({
  stdout:String,
  stderr:String
});

const runHistorySchema = new Schema({
  input: String,
  code: String,
  output: outputschema,
  timestamp: { type: Date, default: Date.now },
});

const questionResponseSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  finalCode: String,
  runHistory: [runHistorySchema],
  marks: { type: Number, default: null },
});

const responseSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  paperId: { type: Schema.Types.ObjectId, ref: 'ReadyPaper', required: true },
  questions: [questionResponseSchema], // Array of question responses
}, {
  timestamps: true,
});

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;
