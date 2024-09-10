const express = require("express");
const { studentlogin } = require("../controllers/StudentController");

const router = express.Router();

router.post("/login",studentlogin)
module.exports = router;

