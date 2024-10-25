require("dotenv").config();
const nodemailer = require("nodemailer");
const { CompletedPaper } = require("../models/Completed_papers");

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail", // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send OTP via email
exports.sendOtpToEmail = async (email, otp, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: text || `Your OTP code is ${otp}`, // Use the provided text or a default message
    });
    console.log("OTP sent successfully via email");
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};
exports.sendResetLinkToEmail = async (email, resetLink) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    });
    console.log("Password reset link sent successfully via email");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

exports.sendResultsToAttemptedStudents = async (paperId, students, evaluationStatus) => {
  try {
    // Retrieve paper details from CompletedPaper collection
    const paperDetails = await CompletedPaper.findById(paperId);

    if (!paperDetails) {
      console.error("No paper found for the given ID:", paperId);
      throw new Error("Paper details not found.");
    }

    const paperInfo = {
      className: paperDetails.className,
      semester: paperDetails.semester,
      subject: paperDetails.subject,
      subjectCode: paperDetails.subjectCode,
      date: paperDetails.date.toDateString(),
      time: paperDetails.time,
      duration: `${paperDetails.duration.hours}h ${paperDetails.duration.minutes}m`,
      totalMarks: paperDetails.marks,
      testType: paperDetails.testType,
    };

    console.log("Paper Info:", paperInfo);
    console.log("Students to evaluate:", students);
    console.log("Evaluation Status:", evaluationStatus);

    // Loop through students who have attempted the paper
    for (const student of students) {
      const { _id, fullName, email } = student;
      const status = evaluationStatus[_id];

      if (status && status.status === "Evaluated") {
        const mailBody = `
          Dear ${fullName},

          We are pleased to inform you that your results for the recent ${paperInfo.testType} in ${paperInfo.subject} (${paperInfo.subjectCode}) have been evaluated.

          Here are the details of your test:
          - **Class**: ${paperInfo.className}, Semester ${paperInfo.semester}
          - **Subject**: ${paperInfo.subject} (${paperInfo.subjectCode})
          - **Date**: ${paperInfo.date}
          - **Time**: ${paperInfo.time}
          - **Duration**: ${paperInfo.duration}
          - **Total Marks**: ${paperInfo.totalMarks}
          
          You have been awarded a total of **${status.totalMarks} marks**.

          If you have any questions regarding your evaluation, please feel free to reach out.

          Best regards,
          [Your School's Name]  
          [Contact Information]
        `;

        // Log email sending details
        console.log("Sending email to:", email, "with body:", mailBody);

        // Send email with the results
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Your Results for ${paperInfo.subject} - ${paperInfo.testType}`,
          html: mailBody,
        });

        console.log(`Result email sent to ${fullName} at ${email}`);
      } else {
        console.log(`No email sent for ${fullName}. Status: ${status ? status.status : 'Unknown'}`);
      }
    }
  } catch (error) {
    console.error("Error sending result emails:", error);
    throw new Error("Failed to send result emails to attempted students");
  }
};
