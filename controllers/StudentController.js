const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");
const Student = require("../models/Student");
const Response = require("../models/Reponse");
const moment = require('moment-timezone');

const IST_TIMEZONE = 'Asia/Kolkata';

// Helper function to format date to 'dd-MM-yyyy' in the specified timezone
function formatDateToDDMMYYYY(date, timezone = IST_TIMEZONE) {
  return moment.tz(date, timezone).format('DD-MM-YYYY');
}

exports.studentlogin = async (req, res) => {
  const { name, password, rollno, enrollno, subcode, className, semester } = req.body;

  try {
    // Find student based on provided details
    const student = await Student.findOne({
      className: className,
      semester: `${semester}th_sem`,
      fullName: name,
      rollNumber: rollno,
      enrollmentNumber: enrollno,
      password: password,
    });

    if (!student) {
      return res.status(400).json({
        message: "Invalid student details or student not found in the database.",
      });
    }

    // Find paper for the specified class, semester, and subject
    const paper = await ReadyPaper.findOne({
      className: className,
      semester: `${semester}th Sem`,
      subjectCode: subcode,
    });

    if (!paper) {
      return res.status(400).json({ message: "Paper not found for this student." });
    }

    // Check if the student has already submitted a response
    const existingResponse = await Response.findOne({
      studentId: student._id,
      paperId: paper._id,
    });

    if (existingResponse) {
      return res.status(403).json({
        message: "You have already submitted the response for this paper. You are not allowed to log in again."
      });
    }

    // Date and time validations
    const currentDateIST = moment.tz(IST_TIMEZONE);
    const paperDateIST = moment.tz(paper.date, IST_TIMEZONE);

    if (currentDateIST.format('DD-MM-YYYY') !== paperDateIST.format('DD-MM-YYYY')) {
      return res.status(400).json({ message: "No paper available on this date." });
    }

    // Current time, start time, and end time in IST
    const currentTimeIST = moment.tz(IST_TIMEZONE);
    const paperStartTimeIST = moment.tz(paper.startTime, IST_TIMEZONE);
    const paperEndTimeIST = moment.tz(paper.endTime, IST_TIMEZONE);

    console.log("Current Time:", currentTimeIST.format('YYYY-MM-DD HH:mm:ss'));
    console.log("Paper Start Time:", paperStartTimeIST.format('YYYY-MM-DD HH:mm:ss'));
    console.log("Paper End Time:", paperEndTimeIST.format('YYYY-MM-DD HH:mm:ss'));

    // Allow login only 30 minutes before the paper start time
    const earliestLoginTime = paperStartTimeIST.clone().subtract(30, 'minutes');

    if (currentTimeIST.isBefore(earliestLoginTime)) {
      return res.status(400).json({
        message: "Login allowed only 30 minutes before the paper starts.",
      });
    }

    if (currentTimeIST.isAfter(paperEndTimeIST)) {
      return res.status(400).json({ message: "Login is not allowed after the paper end time." });
    }

    // Add student ID to the paper if not already present
    if (!paper.studentIds.includes(student._id)) {
      paper.studentIds.push(student._id);
      await paper.save();
    }

    const questions = await ReadyQuestion.find({ paperId: paper._id });

    res.status(200).json({
      paperId: paper._id,
      teacherId: paper.teacherId,
      studentId: student._id,
    });
  } catch (error) {
    console.error("Error during student login:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
