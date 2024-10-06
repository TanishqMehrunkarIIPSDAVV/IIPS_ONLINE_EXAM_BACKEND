const {
  ReadyPaper,
  ReadyQuestion,
} = require("../models/Ready_paper_&_question");
const { CompletedPaper, CompletedQuestion } = require("../models/Completed_papers");
const Response = require("../models/Reponse");

const moveExpiredReadyPapers = async () => {
  const thirtyMinutesAgo = new Date(new Date() - 30 * 60 * 1000); // Current time - 30 minutes
    console.log("running" , thirtyMinutesAgo);
  try {
    // Find all ReadyPapers whose endTime is more than 30 minutes ago
    const expiredPapers = await ReadyPaper.find({
      endTime: { $lt: thirtyMinutesAgo },
    });

    // Loop over each expired paper and move it to CompletedPaper
    for (const readyPaper of expiredPapers) {
      const readyPaperId = readyPaper._id;
      const readyQuestions = await ReadyQuestion.find({ paperId: readyPaperId });

      // Create the CompletedPaper
      const completedPaper = new CompletedPaper({
        className: readyPaper.className,
        semester: readyPaper.semester,
        subject: readyPaper.subject,
        subjectCode: readyPaper.subjectCode,
        date: readyPaper.date,
        time: readyPaper.time,
        duration: readyPaper.duration,
        marks: readyPaper.marks,
        testType: readyPaper.testType,
        teacherId: readyPaper.teacherId,
        questionIds: readyPaper.questionIds,
        startTime: readyPaper.startTime,
        endTime: readyPaper.endTime,
        studentIds: readyPaper.studentIds,
      });

      await completedPaper.save();

      // Migrate the questions and maintain order
      let previousQuestionId = null;
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

        // Update the previous question to link to the current one
        if (previousQuestionId) {
          await CompletedQuestion.findByIdAndUpdate(previousQuestionId, { nextQuestionId: savedQuestion._id });
        }

        previousQuestionId = savedQuestion._id;
      }

      // Update paperId in student responses
      await Response.updateMany({ paperId: readyPaperId }, { paperId: completedPaper._id });

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
