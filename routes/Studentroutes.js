const express = require("express");
const { studentlogin } = require("../controllers/StudentController");
const { getStudentDetailsByStudentId,
        getQuestionNavigation,
        getQuestionById,
        getFirstQuestionByPaperId,
        getQuestionByPaperId 
    } = require("../controllers/StudentController2");


const router = express.Router();

router.post("/login",studentlogin)
router.post("/getStudentDetailsByStudentId",getStudentDetailsByStudentId);
router.post("/getFirstQuestionByPaperId",getFirstQuestionByPaperId);
router.post("/getQuestionById",getQuestionById);
router.post("/getQuestionNavigation",getQuestionNavigation);
router.post("/getQuestionByPaperId",getQuestionByPaperId);

module.exports = router;

