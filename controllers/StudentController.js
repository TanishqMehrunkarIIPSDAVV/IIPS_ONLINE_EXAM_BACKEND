const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");
const Student = require('../models/Student');

// Helper function to format date to 'dd-mm-yyyy'
function formatDateToDDMMYYYY(date) {
  const day = (`0${date.getDate()}`).slice(-2);
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to convert time to 24-hour format as Date object (ignoring the date part)
function parseTimeTo24Hour(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0); // Set the hours and minutes
  return now;
}

exports.studentlogin = async (req, res) => {
  const { name, password, rollno, enrollno, subcode, subname, className, semester } = req.body;

  try {
    // 1. Validate student details in the student database
    const student = await Student.findOne({
      className: className, // Ensuring case consistency
      semester: `${semester}th_sem`,
      fullName: name,
      rollNumber: rollno,
      enrollmentNumber: enrollno,
      password: password,
    });

    if (!student) {
      return res.status(400).json({ message: 'Invalid student details or student not found in the database.' });
    }

    // 2. Find paper by paperId, className, and semester
    const paper = await ReadyPaper.findOne({
      className: className,
      semester: `${semester}th Sem`,
      subjectCode: subcode,
    });

    if (!paper) {
      return res.status(400).json({ message: 'Paper not found for this student.' });
    }

    // 3. Convert both current date and paper date into dd-mm-yyyy format for comparison
    const currentDate = new Date(); // Current date
    const formattedCurrentDate = formatDateToDDMMYYYY(currentDate);
    const formattedPaperDate = formatDateToDDMMYYYY(new Date(paper.date));

    // Compare the dates in 'dd-mm-yyyy' format
    if (formattedCurrentDate !== formattedPaperDate) {
      return res.status(400).json({ message: 'No paper available on this date.' });
    }

    // 4. Convert current time, startTime, and endTime into Date objects (ignoring date part)
    const currentTime = new Date();
    const paperStartTime = new Date(paper.startTime); // Paper start time from the database
    const paperEndTime = new Date(paper.endTime); // Paper end time from the database

    const earliestLoginTime = new Date(paperStartTime.getTime() - 30 * 60000); // 30 minutes before paper start

    // 5. Check if the current time is within the allowed login window
    if (currentTime < earliestLoginTime) {
      return res.status(400).json({ message: 'Login allowed only 30 minutes before the paper starts.' });
    }

    if (currentTime > paperEndTime) {
      return res.status(400).json({ message: 'Login is not allowed after the paper end time.' });
    }

    // 6. Fetch the questions related to the paper using paperId
    const questions = await ReadyQuestion.find({ paperId: paper._id });

    // 7. Return the paper and questions
    res.status(200).json({ paper, questions });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
