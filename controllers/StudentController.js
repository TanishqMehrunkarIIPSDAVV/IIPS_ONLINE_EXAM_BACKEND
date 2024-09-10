const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");
const Student = require('../models/Student');

exports.studentlogin = async (req, res) => {
  const { name, password, rollno, enrollno, subcode, subname, className, semester } = req.body;

  try {
    // 1. Validate student details in the student database
    const classField = `${className.toUpperCase()}`;
    const student = await Student.findOne({
      [`${classField}`]: {
        $elemMatch: {
          semester: `${semester}th_sem`,
          students: {
            $elemMatch: { fullName: name, rollNumber: rollno, enrollmentNumber: enrollno, password: password },
          }
        }
      }
    });

    if (!student) {
      return res.status(400).json({ message: 'Invalid student details or student not found in the database.' });
    }

    // 2. Check for a paper available within 30 minutes of the current time
    const currentTime = new Date();
    const earliestLoginTime = new Date(currentTime.getTime() - 30 * 60000); // 30 minutes before the start time

    const paper = await ReadyPaper.findOne({
      className: className,
      semester: `${semester}th Sem`,
      subjectCode: subcode,
      startTime: { $gte: earliestLoginTime },
      endTime: { $gte: currentTime },
    });

    if (!paper) {
      return res.status(400).json({ message: 'No paper available at this time.' });
    }

    // 3. Fetch the questions related to the paper using paperId
    const questions = await ReadyQuestion.find({ paperId: paper._id });

    // 4. Return the paper and questions
    res.status(200).json({ paper, questions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
