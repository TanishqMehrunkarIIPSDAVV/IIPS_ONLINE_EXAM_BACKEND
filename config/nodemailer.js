require("dotenv").config();
const nodemailer = require("nodemailer");
const { CompletedPaper } = require("../models/Completed_papers");
const mongoose = require("mongoose");

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to verify transporter connection
async function verifyTransporter() {
  try {
    await transporter.verify();
    console.log("SMTP server is ready to take our messages");
  } catch (error) {
    console.error("Error connecting to SMTP server:", error);
    throw new Error("Failed to connect to the email server. Check your configuration.");
  }
}


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

exports.sendResultsToAttemptedStudents = async (req, res) => {
  try {
    const { paperId, students, evaluationStatus } = req.body;

    // Fetch paper details from the CompletedPaper collection
    const paperDetails = await CompletedPaper.findById(paperId).exec();

    if (!paperDetails) {
      console.error("No paper found for the given ID:", paperId);
      return res.status(404).json({ message: "Paper details not found." });
    }

    // Prepare paper info for the email content
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

    // Process each student in the list
    for (const student of students) {
      const { _id, fullName, email } = student;
      const status = evaluationStatus[_id];

      if (status && status.status === "Evaluated") {
        const mailBody = `
          <p>Dear ${fullName},</p>
          <p>We are pleased to inform you that your results for the recent ${paperInfo.testType} in ${paperInfo.subject} (${paperInfo.subjectCode}) have been evaluated.</p>
          <p>Here are the details of your test:</p>
          <ul>
            <li><strong>Class:</strong> ${paperInfo.className}, Semester ${paperInfo.semester}</li>
            <li><strong>Subject:</strong> ${paperInfo.subject} (${paperInfo.subjectCode})</li>
            <li><strong>Date:</strong> ${paperInfo.date}</li>
            <li><strong>Time:</strong> ${paperInfo.time}</li>
            <li><strong>Duration:</strong> ${paperInfo.duration}</li>
            <li><strong>Maximum Marks:</strong> ${paperInfo.totalMarks}</li>
          </ul>
          <p>You have been awarded a total of <strong>${status.totalMarks} marks</strong> out of ${paperInfo.totalMarks}</p>
          <p>If you have any questions regarding your evaluation, please feel free to reach out.</p>
          <p>Best regards,<br>IIPS DAVV<br>nishantkaushal0708@gmail.com</p>
        `;

        console.log("Sending email to:", email);

        // Send email with the results
        await transporter.sendMail({
          from: `"IIPS-DAVV" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Your Results for ${paperInfo.subject} - ${paperInfo.testType}`,
          html: mailBody,
        });

        console.log(`Result email sent to ${fullName} at ${email}`);
      } else {
        console.log(`No email sent for ${fullName}. Status: ${status ? status.status : "Unknown"}`);
      }
    }
    const paper = await CompletedPaper.findOne({_id: paperId});
    if(paper)
    {
        paper.emailSent = true;
        paper.save();
    }
    res.status(200).json({ message: "Emails sent successfully to evaluated students." , emailSent: true});
  } catch (error) {
    console.error("Error sending result emails:", error);
    res.status(500).json({ message: "Failed to send result emails to attempted students" , emailSent: false});
  }
};