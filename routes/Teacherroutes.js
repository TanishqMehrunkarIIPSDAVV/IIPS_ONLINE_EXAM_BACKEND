const express = require("express");
const { login, verifyOtp, verifySession,signUp, verifyOtppasscode } = require("../controllers/TeacherController");
const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signUp);
router.post("/verifypasscode", verifyOtppasscode);
router.post("/verify-session", verifySession);

module.exports = router;
