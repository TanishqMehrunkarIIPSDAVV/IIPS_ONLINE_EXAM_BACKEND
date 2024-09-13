const express = require("express");
const { studentlogin } = require("../controllers/StudentController");
const {getStudentDetailsByStudentId} = require("../controllers/StudentController2");

const router = express.Router();

router.post("/login",studentlogin)
router.post("/getStudentDetailsByStudentId",getStudentDetailsByStudentId);
module.exports = router;

