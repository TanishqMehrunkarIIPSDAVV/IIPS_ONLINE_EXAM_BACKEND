const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    enum: ['MTECH', 'MCA'], // You can add more classes if needed
  },
  semester: {
    type: String,
    required: true,
  },
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

const Student = mongoose.model("Student", StudentSchema);

module.exports = Student;
