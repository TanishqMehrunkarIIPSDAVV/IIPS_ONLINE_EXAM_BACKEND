const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");
const Student = require("../models/Student");
const Response = require("../models/Reponse");
const moment = require('moment-timezone');

const IST_TIMEZONE = 'Asia/Kolkata';

// Helper function to format date to 'dd-MM-yyyy' in UTC
function formatDateToDDMMYYYY(date) {
  return moment.utc(date).format('DD-MM-YYYY');
}


exports.studentlogin = async (req, res) => {
  const { name, password, rollno, enrollno, subcode, className, semester } = req.body;

  try {
    // Find student based on provided details
    const student = await Student.findOne({
      className,
      semester: `${semester}th_sem`,
      fullName: name,
      rollNumber: rollno,
      enrollmentNumber: enrollno,
      password,
    });

    if (!student) {
      return res.status(400).json({
        message: "Invalid student details or student not found in the database.",
      });
    }

    // Find paper for the specified class, semester, and subject
    const paper = await ReadyPaper.findOne({
      className,
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
        message: "You have already submitted the response for this paper. You are not allowed to log in again.",
      });
    }

    // Current UTC time
    const currentTimeUTC = moment.utc();

    // Paper's start and end times in UTC
    const paperStartTimeUTC = moment.utc(paper.startTime);
    const paperEndTimeUTC = moment.utc(paper.endTime);

    console.log("Current UTC Time:", currentTimeUTC.format('YYYY-MM-DD HH:mm:ss'));
    console.log("Paper Start UTC:", paperStartTimeUTC.format('YYYY-MM-DD HH:mm:ss'));
    console.log("Paper End UTC:", paperEndTimeUTC.format('YYYY-MM-DD HH:mm:ss'));

    // Compare only the date part of paper's date and current date
    const paperDateUTC = formatDateToDDMMYYYY(paper.date);
    console.log("", paperDateUTC)
    const currentDateUTC = currentTimeUTC.format('DD-MM-YYYY');

    if (currentDateUTC !== paperDateUTC) {
      return res.status(400).json({ message: "No paper available on this date." });
    }

    // Allow login only 30 minutes before the paper start time
    const earliestLoginTimeUTC = paperStartTimeUTC.clone().subtract(30, 'minutes');

    if (currentTimeUTC.isBefore(earliestLoginTimeUTC)) {
      return res.status(400).json({
        message: "Login allowed only 30 minutes before the paper starts.",
      });
    }

    if (currentTimeUTC.isAfter(paperEndTimeUTC)) {
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
