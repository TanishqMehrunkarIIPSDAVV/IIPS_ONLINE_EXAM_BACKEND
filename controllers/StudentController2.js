const Student = require('../models/Student');

exports.getStudentDetailsByStudentId = async(req,res)=>
{
    try
    {
        const {studentId} = req.body;
        const student=await Student.find({_id: studentId});
        if(!student)
        {
            return res.status(404).json({message: "No student found for this id!!!"});
        }
        res.status(200).json({student,message:"Found Student Details"});
    }
    catch(error)
    {
        console.error(error);
        res.status(500).send("Server Error");
    }
}