const express = require("express");
const { login, verifyOtp, verifySession } = require("../controllers/TeacherController");
const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/verify-session", verifySession);

module.exports = router;
