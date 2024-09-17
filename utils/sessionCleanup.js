const Teacher = require("../models/Teacher");
const {CompletedPaper,CompletedQuestion} = require("../models/CompletedPapers_and_Questions");
const { ReadyPaper, ReadyQuestion } = require("../models/Ready_paper_&_question");

const removeExpiredSessions = async () => {
  try {
    const teachers = await Teacher.find({
      "sessions.expiresAt": { $lt: new Date() },
    });

    for (const teacher of teachers) {
      teacher.sessions = teacher.sessions.filter(
        (session) => new Date(session.expiresAt) > new Date()
      );
      await teacher.save();
    }
  } catch (error) {
    console.error("Error while removing expired sessions:", error);
  }
};

const createCompletePaper= async ()=>
{
    try
    {
        const papers=await ReadyPaper.find({
            "endTime": {$lt: new Date()},
        });
        
        for(const paper of papers)
        {
                const readyPaper= await ReadyPaper.find({
                  _id : paper._id
                });
                const completePaper= new CompletedPaper(
                  {
                    className: readyPaper[0].className,
                    semester: readyPaper[0].semester,
                    subject: readyPaper[0].subject,
                    subjectCode: readyPaper[0].subjectCode,
                    date: readyPaper[0].date,
                    time: readyPaper[0].time,
                    duration: readyPaper[0].duration,
                    marks: readyPaper[0].marks,
                    testType: readyPaper[0].testType,
                    teacherId: readyPaper[0].teacherId,
                    questionIds: readyPaper[0].questionIds,
                    startTime: readyPaper[0].startTime,
                    endTime: readyPaper[0].endTime,
                  }
                );
                await completePaper.save();
                const readyQuestions=await ReadyQuestion.find({
                  paperId : paper._id
                });
                for(let i=0;i<readyQuestions.length;i++)
                {
                    const completeQuestion=new CompletedQuestion(
                      {
                        paperId: readyQuestions[i].paperId,
                        questionheading: readyQuestions[i].questionheading,
                        questionDescription: readyQuestions[i].questionDescription,
                        compilerReq: readyQuestions[i].compilerReq,
                        marks: readyQuestions[i].marks,
                        image: readyQuestions[i].image,
                        previousQuestionId: readyQuestions[i].previousQuestionId,
                        nextQuestionId: readyQuestions[i].nextQuestionId,
                      }
                    );
                    await completeQuestion.save();
                }
                await readyQuestions.deleteMany({paperId: paper._id});
                await readyPaper.findByIdAndDelete(paper._id);
        }
    }
    catch(error)
    {
        console.error(error);
    }
}

module.exports = { removeExpiredSessions, createCompletePaper};
