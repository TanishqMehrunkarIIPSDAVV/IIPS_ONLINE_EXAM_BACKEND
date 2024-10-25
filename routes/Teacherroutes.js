const express = require("express");
const {
  login,
  verifyOtp,
  verifySession,
  signUp,
  verifyOtppasscode,
  forgotPassword,
  resetPassword,
  updateTeacherDetailsById,
  getTeacherDetailsById,
  setphoto,

  
} = require("../controllers/TeacherController");
const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signUp);
router.post("/verifypasscode", verifyOtppasscode);
router.post("/verify-session", verifySession);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/edit",updateTeacherDetailsById);
router.post("/getteacherDetails",getTeacherDetailsById);
router.post('/set-photo',setphoto);

module.exports = router;
