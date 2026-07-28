import iqacModel from "../models/iqacEvent";

const createIqacEvent = async(req,res)=>{
    const {orgId , title, academicYear, collaborators,eventType,theme,startDate,endDate,budget,studentParticipation,facultyParticipation,description,objectives,pos} = req.body

    if(!orgId || !title || !academicYear){
        return res.json({success:false, message: "Missing Parameters"})
    }

    

}

const updateIqacEvent = async(req,res)=>{

}

const de