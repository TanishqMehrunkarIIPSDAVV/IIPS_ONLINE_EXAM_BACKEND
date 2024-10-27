const {
  ReadyPaper,
  ReadyQuestion,
} = require("../models/Ready_paper_&_question");
const Student = require("../models/Student");
const Response = require("../models/Reponse");
const IST_TIMEZONE = 'Asia/Kolkata';

// Helper function to format date to 'dd-mm-yyyy'
function formatDateToDDMMYYYY(date) {
  const day = `0${date.getUTCDate()}`.slice(-2);
  const month = `0${date.getUTCMonth() + 1}`.slice(-2);
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to convert time to 24-hour in UTC
function parseTimeTo24Hour(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  now.setUTCHours(hours, minutes, 0, 0); // Set the hours and minutes in UTC
  return now;
}

exports.studentlogin = async (req, res) => {
  const {
    name,
    password,
    rollno,
    enrollno,
    subcode,
    subname,
    className,
    semester,
  } = req.body;

  try {
  
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

    const paper = await ReadyPaper.findOne({
      className: className,
      semester: `${semester}th Sem`,
      subjectCode: subcode,
    });

    if (!paper) {
      return res.status(400).json({ message: "Paper not found for this student." });
    }

    const existingResponse = await Response.findOne({
      studentId: student._id,
      paperId: paper._id,
    });

    if (existingResponse) {
      return res.status(403).json({ 
        message: "You have already submitted the response for this paper. You are not allowed to log in again." 
      });
    }

    const currentDate = new Date(); // Current date
    const formattedCurrentDate = formatDateToDDMMYYYY(currentDate);
    const formattedPaperDate = formatDateToDDMMYYYY(new Date(paper.date));

    if (formattedCurrentDate !== formattedPaperDate) {
      return res.status(400).json({ message: "No paper available on this date." });
    }

    const currentTime = new Date(); // Current time in UTC
    const paperStartTime = new Date(paper.startTime);
    const paperEndTime = new Date(paper.endTime);

    const earliestLoginTime = new Date(paperStartTime.getTime() - 30 * 60000); // 30 minutes before paper start

    if (currentTime < earliestLoginTime) {
      return res.status(400).json({
        message: "Login allowed only 30 minutes before the paper starts.",
      });
    }

    if (currentTime > paperEndTime) {
      return res.status(400).json({ message: "Login is not allowed after the paper end time." });
    }

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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
