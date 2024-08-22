const Teacher = require("../models/Teacher");
const { sendOtpToEmail } = require("../config/nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto"); 

const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
        const teacher = await Teacher.findOne({ email });
  
        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }
  
        const isPasswordMatch = await bcrypt.compare(password, teacher.password);
  
        if (!isPasswordMatch) {
            return res.status(400).json({ error: "Invalid password" });
        }
  
        const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
  
        // Store the OTP and expiry in the database
        teacher.otp = otp;
        teacher.otpExpiry = otpExpiry;
        await teacher.save();
  
        await sendOtpToEmail(email, otp);
  
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};
  
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        // Check if OTP matches and is not expired
        if (teacher.otp !== otp || Date.now() > teacher.otpExpiry) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Clear OTP and OTP expiry after successful verification
        teacher.otp = null;
        teacher.otpExpiry = null;

        // Generate session ID and set expiry to 6 hours from now
        const sessionId = crypto.randomBytes(16).toString("hex");
        const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

        teacher.sessions.push({ sessionId, expiresAt });
        await teacher.save();

        res.status(200).json({ message: "Login successful", sessionId });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};




const verifySession = async (req, res) => {
    const { sessionId } = req.body;

    try {
        const teacher = await Teacher.findOne({ "sessions.sessionId": sessionId });

        if (!teacher) {
            return res.status(401).json({ valid: false, error: "Session not found" });
        }

        const session = teacher.sessions.find(s => s.sessionId === sessionId);

        // Check if session has expired
        if (new Date() > session.expiresAt) {
            return res.status(401).json({ valid: false, error: "Session expired" });
        }

        res.status(200).json({ valid: true });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    login,
    verifyOtp,
   verifySession,
};