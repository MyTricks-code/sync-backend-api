import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {type: String},
    email : {type: String, required: true, unique: true},
    password: {type : String, required: true},
    verifyOtp : {type: String, default : ''},
    verifyOtpExpireAt : {type: Number, default: 0},
    isAccountVerified: {type: Boolean, default: false},
    resetOtp : {type: String, default :""},
    resetOtpExpireAt : {type: Number, default :0},
    role : {type : String},
    clubs: {type: Array, default: []}
}, {timestamps : true})

const userModel = mongoose.model.user || mongoose.model('user', userSchema)
export default userModel