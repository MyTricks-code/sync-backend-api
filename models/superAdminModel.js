import mongoose from "mongoose";

const superAdminSchema =
new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },

    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    role:{
        type:String,
        enum:[
            "director",
            "principal",
            "jd"
        ],
        required:true
    },

    loginOtp:{
        type:String,
        default:""
    },

    loginOtpExpireAt:{
        type:Number,
        default:0
    },

    isActive:{
        type:Boolean,
        default:true
    }

},{
    timestamps:true,
    collection:"superadmins"
});

export default mongoose.models.SuperAdmin ||
mongoose.model(
    "SuperAdmin",
    superAdminSchema
);
