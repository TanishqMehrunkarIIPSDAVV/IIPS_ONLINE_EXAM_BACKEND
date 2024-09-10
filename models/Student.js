const mongoose = require("mongoose");

const StudentDetailsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const SemesterSchema = new mongoose.Schema({
  semester: {
    type: String,
    required: true,
  },
  students: [StudentDetailsSchema],
});

const ClassSchema = new mongoose.Schema({
  MTECH: [SemesterSchema],
  MCA: [SemesterSchema],
});

const StudentSchema = new mongoose.Schema({
  MTECH: {
    type: ClassSchema,
    required: false,
  },
  MCA: {
    type: ClassSchema,
    required: false,
  },
});

const Student = mongoose.model("Student", StudentSchema);

module.exports = Student;
