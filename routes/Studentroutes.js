const express = require("express");
const { studentlogin } = require("../controllers/StudentController");
const { getStudentDetailsByStudentId,
        getQuestionNavigation,
        getQuestionById,
        getFirstQuestionByPaperId,
        getQuestionByPaperId, 
        submit,
        getStudentByPaperId,
    } = require("../controllers/StudentController2");
const { compileAndRunCode } = require("../controllers/Compiler");


const router = express.Router();

router.post("/login",studentlogin)
router.post("/getStudentDetailsByStudentId",getStudentDetailsByStudentId);
router.post("/getFirstQuestionByPaperId",getFirstQuestionByPaperId);
router.post("/getQuestionById",getQuestionById);
router.post("/getQuestionNavigation",getQuestionNavigation);
router.post("/getQuestionByPaperId",getQuestionByPaperId);
router.post("/compile",compileAndRunCode);
router.post("/submitResponse",submit);
router.post("/getStudentByPaperId",getStudentByPaperId);

module.exports = router;

