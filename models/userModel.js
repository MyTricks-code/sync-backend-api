import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {type: String, required :true, unique: true},
    callSign: {type: String},
    email : {type: String, required: true, unique: true},
    password: {type : String, required: true},
    verifyOtp : {type: String, default : ''},
    verifyOtpExpireAt : {type: Number, default: 0},
    isAccountVerified: {type: Boolean, default: false},
    resetOtp : {type: String, default :""},
    resetOtpExpireAt : {type: Number, default :0},
    role : {type : String, default: "rookie"},
    clubs: {type: Array, default: []},
    year : {type: String, required: true},
    bio : {type: String, default : "Rookie Here. Guide me please hui hui"},
    number : {type: Number}
}, {timestamps : true})

const userModel = mongoose.model.user || mongoose.model('user', userSchema)
export default userModel