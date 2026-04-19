import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    owner : {type: String, required: true},
    owner_id : {type: String, required:  true},
    title : {type : String, required : true},
    desc : {type: String, required: true},
    assigners_ids : {type: Array, required: true}
    
}, {timestamps : true})

const taskModel = mongoose.model.task || mongoose.model('task', taskSchema)
export default taskModel