const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");
const { CompletedPaper, CompletedQuestion } = require("../models/Completed_papers");
const Response = require("../models/Reponse");
const moment = require('moment-timezone');

const moveExpiredReadyPapers = async () => {
  // Current time in UTC, 30 minutes ago
  const thirtyMinutesAgoUTC = moment.utc().subtract(30, 'minutes').toDate();

  try {
    // Find all ReadyPapers whose endTime is more than 30 minutes ago in UTC
    const expiredPapers = await ReadyPaper.find({
      endTime: { $lt: thirtyMinutesAgoUTC },
    });

    if (expiredPapers.length === 0) {
      console.log("No expired papers to move.");
      return;
    }

    // Loop over each expired paper and move it to CompletedPaper
    for (const readyPaper of expiredPapers) {
      const readyPaperId = readyPaper._id;
      const readyQuestions = await ReadyQuestion.find({ paperId: readyPaperId });

      // Create the CompletedPaper with UTC date properties
      const completedPaper = new CompletedPaper({
        className: readyPaper.className,
        semester: readyPaper.semester,
        subject: readyPaper.subject,
        subjectCode: readyPaper.subjectCode,
        date: readyPaper.date, // Already in UTC
        time: readyPaper.time,
        duration: readyPaper.duration,
        marks: readyPaper.marks,
        testType: readyPaper.testType,
        teacherId: readyPaper.teacherId,
        questionIds: "", // Initialize as empty string
        startTime: readyPaper.startTime, // Already in UTC
        endTime: readyPaper.endTime, // Already in UTC
        studentIds: readyPaper.studentIds,
      });

      await completedPaper.save();

      // Mapping from ReadyQuestion ID to CompletedQuestion ID
      const questionIdMap = new Map();

      // Migrate questions and maintain order
      let previousQuestionId = null;
      let questionIds = [];

      for (let question of readyQuestions) {
        const completedQuestion = new CompletedQuestion({
          paperId: completedPaper._id,
          questionheading: question.questionheading,
          questionDescription: question.questionDescription,
          compilerReq: question.compilerReq,
          marks: question.marks,
          image: question.image,
          previousQuestionId: previousQuestionId,
          nextQuestionId: null,
        });

        const savedQuestion = await completedQuestion.save();

        // Map the ReadyQuestion ID to the CompletedQuestion ID
        questionIdMap.set(question._id.toString(), savedQuestion._id.toString());

        // Update the previous question to link to the current one
        if (previousQuestionId) {
          await CompletedQuestion.findByIdAndUpdate(previousQuestionId, {
            nextQuestionId: savedQuestion._id,
          });
        }

        previousQuestionId = savedQuestion._id;
        questionIds.push(savedQuestion._id.toString());
      }

      // Convert array of question IDs to a comma-separated string
      if (questionIds.length > 0) {
        completedPaper.questionIds = questionIds.join(',');
      }

      await completedPaper.save();

      // Update paperId in Response documents
      await Response.updateMany(
        { paperId: readyPaperId },
        { paperId: completedPaper._id }
      );

      // Update questionId in Response documents
      const responses = await Response.find({ paperId: completedPaper._id });

      for (const response of responses) {
        let updated = false;

        response.questions.forEach((questionResponse) => {
          const oldQuestionId = questionResponse.questionId.toString();
          const newQuestionId = questionIdMap.get(oldQuestionId);
          if (newQuestionId) {
            questionResponse.questionId = newQuestionId;
            updated = true;
          }
        });

        if (updated) {
          await response.save();
        }
      }

      // Delete the original ReadyPaper and its questions
      await ReadyPaper.findByIdAndDelete(readyPaperId);
      await ReadyQuestion.deleteMany({ paperId: readyPaperId });

      console.log(`Moved ReadyPaper ${readyPaperId} to CompletedPaper successfully.`);
    }
  } catch (error) {
    console.error("Error while moving expired papers:", error);
  }
};

module.exports = { moveExpiredReadyPapers };
