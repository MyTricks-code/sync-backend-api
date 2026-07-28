import mongoose from "mongoose";

const iqacEvent = new mongoose.Schema({
    organization : {type: mongoose.Schema.ObjectId, ref : "Organization", required:true},
    title : {type: String, required: true},
    academicYear : {type: String, required: true},
    collaborators : [
        {
            type: String,
        }
    ],
    eventType : {type: String},
    theme : {type: String, default : "Nil"},
    startDate: {type: String, default : "Nil"},
    endDate: {type: String, default : "Nil"},
    budget : {type: Number, default: 0},
    studentParticipation : {type: Number, default: 0},
    facultyParticipation : {type: Number, default : 0},
    description : [{type: String}],
    objectives: [{type: String}],
    pos: [{type: String}]
})
const iqacModel = mongoose.model.iqacEvent || mongoose.model('iqacEvent', iqacEvent)
export default iqacModel