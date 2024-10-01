const {
  ReadyPaper,
  ReadyQuestion,
} = require("../models/Ready_paper_&_question");
const Student = require("../models/Student");
const Response = require("../models/Reponse");

// Helper function to format date to 'dd-mm-yyyy'
function formatDateToDDMMYYYY(date) {
  const day = `0${date.getDate()}`.slice(-2);
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to convert time to 24-hour
function parseTimeTo24Hour(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0); // Set the hours and minutes
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

    // Check if the student has already submitted a response for this paper
    const existingResponse = await Response.findOne({
      studentId: student._id,
      paperId: paper._id,
    });

    if (existingResponse) {
      return res.status(403).json({ 
        message: "You have already submitted the response for this paper. You are not allowed to log in again." 
      });
    }

    // Converting both current date and paper date into dd-mm-yyyy format for comparison
    const currentDate = new Date(); // Current date
    const formattedCurrentDate = formatDateToDDMMYYYY(currentDate);
    const formattedPaperDate = formatDateToDDMMYYYY(new Date(paper.date));

    if (formattedCurrentDate !== formattedPaperDate) {
      return res.status(400).json({ message: "No paper available on this date." });
    }

    // Convert current time, startTime, and endTime into Date objects (ignoring date part)
    const currentTime = new Date();
    const paperStartTime = new Date(paper.startTime);
    const paperEndTime = new Date(paper.endTime);

    const earliestLoginTime = new Date(paperStartTime.getTime() - 30 * 60000); // 30 minutes before paper start

    // Checking if the current time is within the allowed login window
    if (currentTime < earliestLoginTime) {
      return res.status(400).json({
        message: "Login allowed only 30 minutes before the paper starts.",
      });
    }

    if (currentTime > paperEndTime) {
      return res.status(400).json({ message: "Login is not allowed after the paper end time." });
    }

    // Check if student ID is already in the studentIds array
    if (!paper.studentIds.includes(student._id)) {
      paper.studentIds.push(student._id); // Add student ID to the paper
      await paper.save(); // Save the updated paper document
    }

    // Fetching the questions related to the paper using paperId
    const questions = await ReadyQuestion.find({ paperId: paper._id });

    // Returning the paper details and questions present in it
    res.status(200).json({
      paperId: paper._id,
      teacherId: paper.teacherId,
      studentId: student._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};